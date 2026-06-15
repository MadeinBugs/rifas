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
