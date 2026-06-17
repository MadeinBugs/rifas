import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-admin";
import { criarPixParaPedido, extrairErroMP } from "@/lib/mercadopago";
import {
  TOTAL_NUMEROS,
  RESERVA_MINUTOS,
  PRECO_POR_NUMERO,
  MAX_NUMEROS_POR_PEDIDO,
} from "@/lib/rifa";
import { verificarHcaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

type Body = {
  numeros?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  captchaToken?: unknown;
};

/** Linha retornada pela RPC reservar_numeros. */
type NumeroReservado = { numero: number; reservado_em: string };

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

  const nome = texto(body.nome);
  const whatsapp = texto(body.whatsapp);
  const email = texto(body.email);
  const captchaToken = texto(body.captchaToken);

  // Números solicitados: limpa, valida o intervalo e remove duplicados.
  const numerosSolicitados = Array.from(
    new Set(
      (Array.isArray(body.numeros) ? body.numeros : [])
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMEROS),
    ),
  ).sort((a, b) => a - b);

  // Validação de entrada (boundary).
  if (numerosSolicitados.length < 1) {
    return NextResponse.json(
      { erro: "Escolha pelo menos um número." },
      { status: 400 },
    );
  }
  if (numerosSolicitados.length > MAX_NUMEROS_POR_PEDIDO) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_NUMEROS_POR_PEDIDO} números por pedido.` },
      { status: 400 },
    );
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

  // Anti-robô: confirma o token do hCaptcha antes de tocar no banco/MP.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const captchaOk = await verificarHcaptcha(captchaToken || null, ip);
  if (!captchaOk) {
    return NextResponse.json(
      { erro: "Não conseguimos confirmar que você não é um robô. Tente de novo." },
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (e) {
    // Ex.: SUPABASE_SERVICE_ROLE_KEY ausente no ambiente (ex.: Vercel).
    console.error("[reservar] createServiceClient falhou:", e);
    return NextResponse.json(
      { erro: "Servidor mal configurado. Avise o organizador." },
      { status: 500 },
    );
  }

  // 1) Reserva atômica com SUBSTITUIÇÃO (função no Postgres).
  //    Se um número escolhido "voou", a RPC reserva outro livre no lugar,
  //    para manter a quantidade (e o valor) que a pessoa decidiu doar.
  const { data: reservadoData, error: errReserva } = await supabase.rpc(
    "reservar_numeros",
    { p_numeros: numerosSolicitados },
  );

  if (errReserva) {
    console.error("[reservar] erro na RPC:", errReserva);
    return NextResponse.json(
      { erro: "Erro ao reservar. Tente novamente." },
      { status: 500 },
    );
  }

  const linhas = (Array.isArray(reservadoData) ? reservadoData : []) as
    | NumeroReservado[]
    | [];
  const numerosReservados = linhas
    .map((l) => l.numero)
    .filter((n): n is number => Number.isInteger(n))
    .sort((a, b) => a - b);

  // Grade esgotada: nada pôde ser reservado.
  if (numerosReservados.length < 1) {
    return NextResponse.json(
      {
        erro: "Os números escolhidos já foram reservados e não há outros livres agora.",
        indisponiveis: numerosSolicitados,
      },
      { status: 409 },
    );
  }

  // Calcula trocas para a UI ser transparente:
  // - substituidos: pares { de (escolhido que voou) → para (substituto) }
  // - perdidos: escolhidos sem reposição (só ocorre em quase-esgotamento)
  const setSolicitados = new Set(numerosSolicitados);
  const setReservados = new Set(numerosReservados);
  const novos = numerosReservados.filter((n) => !setSolicitados.has(n));
  const perdidosTodos = numerosSolicitados.filter((n) => !setReservados.has(n));
  const substituidos = perdidosTodos
    .slice(0, novos.length)
    .map((de, i) => ({ de, para: novos[i] }));
  const perdidos = perdidosTodos.slice(novos.length);

  const quantidade = numerosReservados.length;
  const totalCentavos = quantidade * PRECO_POR_NUMERO * 100;

  // 2) Cria o pedido (agrupa os números numa única cobrança Pix).
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .insert({
      status: "aguardando",
      quantidade,
      total_centavos: totalCentavos,
      numeros: numerosReservados,
    })
    .select("id")
    .single();

  if (errPedido || !pedido) {
    console.error("[reservar] erro ao criar pedido:", errPedido);
    await liberarReserva(supabase, numerosReservados);
    return NextResponse.json(
      { erro: "Erro ao criar o pedido. Tente novamente." },
      { status: 500 },
    );
  }

  const pedidoId: string = pedido.id;

  // 3) Grava os dados pessoais (um registro por número), ligados ao pedido.
  const compradores = numerosReservados.map((n) => ({
    numero: n,
    nome,
    whatsapp,
    email: email || null,
    pedido_id: pedidoId,
    pix_id: null,
    pago_em: null,
  }));
  const { error: errComp } = await supabase
    .from("compradores")
    .upsert(compradores, { onConflict: "numero" });
  if (errComp) {
    console.error("[reservar] erro ao gravar compradores:", errComp);
    await liberarReserva(supabase, numerosReservados, pedidoId);
    return NextResponse.json(
      { erro: "Erro ao salvar seus dados. Tente novamente." },
      { status: 500 },
    );
  }

  // 4) Cria o Pix único no Mercado Pago para o total do pedido.
  try {
    const pix = await criarPixParaPedido({
      pedidoId,
      nome,
      email: email || emailPlaceholder(pedidoId),
      valorCentavos: totalCentavos,
      quantidade,
      // Idempotência estável por pedido (mesmo pedido = mesma cobrança).
      idempotencyKey: `rifa-pedido-${pedidoId}`,
    });

    // 5) Guarda o id da order para reconciliação (webhook/polling).
    await supabase
      .from("pedidos")
      .update({ pix_id: pix.orderId })
      .eq("id", pedidoId);

    if (!pix.qrCode && !pix.qrCodeBase64) {
      console.error("[reservar] Pix criado sem QR Code:", pix.orderId);
    }

    return NextResponse.json({
      pedidoId,
      numeros: numerosReservados,
      substituidos,
      perdidos,
      quantidade,
      total: totalCentavos / 100,
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      ticketUrl: pix.ticketUrl,
      expiraEmMinutos: RESERVA_MINUTOS,
    });
  } catch (e) {
    // Loga o detalhe completo do erro do MP no servidor (não vaza o token).
    const detalhe = extrairErroMP(e);
    console.error(
      "[reservar] erro ao criar Pix no Mercado Pago:",
      JSON.stringify(detalhe),
    );
    // Rollback: libera os números e marca o pedido como expirado.
    await liberarReserva(supabase, numerosReservados, pedidoId);
    return NextResponse.json(
      { erro: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 },
    );
  }
}

/** Libera os números (rollback), limpa os dados pessoais e expira o pedido. */
async function liberarReserva(
  supabase: ReturnType<typeof createServiceClient>,
  numeros: number[],
  pedidoId?: string,
) {
  if (numeros.length > 0) {
    await supabase
      .from("numeros")
      .update({ status: "livre", reservado_em: null })
      .in("numero", numeros)
      .eq("status", "reservado");
    await supabase
      .from("compradores")
      .update({
        nome: null,
        whatsapp: null,
        email: null,
        pix_id: null,
        pedido_id: null,
      })
      .in("numero", numeros);
  }
  if (pedidoId) {
    await supabase
      .from("pedidos")
      .update({ status: "expirado" })
      .eq("id", pedidoId);
  }
}

/**
 * E-mail placeholder para quando o comprador não informa (o MP exige e-mail no
 * pagador). Usa o host real do site (domínio que resolve) em vez de um domínio
 * inventado, reduzindo o risco de o MP recusar. Cai para o domínio de produção
 * se a base URL for localhost.
 */
function emailPlaceholder(pedidoId: string): string {
  let host = "salveosuspiro.vercel.app";
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (base) {
      const h = new URL(base).hostname; // sem porta
      if (h.includes(".") && h !== "localhost" && !h.endsWith(".localhost")) {
        host = h;
      }
    }
  } catch {
    // mantém o host de produção
  }
  return `pedido-${pedidoId}@${host}`;
}
