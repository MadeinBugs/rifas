-- ============================================================
--  Reserva atômica de número (anti-duplo-clique) + expiração lazy
--  Rode este arquivo UMA vez no SQL Editor do Supabase.
--
--  Por que uma função (RPC)?
--  Garante que a reserva aconteça em UM único UPDATE atômico no
--  Postgres — dois cliques simultâneos no mesmo número nunca podem
--  reservar ao mesmo tempo. Também "rouba" reservas vencidas (+15min)
--  na hora, sem depender do cron.
-- ============================================================

create or replace function public.reservar_numero(p_numero int)
returns public.numeros
language plpgsql
as $$
declare
  v_row public.numeros;
begin
  update public.numeros
  set status = 'reservado',
      reservado_em = now()
  where numero = p_numero
    and (
      status = 'livre'
      or (status = 'reservado' and reservado_em < now() - interval '15 minutes')
    )
  returning * into v_row;

  -- v_row é NULL se nenhuma linha casou (número 'pago' ou reservado há <15min).
  return v_row;
end;
$$;

-- Apenas o backend (service role) executa esta função.
revoke all on function public.reservar_numero(int) from public, anon, authenticated;
grant execute on function public.reservar_numero(int) to service_role;
