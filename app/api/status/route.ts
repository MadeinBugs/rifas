import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { confirmarPagamentoPorOrder } from "@/lib/pagamento";
import { TOTAL_NUMEROS } from "@/lib/rifa";

export const dynamic = "force-dynamic";

/**
 * Consulta o status de um número (polling do cliente na página de compra).
 * Resposta: { status: 'livre' | 'reservado' | 'pago' }.
 *
 * Estratégia:
 * 1. Lê o status atual no banco (rápido; o webhook normalmente já marcou).
 * 2. Fallback: se ainda 'reservado' e houver order, confirma no Mercado Pago.
 *    Assim o cliente vê "pago" mesmo se o webhook atrasar.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const numero = Number(searchParams.get("numero"));

  if (!Number.isInteger(numero) || numero < 1 || numero > TOTAL_NUMEROS) {
    return NextResponse.json({ erro: "Número inválido." }, { status: 400 });
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
    .from("numeros")
    .select("status")
    .eq("numero", numero)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: "Número não encontrado." },
      { status: 404 },
    );
  }

  if (data.status === "pago") {
    return NextResponse.json({ status: "pago" });
  }

  // Fallback ativo: confirma no MP se ainda estiver reservado.
  if (data.status === "reservado") {
    const { data: comp } = await supabase
      .from("compradores")
      .select("pix_id")
      .eq("numero", numero)
      .single();

    if (comp?.pix_id) {
      try {
        const r = await confirmarPagamentoPorOrder(comp.pix_id);
        if (r.paid) {
          return NextResponse.json({ status: "pago" });
        }
      } catch (e) {
        console.error("[status] fallback MP falhou:", e);
      }
    }
  }

  return NextResponse.json({ status: data.status });
}
