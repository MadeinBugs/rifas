-- ============================================================
--  Rifa Solidária do Gatinho — Schema do Supabase
--  Rode este arquivo UMA vez no SQL Editor do Supabase.
--  (Database > SQL Editor > New query > colar > Run)
-- ============================================================

-- ── Tabela PÚBLICA (sem dados pessoais) — vai pro Realtime ──
create table if not exists public.numeros (
  numero        int primary key,            -- 1 a 500
  status        text not null default 'livre'
                  check (status in ('livre', 'reservado', 'pago')),
  reservado_em  timestamptz
);

-- ── Tabela PRIVADA (dados pessoais) — nunca exposta ao cliente ──
create table if not exists public.compradores (
  numero    int primary key references public.numeros(numero) on delete cascade,
  nome      text,
  whatsapp  text,
  email     text,
  pix_id    text,                            -- id do pagamento no Mercado Pago
  pago_em   timestamptz
);

-- ── Tabela PRIVADA de PEDIDOS — agrupa N números num único pagamento Pix ──
-- Uma pessoa pode escolher vários números e pagar UM Pix com o total.
-- `numeros` guarda o conjunto reservado; o webhook marca todos como pagos juntos.
-- A PII continua só em `compradores` (1 linha por número); aqui fica só o pagamento.
create table if not exists public.pedidos (
  id             uuid primary key default gen_random_uuid(),
  status         text not null default 'aguardando'
                   check (status in ('aguardando', 'pago', 'expirado', 'pago_expirado')),
  pix_id         text,                       -- id da order no Mercado Pago
  quantidade     int  not null,
  total_centavos int  not null,
  numeros        int[] not null,             -- números reservados neste pedido
  reservado_em   timestamptz not null default now(),
  pago_em        timestamptz,
  criado_em      timestamptz not null default now()
);

-- Garante o status 'pago_expirado' mesmo em bancos criados antes desta versão.
-- (Pagamento que caiu DEPOIS da expiração: o pedido NÃO é confirmado, fica
--  marcado aqui para conferência/reembolso manual no painel.)
do $$
begin
  alter table public.pedidos drop constraint if exists pedidos_status_check;
  alter table public.pedidos
    add constraint pedidos_status_check
    check (status in ('aguardando', 'pago', 'expirado', 'pago_expirado'));
end $$;

-- Vincula cada comprador (1 por número) ao seu pedido (agrupamento do pagamento).
alter table public.compradores
  add column if not exists pedido_id uuid references public.pedidos(id) on delete set null;

-- Marca quando o organizador agradeceu o participante (envio manual via WhatsApp).
alter table public.compradores
  add column if not exists agradecido_em timestamptz;

-- ── Popular 1..500 (idempotente) ──
insert into public.numeros (numero)
select generate_series(1, 500)
on conflict (numero) do nothing;

-- ── Índices ──
create index if not exists idx_numeros_status        on public.numeros(status);
create index if not exists idx_numeros_reservado_em  on public.numeros(reservado_em);
create index if not exists idx_pedidos_status        on public.pedidos(status);
create index if not exists idx_pedidos_reservado_em  on public.pedidos(reservado_em);
create index if not exists idx_pedidos_pix_id        on public.pedidos(pix_id);

-- ── Row Level Security (RLS) ──
alter table public.numeros     enable row level security;
alter table public.compradores enable row level security;
alter table public.pedidos     enable row level security;

-- numeros: leitura pública liberada (contém só número + status, sem PII).
drop policy if exists "numeros_public_read" on public.numeros;
create policy "numeros_public_read"
  on public.numeros
  for select
  to anon, authenticated
  using (true);

-- Sem policies de INSERT/UPDATE/DELETE em `numeros` → só o backend
-- (service role) consegue escrever, pois o service role ignora RLS.
--
-- `compradores`: NENHUMA policy criada de propósito → a tabela fica
-- 100% invisível para anon/authenticated. Apenas o backend (service role)
-- a acessa.

-- ── GRANTs explícitos (privilégios de tabela) ──
-- Necessário porque criamos o projeto com "Automatically expose new tables"
-- DESLIGADO: nenhum role recebe acesso por padrão, então liberamos na mão.
-- (No Postgres, GRANT é a 1ª camada; a RLS acima é a 2ª. As duas precisam passar.)

-- numeros: leitura pública (anon + authenticated). Escrita é só do backend.
grant select on public.numeros to anon, authenticated;
grant select, insert, update, delete on public.numeros to service_role;

-- compradores: SEM grant para anon/authenticated → permanece invisível.
-- Apenas o backend (service role) acessa os dados pessoais.
grant select, insert, update, delete on public.compradores to service_role;

-- pedidos: SEM grant para anon/authenticated → invisível ao cliente.
-- Apenas o backend (service role) cria/atualiza pedidos e confirma pagamentos.
grant select, insert, update, delete on public.pedidos to service_role;

-- ── Tabela SORTEIO (singleton: apenas 1 linha) ──
-- Persiste o vencedor para que o resultado seja auditável e irreversível
-- sem ação explícita. id = 1 é forçado via check, garantindo uma única linha
-- a nível de banco (tentativa de 2ª inserção = conflito de PK).
-- Nome do ganhador é resolvido via join com `compradores` em runtime (PII separado).
create table if not exists public.sorteio (
  id          int primary key default 1 check (id = 1),
  numero      int not null references public.numeros(numero) on delete restrict,
  sorteado_em timestamptz not null default now()
);

alter table public.sorteio enable row level security;
-- Nenhuma policy para anon/authenticated → invisível ao client.
-- Apenas o backend (service role) acessa.
grant select, insert, update, delete on public.sorteio to service_role;

-- ── Realtime: publicar SOMENTE a tabela `numeros` ──
-- (equivale a marcar a tabela em Database > Replication no painel)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'numeros'
  ) then
    execute 'alter publication supabase_realtime add table public.numeros';
  end if;
end $$;
