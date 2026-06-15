import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { criarPixParaNumero } from "@/lib/mercadopago";
import { TOTAL_NUMEROS, RESERVA_MINUTOS } from "@/lib/rifa";

export const dynamic = "force-dynamic";

type Body = {
  numero?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
  email?: unknown;
};

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const numero = Number(body.numero);
  const nome = texto(body.nome);
  const whatsapp = texto(body.whatsapp);
  const email = texto(body.email);

  // Validação de entrada (boundary).
  if (!Number.isInteger(numero) || numero < 1 || numero > TOTAL_NUMEROS) {
    return NextResponse.json({ erro: "Número inválido." }, { status: 400 });
  }
  if (nome.length < 2) {
    return NextResponse.json({ erro: "Informe seu nome." }, { status: 400 });
  }
  const digitos = whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) {
    return NextResponse.json(
      { erro: "Informe um WhatsApp válido com DDD." },
      { status: 400 },
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 1) Reserva atômica + expiração lazy (função no Postgres).
  const { data: reservado, error: errReserva } = await supabase.rpc(
    "reservar_numero",
    { p_numero: numero },
  );

  if (errReserva) {
    console.error("[reservar] erro na RPC:", errReserva);
    return NextResponse.json(
      { erro: "Erro ao reservar. Tente novamente." },
      { status: 500 },
    );
  }

  // A função retorna a linha reservada, ou null se o número não estava disponível.
  const linha = Array.isArray(reservado) ? reservado[0] : reservado;
  if (!linha) {
    return NextResponse.json(
      { erro: "Este número acabou de ser escolhido por outra pessoa." },
      { status: 409 },
    );
  }

  const reservadoEm: string = linha.reservado_em;

  // 2) Grava os dados pessoais na tabela privada.
  const { error: errComp } = await supabase.from("compradores").upsert(
    {
      numero,
      nome,
      whatsapp,
      email: email || null,
      pix_id: null,
      pago_em: null,
    },
    { onConflict: "numero" },
  );
  if (errComp) {
    console.error("[reservar] erro ao gravar comprador:", errComp);
    await liberar(supabase, numero);
    return NextResponse.json(
      { erro: "Erro ao salvar seus dados. Tente novamente." },
      { status: 500 },
    );
  }

  // 3) Cria o Pix no Mercado Pago.
  try {
    const pix = await criarPixParaNumero({
      numero,
      nome,
      email: email || `comprador${numero}@salveosuspiro.com.br`,
      // Chave de idempotência estável por reserva (mesma reserva = mesma cobrança).
      idempotencyKey: `rifa-${numero}-${reservadoEm}`,
    });

    // 4) Guarda o id da order para reconciliação.
    await supabase
      .from("compradores")
      .update({ pix_id: pix.orderId })
      .eq("numero", numero);

    if (!pix.qrCode && !pix.qrCodeBase64) {
      console.error("[reservar] Pix criado sem QR Code:", pix.orderId);
    }

    return NextResponse.json({
      numero,
      orderId: pix.orderId,
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      ticketUrl: pix.ticketUrl,
      expiraEmMinutos: RESERVA_MINUTOS,
    });
  } catch (e) {
    console.error("[reservar] erro ao criar Pix no Mercado Pago:", e);
    // Rollback: libera o número para não ficar preso.
    await liberar(supabase, numero);
    return NextResponse.json(
      { erro: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 },
    );
  }
}

/** Libera o número (rollback) e limpa os dados pessoais da reserva. */
async function liberar(
  supabase: ReturnType<typeof createServiceClient>,
  numero: number,
) {
  await supabase
    .from("numeros")
    .update({ status: "livre", reservado_em: null })
    .eq("numero", numero)
    .eq("status", "reservado");
  await supabase
    .from("compradores")
    .update({ nome: null, whatsapp: null, email: null, pix_id: null })
    .eq("numero", numero);
}
