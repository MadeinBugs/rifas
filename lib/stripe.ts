import "server-only";
import Stripe from "stripe";
import { DONATION_CURRENCY } from "@/lib/doacao";

/**
 * Integração com o Stripe para a doação internacional (USD).
 * SOMENTE no servidor: usa a STRIPE_SECRET_KEY secreta.
 *
 * Decisão de projeto: só métodos SÍNCRONOS (cartão, Apple/Google Pay, Link).
 * Por isso o PaymentIntent é criado com `allow_redirects: "never"` — assim o
 * resultado do pagamento é sempre conhecido no cliente (confirmPayment), sem
 * depender de webhook para mostrar sucesso/erro ao doador.
 */

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Configure STRIPE_SECRET_KEY no ambiente.");
  }
  return key;
}

let cliente: Stripe | null = null;

function getStripe(): Stripe {
  if (!cliente) {
    // Sem apiVersion explícita: usa a versão fixada pelo SDK instalado.
    cliente = new Stripe(getSecretKey());
  }
  return cliente;
}

export type DoacaoIntent = {
  clientSecret: string;
  paymentIntentId: string;
};

/**
 * Cria um PaymentIntent de doação no valor informado (em centavos de USD).
 * Retorna o client_secret para o Payment Element confirmar no navegador.
 */
export async function criarPaymentIntentDoacao(args: {
  amountCents: number;
  currency?: string;
}): Promise<DoacaoIntent> {
  const { amountCents, currency = DONATION_CURRENCY } = args;

  const intent = await getStripe().paymentIntents.create({
    amount: amountCents,
    currency,
    description: "Donation — Save Suspiro",
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
    metadata: {
      tipo: "doacao",
      projeto: "suspiro",
    },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe não retornou client_secret.");
  }

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

/**
 * Extrai detalhes seguros de um erro do SDK do Stripe para log no servidor.
 * Nenhum desses campos contém a secret key.
 */
export function extrairErroStripe(e: unknown): Record<string, unknown> {
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const out: Record<string, unknown> = { name: e.constructor?.name };
    if (typeof o.type === "string") out.type = o.type;
    if (typeof o.code === "string") out.code = o.code;
    if (typeof o.message === "string") out.message = o.message;
    if (typeof o.statusCode === "number") out.statusCode = o.statusCode;
    return out;
  }
  return { message: e instanceof Error ? e.message : String(e) };
}
