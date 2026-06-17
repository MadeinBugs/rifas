-- ============================================================
--  Expiração de reservas via pg_cron
--  (NÃO usamos Vercel Cron: o plano Hobby limita cron a 1x/dia)
--
--  PRÉ-REQUISITO: habilitar a extensão pg_cron antes de rodar:
--    Database > Extensions > procurar "pg_cron" > ligar.
--
--  Rode este arquivo UMA vez no SQL Editor do Supabase.
-- ============================================================

-- Garante a extensão (caso ainda não tenha sido ligada pelo painel)
create extension if not exists pg_cron;

-- Remove agendamento anterior, se existir (torna o script idempotente)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'expirar-reservas') then
    perform cron.unschedule('expirar-reservas');
  end if;
end $$;

-- Agenda: a cada 5 minutos, libera reservas com mais de 15 minutos.
select cron.schedule(
  'expirar-reservas',
  '*/5 * * * *',
  $$
    -- 0) marca pedidos vencidos como expirados (agrupa N números num pagamento)
    update public.pedidos
    set status = 'expirado'
    where status = 'aguardando'
      and reservado_em < now() - interval '15 minutes';

    -- 1) limpa a PII das reservas vencidas
    update public.compradores c
    set nome = null, whatsapp = null, email = null, pix_id = null
    from public.numeros n
    where c.numero = n.numero
      and n.status = 'reservado'
      and n.reservado_em < now() - interval '15 minutes';

    -- 2) libera os números (o Realtime atualiza a grade de todos)
    update public.numeros
    set status = 'livre', reservado_em = null
    where status = 'reservado'
      and reservado_em < now() - interval '15 minutes';
  $$
);

-- Conferir o agendamento:
--   select jobid, jobname, schedule, active from cron.job;
