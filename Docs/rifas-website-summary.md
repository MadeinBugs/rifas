# 🐱 Plano de Implementação — Rifa Solidária do Gatinho

---

## 📦 Stack Final

| Camada | Tecnologia | Custo |
|--------|-----------|-------|
| Frontend + Backend | **Next.js (App Router)** | Grátis |
| Hospedagem | **Vercel** | Grátis |
| Banco de dados | **Supabase (Postgres + Realtime)** | Grátis |
| Pagamento | **Mercado Pago API (Pix)** | ~0,99% por venda |
| Cron (expirar reservas) | **Vercel Cron** | Grátis |

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
│       ├── reservar/route.ts     # Reserva número + cria Pix no MP
│       ├── webhook/route.ts      # Recebe confirmação do MP
│       ├── status/route.ts       # Cliente consulta se Pix caiu
│       └── cron/expirar/route.ts # Libera reservas vencidas
├── lib/
│   ├── supabase.ts               # Cliente Supabase
│   └── mercadopago.ts            # Cliente MP
├── components/
│   ├── GridNumeros.tsx
│   ├── QRCodePix.tsx
│   └── HistoriaGato.tsx
├── vercel.json                   # Config do cron
└── .env.local
```

---

## 🗄️ Schema do Supabase

```sql
-- Tabela principal
create table numeros (
  numero        int primary key,           -- 1 a 500
  status        text default 'livre',       -- 'livre' | 'reservado' | 'pago'
  reservado_em  timestamptz,
  nome          text,
  whatsapp      text,
  email         text,
  pix_id        text,                        -- id do pagamento MP
  pago_em       timestamptz
);

-- Popular 1 a 500
insert into numeros (numero)
select generate_series(1, 500);

-- Index pra performance
create index idx_status on numeros(status);

-- Habilitar Realtime na tabela (via painel Supabase: Database > Replication)
```

---

## 🔄 Fluxo Completo

```
1. Cliente abre / → vê grid (Realtime: atualiza sozinho)
2. Clica num número livre → vai pra /comprar/[numero]
3. Preenche Nome + WhatsApp (email opcional) → POST /api/reservar
   ├── Backend: UPDATE numeros SET status='reservado'
   │   WHERE numero=X AND status='livre'   ← ATÔMICO (anti-race)
   ├── Se conseguiu: cria pagamento Pix no MP (external_reference = numero)
   └── Retorna QR Code + código copia-e-cola
4. Página mostra QR Code + faz polling em /api/status a cada 5s
5. Cliente paga no banco
6. MP envia POST → /api/webhook
   ├── Valida consultando a API do MP
   ├── UPDATE numeros SET status='pago', pago_em=now()
   └── Realtime risca o número pra todos automaticamente ✅
7. Página do cliente detecta "pago" → mostra "Boa sorte! 🍀"

EM PARALELO:
- Vercel Cron roda a cada 5min → libera reservas com +15min
```

---

## ⚙️ Pontos Técnicos Críticos (avise seu LLM)

### 1. Reserva atômica (anti-duplo-clique)
```sql
UPDATE numeros
SET status = 'reservado', reservado_em = now(),
    nome = $1, whatsapp = $2, email = $3
WHERE numero = $4 AND status = 'livre'
RETURNING *;
-- Se retornar 0 linhas → número já foi pego, avisar cliente
```

### 2. Webhook do Mercado Pago — SEMPRE validar
```
NUNCA confie no payload cru. Ao receber notificação:
1. Pegue o payment_id do corpo
2. Faça GET na API do MP: /v1/payments/{id}
3. Confirme status === 'approved'
4. Só então marque como pago
```

### 3. Expiração de reservas (cron)
```sql
UPDATE numeros
SET status = 'livre', reservado_em = null,
    nome = null, whatsapp = null, email = null, pix_id = null
WHERE status = 'reservado'
  AND reservado_em < now() - interval '15 minutes';
```

### 4. Vercel Cron (`vercel.json`)
```json
{
  "crons": [{
    "path": "/api/cron/expirar",
    "schedule": "*/5 * * * *"
  }]
}
```

### 5. Proteção do `/admin`
Senha simples via variável de ambiente + cookie, ou Supabase Auth. Para algo pontual, **senha única no .env** já basta.

---

## 🔑 Variáveis de Ambiente (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # só backend
MP_ACCESS_TOKEN=...                  # produção, não teste!
ADMIN_PASSWORD=...                   # senha do painel
NEXT_PUBLIC_BASE_URL=https://...     # pra webhook
```

---

## 📋 Ordem de Construção (passo a passo)

**Fase 1 — Fundação**
1. Criar projeto Next.js + deploy vazio na Vercel
2. Criar projeto Supabase + rodar o schema SQL
3. Conectar Next.js ↔ Supabase

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

**Fase 4 — Automação & Admin**
12. `/api/cron/expirar` + `vercel.json`
13. Painel `/admin` (vendas, lista, total arrecadado)

**Fase 5 — Sorteio & Polish**
14. Página `/sorteio` com confetes (lib `canvas-confetti`)
15. Sorteio random entre `status='pago'`
16. Testes com pagamentos reais de baixo valor

---

## 🧪 Não esqueça de testar

- [ ] Pix de teste (sandbox MP) antes de ir ao ar
- [ ] **Um Pix real de R$10** seu, ponta a ponta, antes de divulgar
- [ ] Duplo-clique no mesmo número (race condition)
- [ ] Deixar reserva expirar e ver liberar sozinha
- [ ] Webhook chegando e riscando o número

---

## 🎯 Prompt Mestre para seu Agente LLM

> Copie isto pro seu agente quando começar:

```
Vou construir um site de rifa solidária para o tratamento do meu 
gato com linfoma. Stack: Next.js (App Router) + Supabase + 
Mercado Pago (Pix) + Vercel.

REGRAS DE NEGÓCIO:
- 500 números, R$10 cada. Prêmio: R$100 em iFood Card (enviado por WhatsApp).
- Cliente clica número livre → preenche Nome + WhatsApp (email opcional) 
  → gera QR Code Pix de R$10 via API Mercado Pago.
- Número fica RESERVADO por 15min. Se não pagar, é liberado por cron.
- Reserva deve ser ATÔMICA (UPDATE WHERE status='livre') pra evitar 
  dois clientes no mesmo número.
- Webhook do MP confirma pagamento → marca número como 'pago' → 
  Supabase Realtime atualiza a grid de todos.
- IMPORTANTE: no webhook, NUNCA confiar no payload; sempre validar 
  consultando GET /v1/payments/{id} na API do MP.
- external_reference do pagamento = número da rifa (pra identificação).
- Painel /admin protegido por senha (env var) com: total arrecadado, 
  lista de compradores, botão de sortear.
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

Está tudo pronto pra começar. Boa sorte com o projeto e **força pro gatinho**. 🐾🍀

Quando começar a construir e travar em algo técnico, é só me chamar.