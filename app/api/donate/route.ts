import { NextResponse } from "next/server";
import { criarPaymentIntentDoacao, extrairErroStripe } from "@/lib/stripe";
import {
  DONATION_CURRENCY,
  DONATION_MIN_CENTS,
  DONATION_MAX_CENTS,
  formatUSD,
  valorDoacaoValido,
} from "@/lib/doacao";

export const dynamic = "force-dynamic";

type Body = {
  amountCents?: unknown;
  currency?: unknown;
};

/**
 * Cria um PaymentIntent de doação e devolve o client_secret para o Payment
 * Element confirmar no navegador. Isolado do backend da rifa.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ erro: "Invalid request." }, { status: 400 });
  }

  // Boundary: valida o valor (centavos de USD) e a moeda.
  const amountCents = Number(body.amountCents);
  if (!valorDoacaoValido(amountCents)) {
    return NextResponse.json(
      {
        erro: `Please choose an amount between ${formatUSD(
          DONATION_MIN_CENTS,
        )} and ${formatUSD(DONATION_MAX_CENTS)}.`,
      },
      { status: 400 },
    );
  }

  const currency =
    typeof body.currency === "string"
      ? body.currency.toLowerCase()
      : DONATION_CURRENCY;
  if (currency !== DONATION_CURRENCY) {
    return NextResponse.json(
      { erro: "Unsupported currency." },
      { status: 400 },
    );
  }

  try {
    const { clientSecret } = await criarPaymentIntentDoacao({
      amountCents,
      currency,
    });
    return NextResponse.json({ clientSecret });
  } catch (e) {
    console.error("[donate] erro ao criar PaymentIntent:", extrairErroStripe(e));
    return NextResponse.json(
      { erro: "We couldn't start the donation. Please try again." },
      { status: 502 },
    );
  }
}
