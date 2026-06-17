"use server";

import { logout, requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function logoutAction(): Promise<void> {
  await logout();
}

/**
 * Marca um pedido como PAGO manualmente (sem passar pelo Mercado Pago).
 *
 * Uso: testes do fluxo de Pix e resgate manual (ex.: webhook falhou, mas a
 * pessoa pagou). Replica o efeito de uma confirmação: pedido + números +
 * compradores viram 'pago'. A aba do checkout (que faz polling em
 * /api/status) detecta e comemora.
 */
export async function marcarPedidoPagoAction(formData: FormData): Promise<void> {
  await requireAuth();

  const pedidoId = formData.get("pedidoId")?.toString().trim();
  if (!pedidoId) return;

  const supabase = createServiceClient();

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, numeros")
    .eq("id", pedidoId)
    .single();
  if (error || !pedido) return;

  const numeros: number[] = Array.isArray(pedido.numeros) ? pedido.numeros : [];
  const agora = new Date().toISOString();

  await supabase
    .from("pedidos")
    .update({ status: "pago", pago_em: agora })
    .eq("id", pedidoId);

  if (numeros.length > 0) {
    await supabase
      .from("numeros")
      .update({ status: "pago" })
      .in("numero", numeros);

    await supabase
      .from("compradores")
      .update({ pago_em: agora })
      .eq("pedido_id", pedidoId);
  }

  revalidatePath("/admin");
}

/**
 * Desfaz a marcação de pago: devolve o pedido para 'aguardando' e os números
 * para 'reservado', reiniciando o relógio de 15 min. Útil para repetir testes
 * sem mexer no Supabase.
 */
export async function desmarcarPedidoPagoAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();

  const pedidoId = formData.get("pedidoId")?.toString().trim();
  if (!pedidoId) return;

  const supabase = createServiceClient();

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, numeros")
    .eq("id", pedidoId)
    .single();
  if (error || !pedido) return;

  const numeros: number[] = Array.isArray(pedido.numeros) ? pedido.numeros : [];
  const agora = new Date().toISOString();

  await supabase
    .from("pedidos")
    .update({ status: "aguardando", pago_em: null, reservado_em: agora })
    .eq("id", pedidoId);

  if (numeros.length > 0) {
    await supabase
      .from("numeros")
      .update({ status: "reservado", reservado_em: agora })
      .in("numero", numeros);

    await supabase
      .from("compradores")
      .update({ pago_em: null })
      .eq("pedido_id", pedidoId);
  }

  revalidatePath("/admin");
}

