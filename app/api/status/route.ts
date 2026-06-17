import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { confirmarPagamentoPorPedido } from "@/lib/pagamento";

export const dynamic = "force-dynamic";

/**
 * Consulta o status de um PEDIDO (polling do cliente na página de apoio).
 * Resposta: { status: 'aguardando' | 'pago' | 'expirado' }.
 *
 * Estratégia:
 * 1. Lê o status atual do pedido (rápido; o webhook normalmente já marcou).
 * 2. Fallback: se ainda 'aguardando' e houver order, confirma no Mercado Pago.
 *    Assim o cliente vê "pago" mesmo se o webhook atrasar.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pedidoId = (searchParams.get("pedido") ?? "").trim();

  // UUID simples (formato), evita consultas inúteis com lixo.
  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      pedidoId,
    );
  if (!uuidOk) {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[status] createServiceClient falhou:", e);
    return NextResponse.json(
      { erro: "Servidor mal configurado." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("pedidos")
    .select("status, pix_id")
    .eq("id", pedidoId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: "Pedido não encontrado." },
      { status: 404 },
    );
  }

  if (data.status === "pago") {
    return NextResponse.json({ status: "pago" });
  }

  // Fallback ativo: confirma no MP se ainda estiver aguardando.
  if (data.status === "aguardando" && data.pix_id) {
    try {
      const r = await confirmarPagamentoPorPedido(data.pix_id);
      if (r.paid) {
        return NextResponse.json({ status: "pago" });
      }
    } catch (e) {
      console.error("[status] fallback MP falhou:", e);
    }
  }

  return NextResponse.json({ status: data.status });
}
