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
    return { pedidoId: null, paid, jaEstavaPago: false, numeros: [] };
  }
  if (!paid) {
    return { pedidoId, paid: false, jaEstavaPago: false, numeros: [] };
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
  const jaEstavaPago = pedido.status === "pago";
  const agora = new Date().toISOString();

  // Marca o pedido como pago (idempotente).
  const { error: errUpd } = await supabase
    .from("pedidos")
    .update({ status: "pago", pago_em: agora, pix_id: orderId })
    .eq("id", pedidoId)
    .neq("status", "pago");
  if (errUpd) {
    throw new Error(`Falha ao marcar pedido ${pedidoId} como pago: ${errUpd.message}`);
  }

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

  return { pedidoId, paid: true, jaEstavaPago, numeros };
}
