# 🐱 Plano de Implementação — Rifa Solidária do Gatinho

---

## 📦 Stack Final

| Camada | Tecnologia | Custo |
|--------|-----------|-------|
| Frontend + Backend | **Next.js (App Router)** | Grátis |
| Hospedagem | **Vercel (Hobby)** | Grátis |
| Banco de dados | **Supabase (Postgres + Realtime)** | Grátis |
| Pagamento | **Mercado Pago API (Pix)** | ~0,99% por venda |
| Expirar reservas | **`pg_cron` no Supabase + expiração lazy** | Grátis |

> ⚠️ **Decisão (Vercel Hobby):** o plano grátis da Vercel **só permite cron 1x por dia** — expressões como `*/5 * * * *` **falham no deploy**. Por isso a expiração de reservas roda **dentro do Postgres** via `pg_cron` (grátis no Supabase), reforçada por **expiração lazy** na própria query de reserva. Nada de `vercel.json` com cron.

---

## 🗂️ Estrutura de Pastas

```
rifa-gatinho/
├── app/
│   ├── page.tsx                 # Grid de 500 números (home)
│   ├── comprar/
│   │   └── [numero]/page.tsx     # Form + QR Code Pix
│   ├── sorteio/page.tsx          # Página especial da live (confetes)
│   ├── admin/page.tsx            # Painel protegido por senha
│   └── api/
│       ├── reservar/route.ts     # Reserva atômica + lazy expire + cria Pix no MP
│       ├── webhook/route.ts      # Recebe e VALIDA confirmação do MP
│       └── status/route.ts       # Cliente consulta se Pix caiu
├── lib/
│   ├── supabase.ts               # Cliente Supabase (service role, só backend)
│   └── mercadopago.ts            # Cliente MP
├── components/
│   ├── GridNumeros.tsx
│   ├── QRCodePix.tsx
│   └── HistoriaGato.tsx
└── .env.local

# Sem vercel.json com cron: a expiração roda no Supabase (pg_cron) + lazy expire.
```

---

## 🗄️ Schema do Supabase

> ⚠️ **Decisão (privacidade/segurança):** os dados pessoais foram separados em **duas tabelas**.
> A tabela `numeros` é **pública** (vai pro Realtime e é lida pela `anon key` no navegador) e **não contém PII**.
> A tabela `compradores` guarda nome/WhatsApp/e-mail e **só é acessada pelo backend** (service role). Assim o Realtime nunca transmite dados pessoais e a anon key não consegue fraudar status.

```sql
-- ── Tabela PÚBLICA (sem dados pessoais) — vai pro Realtime ──
create table numeros (
  numero        int primary key,            -- 1 a 500
  status        text default 'livre',       -- 'livre' | 'reservado' | 'pago'
  reservado_em  timestamptz
);

-- ── Tabela PRIVADA (dados pessoais) — nunca exposta ao cliente ──
create table compradores (
  numero    int primary key references numeros(numero),
  nome      text,
  whatsapp  text,
  email     text,
  pix_id    text,                            -- id do pagamento MP
  pago_em   timestamptz
);

-- Popular 1 a 500
insert into numeros (numero)
select generate_series(1, 500);

-- Index pra performance
create index idx_status on numeros(status);
create index idx_reservado_em on numeros(reservado_em);

-- ── Row Level Security (RLS) ──
alter table numeros enable row level security;
alter table compradores enable row level security;

-- numeros: leitura pública liberada (só tem nº + status, sem PII)
create policy "numeros_public_read"
  on numeros for select
  to anon
  using (true);
-- Nenhuma policy de INSERT/UPDATE/DELETE para anon → só o backend (service role) escreve.

-- compradores: NENHUMA policy para anon → tabela 100% invisível ao cliente.
-- O service role ignora RLS, então o backend acessa normalmente.

-- Habilitar Realtime SOMENTE em `numeros`
-- (painel Supabase: Database > Replication > marcar apenas a tabela `numeros`)
```

---

## 🔄 Fluxo Completo

```
1. Cliente abre / → vê grid (Realtime em `numeros`: atualiza sozinho)
2. Clica num número livre → vai pra /comprar/[numero]
3. Preenche Nome + WhatsApp (email opcional) → POST /api/reservar
   ├── Backend (service role): UPDATE numeros SET status='reservado'
   │   WHERE numero=X AND status='livre' (ou reserva vencida) ← ATÔMICO + LAZY EXPIRE
   ├── Grava PII em `compradores` (nome/whatsapp/email)
   ├── Se conseguiu: cria Pix no MP
   │     • external_reference = numero
   │     • date_of_expiration ≈ 15min (casado com a reserva)
   │     • header X-Idempotency-Key = rifa-<numero>-<timestamp>
   └── Retorna QR Code + código copia-e-cola
4. Página mostra QR Code + faz polling em /api/status a cada 5s
5. Cliente paga no banco
6. MP envia POST → /api/webhook
   ├── Valida assinatura (header x-signature + x-request-id) com o secret do MP
   ├── Faz GET /v1/payments/{id} e confirma status === 'approved'
   ├── Idempotente: marcar pago 2x não dispara efeito duplicado
   ├── UPDATE numeros SET status='pago'  +  compradores.pago_em=now()
   └── Realtime risca o número pra todos automaticamente ✅
7. Página do cliente detecta "pago" → mostra "Boa sorte! 🍀"

EM PARALELO (expiração de reservas, SEM Vercel Cron):
- pg_cron (Supabase) roda a cada 5min → libera reservas com +15min
- Lazy expire: a própria query de /api/reservar "rouba" reservas vencidas na hora
```

---

## ⚙️ Pontos Técnicos Críticos (avise seu LLM)

### 1. Reserva atômica + expiração lazy (anti-duplo-clique)
A query reserva o número se ele estiver **livre** OU se for uma **reserva vencida** (+15min). Isso resolve a race condition E libera reservas mortas na hora, sem depender de cron.
```sql
UPDATE numeros
SET status = 'reservado', reservado_em = now()
WHERE numero = $1
  AND (status = 'livre'
       OR (status = 'reservado' AND reservado_em < now() - interval '15 minutes'))
RETURNING *;
-- Se retornar 0 linhas → número 'pago' ou reservado há <15min → avisar cliente
```
Os dados pessoais vão em UMA escrita separada na tabela privada (mesmo request do backend):
```sql
insert into compradores (numero, nome, whatsapp, email)
values ($1, $2, $3, $4)
on conflict (numero) do update
  set nome=excluded.nome, whatsapp=excluded.whatsapp, email=excluded.email,
      pix_id=null, pago_em=null;
```

### 2. Webhook do Mercado Pago — SEMPRE validar
```
NUNCA confie no payload cru. Ao receber notificação:
1. VALIDE A ASSINATURA: monte o manifest com os headers x-signature
   (ts + v1) e x-request-id + data.id e compare o HMAC-SHA256 usando
   o secret de assinatura do webhook (MP_WEBHOOK_SECRET).
2. Pegue o payment_id do corpo (data.id)
3. Faça GET na API do MP: /v1/payments/{id}
4. Confirme status === 'approved'
5. IDEMPOTÊNCIA: se o número já estiver 'pago', responda 200 e pare
   (não reprocessar). Marcar pago 2x não pode duplicar efeitos.
6. Só então: UPDATE numeros SET status='pago'
   + compradores SET pix_id=$id, pago_em=now()
7. EDGE CASE: se o pagamento aprovou mas o número não está mais
   reservado pra esse comprador (expirou e foi de outro), NÃO marque;
   registre/avise você (plano B = estorno manual no painel do MP).
```

### 3. Expiração de reservas — `pg_cron` no Supabase (NÃO Vercel Cron)
O Vercel Hobby limita cron a 1x/dia, então a expiração roda **dentro do Postgres**. Ative a extensão `pg_cron` (painel Supabase: **Database > Extensions** → ligar `pg_cron`) e agende:
```sql
select cron.schedule(
  'expirar-reservas',
  '*/5 * * * *',
  $$
    -- limpa a PII da reserva vencida...
    update compradores c
    set nome=null, whatsapp=null, email=null, pix_id=null
    from numeros n
    where c.numero = n.numero
      and n.status = 'reservado'
      and n.reservado_em < now() - interval '15 minutes';

    -- ...e libera o número (Realtime atualiza a grade sozinho)
    update numeros
    set status='livre', reservado_em=null
    where status='reservado'
      and reservado_em < now() - interval '15 minutes';
  $$
);
```
> A **expiração lazy** (ver item 1) é a primeira linha de defesa e age na hora; o `pg_cron` serve pra refletir a liberação na grade visual mesmo sem ninguém tentar reservar.

### 4. Proteção do `/admin`
Senha via variável de ambiente, validada no **backend** (server component / route handler), com **cookie `httpOnly` + `Secure` + `SameSite`** e comparação em **tempo constante** (`crypto.timingSafeEqual`). Nunca exponha a senha no client. Se quiser zero dor de cabeça, Supabase Auth com um único usuário. O painel acessa a tabela `compradores` via service role (backend).

---

## 🔑 Variáveis de Ambiente (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # público: só lê `numeros` + Realtime
SUPABASE_SERVICE_ROLE_KEY=...        # SÓ backend: escreve e lê `compradores`
MP_ACCESS_TOKEN=...                  # produção, não teste!
MP_WEBHOOK_SECRET=...                # secret de assinatura do webhook (validar x-signature)
ADMIN_PASSWORD=...                   # senha do painel
NEXT_PUBLIC_BASE_URL=https://...     # pra montar a URL do webhook
```
> **Mercado Pago:** não precisa de "conta de desenvolvedor" separada — sua conta já serve. Em [Suas Integrações](https://www.mercadopago.com.br/developers/panel), crie uma **aplicação** para obter o `MP_ACCESS_TOKEN` (produção) e o `MP_WEBHOOK_SECRET`. Sua chave Pix do banco (onde o dinheiro cai) é independente disso.

---

## 📋 Ordem de Construção (passo a passo)

**Fase 1 — Fundação**
1. Criar projeto Next.js + deploy vazio na Vercel (Hobby)
2. Criar projeto Supabase + rodar o schema SQL (2 tabelas + RLS + Realtime só em `numeros`)
3. Ativar extensão `pg_cron` e agendar o job de expiração
4. Conectar Next.js ↔ Supabase (anon no client, service role no backend)

**Fase 2 — Frontend público**
4. Componente `GridNumeros` (500 botões coloridos)
5. Realtime: grid atualiza ao vivo
6. Página da história do gato + fotos + orçamento

**Fase 3 — Pagamento (coração do projeto)**
7. Conta Mercado Pago + Access Token produção
8. `/api/reservar` (reserva atômica + cria Pix)
9. Página `/comprar/[numero]` com QR Code + polling
10. `/api/webhook` (validação + marca pago)
11. Configurar URL do webhook no painel MP

**Fase 4 — Admin**
12. Painel `/admin` protegido (cookie httpOnly + senha em env), lendo `compradores` via service role: total arrecadado, lista de compradores, botão de sortear.
    *(Expiração já está coberta pelo `pg_cron` + lazy expire — sem cron na Vercel.)*

**Fase 5 — Sorteio & Polish**
14. Página `/sorteio` com confetes (lib `canvas-confetti`)
15. Sorteio random entre `status='pago'`
16. Testes com pagamentos reais de baixo valor

---

## 🧪 Não esqueça de testar

- [ ] Pix de teste (sandbox MP) antes de ir ao ar
- [ ] **Um Pix real de R$10** seu, ponta a ponta, antes de divulgar
- [ ] Duplo-clique no mesmo número (race condition)
- [ ] Reserva expira: lazy expire (tentar reservar de novo) **e** pg_cron (esperar liberar sozinha na grade)
- [ ] Webhook chegando e riscando o número
- [ ] Webhook com **assinatura inválida** é REJEITADO (segurança)
- [ ] Webhook duplicado não marca pago 2x (idempotência)
- [ ] **Vazamento de PII:** abrir a grade com a anon key NÃO deve expor nome/WhatsApp/e-mail (Realtime e SELECT só em `numeros`)
- [ ] Pix expira junto com a reserva (`date_of_expiration` ≈ 15min)

---

## 🎯 Prompt Mestre para seu Agente LLM

> Copie isto pro seu agente quando começar:

```
Vou construir um site de rifa solidária para o tratamento do meu 
gato com linfoma. Stack: Next.js (App Router) + Supabase + 
Mercado Pago (Pix) + Vercel (plano Hobby/grátis).

REGRAS DE NEGÓCIO:
- 500 números, R$10 cada. Prêmio único: R$100 em iFood Card (enviado por WhatsApp).
- Cliente clica número livre → preenche Nome + WhatsApp (email opcional) 
  → gera QR Code Pix de R$10 via API Mercado Pago.
- Número fica RESERVADO por 15min. Se não pagar, é liberado.

DECISÕES TÉCNICAS (seguir à risca):
- DUAS TABELAS por privacidade: `numeros` (numero, status, reservado_em) 
  é PÚBLICA e vai pro Realtime; `compradores` (numero, nome, whatsapp, 
  email, pix_id, pago_em) é PRIVADA. RLS ligado nas duas: anon só faz 
  SELECT em `numeros`; `compradores` é invisível ao anon. Toda escrita 
  pelo backend com service role.
- Reserva ATÔMICA + LAZY EXPIRE numa query só: 
  UPDATE numeros SET status='reservado', reservado_em=now() 
  WHERE numero=$1 AND (status='livre' OR (status='reservado' 
  AND reservado_em < now() - interval '15 minutes')) RETURNING *;
- Expiração NÃO usa Vercel Cron (Hobby = 1x/dia, falha no deploy). 
  Usar pg_cron no Supabase (a cada 5min) + a lazy expire acima. 
  SEM vercel.json com cron.
- Pix criado com date_of_expiration ≈ 15min (casado com a reserva) e 
  header X-Idempotency-Key = rifa-<numero>-<timestamp>.
- external_reference do pagamento = número da rifa.
- Webhook do MP: (1) VALIDAR ASSINATURA via HMAC-SHA256 com 
  MP_WEBHOOK_SECRET usando x-signature + x-request-id; 
  (2) GET /v1/payments/{id} e confirmar status==='approved'; 
  (3) IDEMPOTENTE (se já 'pago', parar); (4) só então marcar pago. 
  NUNCA confiar no payload cru.
- Painel /admin protegido: senha em env, validada no backend, cookie 
  httpOnly+Secure, comparação em tempo constante. Mostra total 
  arrecadado, lista de compradores (via service role), botão de sortear.
- Página /sorteio com canvas-confetti pra live do Instagram, 
  sorteando random apenas entre status='pago'.

Comece pela Fase 1 (fundação). Me guie passo a passo, 
um arquivo de cada vez, explicando cada decisão.
```

---

## ⚠️ Lembretes finais (não-técnicos)

1. **Linguagem:** considere "ação entre amigos" em vez de "rifa" no site (cautela legal).
2. **Foto do gato + orçamento vet** = mais doações e confiança.
3. Tenha o **iFood Card** pronto pra enviar no dia.
4. Faça **um Pix real de teste** antes de divulgar pra qualquer pessoa.
5. **LGPD:** você coleta nome/WhatsApp/e-mail. Inclua uma linha curta dizendo que os dados servem só pra contato sobre a rifa e não serão compartilhados. A `pg_cron` já apaga a PII de reservas que expiram.

Está tudo pronto pra começar. Boa sorte com o projeto e **força pro gatinho**. 🐾🍀

Quando começar a construir e travar em algo técnico, é só me chamar.