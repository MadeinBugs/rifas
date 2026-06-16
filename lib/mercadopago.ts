import "server-only";
import crypto from "node:crypto";
import { MercadoPagoConfig, Order } from "mercadopago";
import { PRECO_POR_NUMERO, RESERVA_MINUTOS } from "@/lib/rifa";

/**
 * Integração com o Mercado Pago — API de Orders (Checkout Transparente).
 * SOMENTE no servidor: usa o MP_ACCESS_TOKEN secreto.
 */

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Configure MP_ACCESS_TOKEN no ambiente.");
  }
  return token;
}

function getOrderClient(): Order {
  const config = new MercadoPagoConfig({ accessToken: getAccessToken() });
  return new Order(config);
}

/**
 * Monta a URL do webhook a partir de NEXT_PUBLIC_BASE_URL, de forma robusta:
 * - garante o esquema https:// (a env na Vercel pode vir sem protocolo);
 * - valida que é uma URL real (o MP recusa URIs inválidas);
 * - omite para localhost (o MP não aceita; em dev o webhook do painel cobre).
 * Retorna null se não for possível montar uma URL https válida — nesse caso a
 * order é criada sem callback_url e o webhook configurado no painel do MP cobre.
 */
export function getCallbackUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  let base = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`; // Vercel env costuma vir sem protocolo.
  }
  try {
    const u = new URL(`${base}/api/webhook`);
    if (u.protocol !== "https:") return null; // MP exige https
    if (u.hostname === "localhost" || u.hostname.endsWith(".localhost")) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Extrai detalhes seguros de um erro do SDK do Mercado Pago.
 * O erro pode vir como { message, status, code } OU como um corpo de API
 * aninhado { errors: [...] } / { cause: [...] }. Capturamos ambos.
 * Nenhum desses campos contém o access token, então é seguro logar/retornar.
 */
export function extrairErroMP(e: unknown): Record<string, unknown> {
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const out: Record<string, unknown> = {
      name: e.constructor?.name,
      keys: Object.keys(o),
    };
    if (typeof o.message === "string") out.message = o.message;
    if (typeof o.status === "number") out.status = o.status;
    if (typeof o.code === "string") out.code = o.code;
    if (o.errors) out.errors = o.errors; // corpo de erro da API (aninhado)
    if (o.cause) out.cause = o.cause;
    // Fallback: serializa propriedades não-enumeráveis (ex.: Error nativo).
    try {
      out.raw = JSON.parse(
        JSON.stringify(o, Object.getOwnPropertyNames(o)),
      );
    } catch {
      /* ignore */
    }
    return out;
  }
  return { message: e instanceof Error ? e.message : String(e) };
}

/** Monta o external_reference padronizado a partir do número. */
export function refFromNumero(numero: number): string {
  return `rifa-${numero}`;
}

/** Extrai o número da rifa a partir do external_reference (ex.: "rifa-7" → 7). */
export function numeroFromRef(ref: string | undefined | null): number | null {
  if (!ref) return null;
  const m = /^rifa-(\d+)$/.exec(ref.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) ? n : null;
}

export type PixCriado = {
  orderId: string;
  paymentId: string | null;
  qrCode: string | null; // copia-e-cola
  qrCodeBase64: string | null; // imagem PNG base64
  ticketUrl: string | null;
  status: string | null;
};

/**
 * Cria uma order online com pagamento Pix de R$ {PRECO_POR_NUMERO}.
 * Retorna o QR Code e o código copia-e-cola para exibir ao cliente.
 *
 * @param idempotencyKey chave estável por reserva (evita cobrança duplicada).
 */
export async function criarPixParaNumero(args: {
  numero: number;
  nome: string;
  email: string;
  idempotencyKey: string;
}): Promise<PixCriado> {
  const { numero, nome, email, idempotencyKey } = args;
  const valor = PRECO_POR_NUMERO.toFixed(2); // "10.00"
  // A API de Orders espera uma DURAÇÃO ISO 8601 (ex.: "PT15M"),
  // não um datetime. (O campo date_of_expiration não é aceito aqui.)
  const expiracao = `PT${RESERVA_MINUTOS}M`;
  const callbackUrl = getCallbackUrl();

  const order = getOrderClient();
  const resposta = await order.create({
    body: {
      type: "online",
      processing_mode: "automatic",
      external_reference: refFromNumero(numero),
      total_amount: valor,
      description: `Ação Solidária pelo Gatinho — Número ${numero}`,
      payer: {
        email,
        first_name: nome,
      },
      transactions: {
        payments: [
          {
            amount: valor,
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: expiracao,
          },
        ],
      },
      ...(callbackUrl
        ? { config: { online: { callback_url: callbackUrl } } }
        : {}),
    },
    requestOptions: { idempotencyKey },
  });

  const pagamento = resposta.transactions?.payments?.[0];
  const pm = pagamento?.payment_method;

  if (!resposta.id) {
    throw new Error("Mercado Pago não retornou o id da order.");
  }

  const qrCode = pm?.qr_code ?? null;
  const qrCodeBase64 = pm?.qr_code_base64 ?? null;

  // Diagnóstico: se o QR não veio no caminho esperado da Orders API
  // (payment_method.qr_code/qr_code_base64), registra a estrutura real do
  // pagamento. Útil para conferir no 1º Pix real de teste.
  if (!qrCode && !qrCodeBase64) {
    console.error(
      "[mercadopago] Order sem QR Code no caminho esperado. Estrutura retornada:",
      JSON.stringify(pagamento ?? resposta, null, 2),
    );
  }

  return {
    orderId: resposta.id,
    paymentId: pagamento?.id ?? null,
    qrCode,
    qrCodeBase64,
    ticketUrl: pm?.ticket_url ?? null,
    status: resposta.status ?? null,
  };
}

export type OrderConsulta = {
  numero: number | null;
  paid: boolean;
  status: string | null;
};

/**
 * Consulta uma order no Mercado Pago e diz se está paga.
 * Paga = order.status 'processed' OU algum pagamento 'approved'.
 */
export async function consultarOrder(orderId: string): Promise<OrderConsulta> {
  const order = getOrderClient();
  const resposta = await order.get({ id: orderId });

  const numero = numeroFromRef(resposta.external_reference);
  const orderStatus = resposta.status ?? null;
  const algumAprovado = (resposta.transactions?.payments ?? []).some(
    (p) => p.status === "approved",
  );
  const paid = orderStatus === "processed" || algumAprovado;

  return { numero, paid, status: orderStatus };
}

/**
 * Valida a assinatura HMAC do webhook do Mercado Pago.
 * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * (componentes ausentes são omitidos). Comparação em tempo constante.
 */
export function validarAssinaturaWebhook(args: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] MP_WEBHOOK_SECRET não configurado.");
    return false;
  }
  const { xSignature, xRequestId, dataId } = args;
  if (!xSignature) return false;

  // x-signature: "ts=1700000000,v1=<hash>"
  let ts: string | null = null;
  let v1: string | null = null;
  for (const parte of xSignature.split(",")) {
    const [k, val] = parte.split("=", 2);
    if (!k || val === undefined) continue;
    const chave = k.trim();
    if (chave === "ts") ts = val.trim();
    else if (chave === "v1") v1 = val.trim();
  }
  if (!ts || !v1) return false;

  // data.id alfanumérico deve entrar em minúsculas no manifest.
  const idParte =
    dataId != null && dataId !== "" ? `id:${dataId.toLowerCase()};` : "";
  const reqParte = xRequestId ? `request-id:${xRequestId};` : "";
  const manifest = `${idParte}${reqParte}ts:${ts};`;

  const esperado = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(v1, "hex");
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) {
    // NÃO vaza o secret: o manifest contém apenas data.id + request-id + ts
    // (dados públicos da notificação). Ajuda a diagnosticar 401 silencioso.
    console.warn(
      "[webhook] assinatura não confere. Manifest usado:",
      manifest,
    );
  }
  return ok;
}
