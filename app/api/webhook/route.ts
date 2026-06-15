import { NextResponse } from "next/server";
import { validarAssinaturaWebhook } from "@/lib/mercadopago";
import { confirmarPagamentoPorOrder } from "@/lib/pagamento";

export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago (tópico `order`).
 *
 * Segurança (NUNCA confiar no payload cru):
 * 1. Valida a assinatura HMAC (x-signature + x-request-id + data.id).
 * 2. Consulta a order no MP e só marca como pago se confirmado.
 * 3. Idempotente: reprocessar a mesma notificação não duplica efeitos.
 *
 * Sempre responde 200 quando a assinatura é válida (mesmo sem ação),
 * para o MP parar de reenviar. Assinatura inválida → 401.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // data.id pode vir na query (?data.id=...) ou no corpo.
  let body: { type?: string; topic?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    // Algumas notificações vêm sem corpo JSON; seguimos com a query string.
  }

  const dataIdQuery =
    url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const dataId = dataIdQuery ?? body?.data?.id ?? null;

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  // 1) Validar assinatura.
  const assinaturaOk = validarAssinaturaWebhook({
    xSignature,
    xRequestId,
    dataId,
  });
  if (!assinaturaOk) {
    console.warn("[webhook] assinatura inválida — recusado.");
    return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  // 2) Confirmar tipo de evento (esperamos 'order').
  const tipo = body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (tipo && tipo !== "order") {
    // Evento que não tratamos (ex.: payment legacy). Reconhecemos com 200.
    return NextResponse.json({ ok: true, ignorado: tipo });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, semId: true });
  }

  // 3) Consultar a order no MP e marcar como pago (idempotente).
  try {
    const r = await confirmarPagamentoPorOrder(dataId);
    return NextResponse.json({
      ok: true,
      numero: r.numero,
      paid: r.paid,
      jaEstavaPago: r.jaEstavaPago,
    });
  } catch (e) {
    // Order inexistente (ex.: id de teste 123456) ou erro transitório no MP.
    // Reconhecemos com 200 para não entrar em loop de reenvio.
    console.error("[webhook] não foi possível confirmar a order:", e);
    return NextResponse.json({ ok: true, naoEncontrada: true });
  }
}
