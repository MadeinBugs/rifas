import "server-only";
import { createServiceClient } from "@/lib/supabase-admin";
import { consultarOrder } from "@/lib/mercadopago";

export type ResultadoConfirmacao = {
  numero: number | null;
  paid: boolean;
  /** true se o número já estava marcado como pago antes desta chamada. */
  jaEstavaPago: boolean;
};

/**
 * Confirma um pagamento a partir do id da order do Mercado Pago.
 *
 * Fluxo seguro (usado pelo webhook e pelo polling de /api/status):
 * 1. NUNCA confia no payload — consulta a order no MP.
 * 2. Só marca como pago se o MP confirmar (status processed/approved).
 * 3. Idempotente: marcar duas vezes não duplica efeitos.
 *
 * Lança se a consulta ao MP falhar (ex.: order inexistente) — o chamador decide.
 */
export async function confirmarPagamentoPorOrder(
  orderId: string,
): Promise<ResultadoConfirmacao> {
  const { numero, paid } = await consultarOrder(orderId);

  if (numero == null) {
    return { numero: null, paid, jaEstavaPago: false };
  }
  if (!paid) {
    return { numero, paid: false, jaEstavaPago: false };
  }

  const supabase = createServiceClient();

  // Marca como pago de forma idempotente: só atualiza se ainda não estiver 'pago'.
  const { data: atualizado, error: errNum } = await supabase
    .from("numeros")
    .update({ status: "pago" })
    .eq("numero", numero)
    .neq("status", "pago")
    .select("numero");

  if (errNum) {
    throw new Error(`Falha ao marcar número ${numero} como pago: ${errNum.message}`);
  }

  const jaEstavaPago = (atualizado?.length ?? 0) === 0;

  // Registra pix_id e pago_em na tabela privada (idempotente).
  const { error: errComp } = await supabase
    .from("compradores")
    .update({ pix_id: orderId, pago_em: new Date().toISOString() })
    .eq("numero", numero);

  if (errComp) {
    console.error(
      `[confirmar] número ${numero} pago, mas falhou ao atualizar compradores:`,
      errComp.message,
    );
  }

  return { numero, paid: true, jaEstavaPago };
}

export type ResultadoConfirmacaoPedido = {
  pedidoId: string | null;
  paid: boolean;
  /** true se o pedido já estava marcado como pago antes desta chamada. */
  jaEstavaPago: boolean;
  /**
   * true se o MP confirmou o pagamento DEPOIS de o pedido expirar (o cron já
   * liberou os números, que podem ter sido revendidos). Pagamento órfão:
   * exige reembolso/realocação manual. Não marcamos os números como pagos.
   */
  orfao: boolean;
  numeros: number[];
};

/**
 * Confirma o pagamento de um PEDIDO (vários números) a partir do id da order.
 *
 * Mesma postura segura do fluxo de número avulso:
 * 1. NUNCA confia no payload — consulta a order no MP.
 * 2. Só marca como pago se o MP confirmar.
 * 3. Idempotente: marca o pedido + TODOS os seus números de uma vez.
 *
 * Lança se a consulta ao MP falhar ou o pedido não existir — o chamador decide.
 */
export async function confirmarPagamentoPorPedido(
  orderId: string,
): Promise<ResultadoConfirmacaoPedido> {
  const { pedidoId, paid } = await consultarOrder(orderId);

  if (pedidoId == null) {
    return { pedidoId: null, paid, jaEstavaPago: false, orfao: false, numeros: [] };
  }
  if (!paid) {
    return { pedidoId, paid: false, jaEstavaPago: false, orfao: false, numeros: [] };
  }

  const supabase = createServiceClient();

  // Lê o pedido para descobrir o conjunto de números a marcar como pagos.
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .select("id, status, numeros")
    .eq("id", pedidoId)
    .single();

  if (errPedido || !pedido) {
    throw new Error(
      `Pedido ${pedidoId} não encontrado ao confirmar: ${errPedido?.message ?? "—"}`,
    );
  }

  const numeros: number[] = Array.isArray(pedido.numeros) ? pedido.numeros : [];
  const agora = new Date().toISOString();

  // Reentrega idempotente: já estava pago, nada a fazer.
  if (pedido.status === "pago") {
    return { pedidoId, paid: true, jaEstavaPago: true, orfao: false, numeros };
  }

  // Confirma o pedido SÓ se ainda estiver 'aguardando' (atômico, à prova de
  // corrida com o cron). Se o cron já o expirou, esta atualização não casa
  // nenhuma linha — e NÃO ressuscitamos os números, que já podem ter sido
  // liberados/revendidos para outra pessoa.
  const { data: confirmados, error: errUpd } = await supabase
    .from("pedidos")
    .update({ status: "pago", pago_em: agora, pix_id: orderId })
    .eq("id", pedidoId)
    .eq("status", "aguardando")
    .select("id");
  if (errUpd) {
    throw new Error(`Falha ao marcar pedido ${pedidoId} como pago: ${errUpd.message}`);
  }

  // Nenhuma linha atualizada: o pedido saiu de 'aguardando' entre a leitura e o
  // update. Distinguimos "outra confirmação chegou primeiro" de "órfão".
  if (!confirmados || confirmados.length === 0) {
    const { data: estadoAtual } = await supabase
      .from("pedidos")
      .select("status")
      .eq("id", pedidoId)
      .single();

    if (estadoAtual?.status === "pago") {
      // Outra entrega de webhook/polling confirmou antes: ok (idempotente).
      return { pedidoId, paid: true, jaEstavaPago: true, orfao: false, numeros };
    }

    // PAGAMENTO ÓRFÃO: pagou DEPOIS de expirar. Marca com status dedicado
    // (consultável no painel) e NÃO toca nos números — eles já podem ter dono.
    console.error(
      `[confirmar] ⚠️ PAGAMENTO ÓRFÃO — pedido ${pedidoId} estava ` +
        `'${estadoAtual?.status ?? "?"}' mas o MP confirmou (order ${orderId}). ` +
        `Números ${JSON.stringify(numeros)} podem ter sido liberados/revendidos. ` +
        `Requer reembolso ou realocação manual.`,
    );
    await supabase
      .from("pedidos")
      .update({ status: "pago_expirado", pago_em: agora, pix_id: orderId })
      .eq("id", pedidoId)
      .eq("status", "expirado");

    return { pedidoId, paid: true, jaEstavaPago: false, orfao: true, numeros };
  }

  // Caminho normal: o pedido ainda estava 'aguardando', então seus números
  // seguem reservados por ele — é seguro marcá-los como pagos.
  if (numeros.length > 0) {
    // Marca todos os números do pedido como pagos (idempotente).
    const { error: errNum } = await supabase
      .from("numeros")
      .update({ status: "pago" })
      .in("numero", numeros)
      .neq("status", "pago");
    if (errNum) {
      throw new Error(
        `Pedido ${pedidoId} pago, mas falhou ao marcar números: ${errNum.message}`,
      );
    }

    // Registra pix_id + pago_em na tabela privada (por número), idempotente.
    const { error: errComp } = await supabase
      .from("compradores")
      .update({ pix_id: orderId, pago_em: agora })
      .in("numero", numeros);
    if (errComp) {
      console.error(
        `[confirmar] pedido ${pedidoId} pago, mas falhou ao atualizar compradores:`,
        errComp.message,
      );
    }
  }

  return { pedidoId, paid: true, jaEstavaPago: false, orfao: false, numeros };
}
