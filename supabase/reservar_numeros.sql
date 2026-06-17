-- ============================================================
--  Reserva atômica de VÁRIOS números (compra múltipla) + substituição
--  Rode este arquivo UMA vez no SQL Editor do Supabase.
--
--  Diferença para reservar_numero (1 número):
--  A pessoa escolhe um conjunto de números e paga UM Pix com o total.
--  Se algum número "voar" (foi reservado/pago por outra pessoa entre a
--  seleção e o checkout), NÃO diminuímos a quantidade — sorteamos um
--  número livre como SUBSTITUTO, mantendo o total que a pessoa decidiu
--  pagar (ex.: escolheu 3 → paga por 3, nunca por 2).
--
--  Tudo num único bloco atômico: dois checkouts simultâneos nunca
--  reservam o mesmo número (locks do Postgres + FOR UPDATE SKIP LOCKED).
-- ============================================================

create or replace function public.reservar_numeros(p_numeros int[])
returns setof public.numeros
language plpgsql
as $$
declare
  v_solicitados int := coalesce(array_length(p_numeros, 1), 0);
  v_reservados  int[] := '{}';
  v_extra       int[];
  v_faltam      int;
begin
  if v_solicitados = 0 then
    return;
  end if;

  -- 1) Reserva os números pedidos que estão disponíveis
  --    (livre OU reserva vencida há mais de 15 min → expiração lazy).
  with atualizados as (
    update public.numeros
       set status = 'reservado',
           reservado_em = now()
     where numero = any(p_numeros)
       and (
         status = 'livre'
         or (status = 'reservado' and reservado_em < now() - interval '15 minutes')
       )
    returning numero
  )
  select coalesce(array_agg(numero), '{}') into v_reservados from atualizados;

  v_faltam := v_solicitados - coalesce(array_length(v_reservados, 1), 0);

  -- 2) Substitui os que "voaram" por números livres aleatórios, preservando a
  --    quantidade escolhida. SKIP LOCKED evita que dois checkouts simultâneos
  --    peguem o mesmo substituto.
  if v_faltam > 0 then
    with candidatos as (
      select numero
        from public.numeros
       where (
               status = 'livre'
               or (status = 'reservado' and reservado_em < now() - interval '15 minutes')
             )
         and numero <> all(p_numeros)
       order by random()
       limit v_faltam
       for update skip locked
    ),
    atualizados as (
      update public.numeros n
         set status = 'reservado',
             reservado_em = now()
        from candidatos c
       where n.numero = c.numero
      returning n.numero
    )
    select coalesce(array_agg(numero), '{}') into v_extra from atualizados;

    v_reservados := v_reservados || v_extra;
  end if;

  -- 3) Devolve todas as linhas reservadas por esta chamada (pedidos + substitutos).
  return query
    select *
      from public.numeros
     where numero = any(v_reservados)
     order by numero;
end;
$$;

-- Apenas o backend (service role) executa esta função.
revoke all on function public.reservar_numeros(int[]) from public, anon, authenticated;
grant execute on function public.reservar_numeros(int[]) to service_role;
