"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  loadStripe,
  type Appearance,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  DONATION_CURRENCY,
  DONATION_MIN_CENTS,
  DONATION_MAX_CENTS,
  SUGESTOES_CENTS,
  formatUSD,
  valorDoacaoValido,
} from "@/lib/doacao";

// Carrega o Stripe.js uma única vez (padrão recomendado).
const chavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = chavePublica ? loadStripe(chavePublica) : null;

// Aparência do Payment Element alinhada à paleta acolhedora do site.
const appearance: Appearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#b5838d", // rose-deep
    colorBackground: "#ffffff",
    colorText: "#4f444b", // ink
    colorDanger: "#e5989b", // rose
    borderRadius: "14px",
    fontSizeBase: "16px",
    spacingUnit: "4px",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
};

/** Converte uma string em dólares ("12", "12.50") para centavos inteiros. */
function dollarsParaCents(s: string): number {
  const limpo = s.replace(/[^0-9.]/g, "");
  if (limpo === "") return NaN;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export default function DoacaoFlow() {
  const [tierCents, setTierCents] = useState<number>(1500);
  const [custom, setCustom] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [valorPago, setValorPago] = useState<number>(0);

  const usandoCustom = custom.trim() !== "";
  const valorCents = usandoCustom ? dollarsParaCents(custom) : tierCents;
  const valido = valorDoacaoValido(valorCents);

  const options: StripeElementsOptions | undefined = useMemo(
    () => (clientSecret ? { clientSecret, appearance } : undefined),
    [clientSecret],
  );

  async function continuar() {
    if (!valido) {
      setErro(
        `Please choose an amount between ${formatUSD(
          DONATION_MIN_CENTS,
        )} and ${formatUSD(DONATION_MAX_CENTS)}.`,
      );
      return;
    }
    setErro(null);
    setCriando(true);
    try {
      const resp = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: valorCents,
          currency: DONATION_CURRENCY,
        }),
      });
      const data: { clientSecret?: string; erro?: string } = await resp
        .json()
        .catch(() => ({}));
      if (!resp.ok || !data.clientSecret) {
        setErro(data.erro ?? "We couldn't start the donation. Please try again.");
        setCriando(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setCriando(false);
    } catch {
      setErro("Network error. Please check your connection and try again.");
      setCriando(false);
    }
  }

  function aoConcluir() {
    setValorPago(valorCents);
    setSucesso(true);
    setClientSecret(null);
  }

  function recomecar() {
    setSucesso(false);
    setClientSecret(null);
    setErro(null);
    setCustom("");
    setTierCents(1500);
  }

  // Chave pública ausente: pagamento ainda não configurado.
  if (!stripePromise) {
    return (
      <section id="donate" className="cartao scroll-mt-6 p-6 text-center">
        <h2 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
          Donations open soon 💛
        </h2>
        <p className="mt-2 text-sm text-mauve/80">
          The secure donation form is being set up. Please check back shortly.
        </p>
      </section>
    );
  }

  // Tela de agradecimento.
  if (sucesso) {
    return (
      <section id="donate" className="cartao scroll-mt-6 p-7 text-center">
        <p className="text-4xl" aria-hidden>
          🐾💛
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-baloo)] text-3xl font-bold text-sage-deep">
          Thank you so much!
        </h2>
        <p className="mt-2 text-base text-ink/85">
          Your gift of{" "}
          <span className="font-semibold text-rose-deep">
            {formatUSD(valorPago)}
          </span>{" "}
          goes straight to Suspiro&apos;s treatment. From Suspiro and his family:
          thank you. 💖
        </p>
        <button
          type="button"
          onClick={recomecar}
          className="botao-voltar mt-5 inline-flex"
        >
          Make another donation
        </button>
      </section>
    );
  }

  return (
    <section id="donate" className="cartao scroll-mt-6 p-6 sm:p-7">
      <div className="text-center">
        <p className="font-[family-name:var(--font-caveat)] text-2xl text-rose-deep">
          every bit helps
        </p>
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve">
          Make a donation
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-mauve/80">
          Give securely with your card, Apple&nbsp;Pay or Google&nbsp;Pay
        </p>
      </div>

      {/* Passo 1: escolher o valor */}
      {!clientSecret && (
        <div className="mt-6 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            {SUGESTOES_CENTS.map((cents) => {
              const ativo = !usandoCustom && tierCents === cents;
              return (
                <button
                  key={cents}
                  type="button"
                  onClick={() => {
                    setTierCents(cents);
                    setCustom("");
                    setErro(null);
                  }}
                  aria-pressed={ativo}
                  className={`rounded-2xl border-2 px-4 py-4 text-center font-[family-name:var(--font-baloo)] text-xl font-bold transition-colors ${
                    ativo
                      ? "border-rose-deep bg-blush/20 text-rose-deep"
                      : "border-rose-deep/20 bg-surface text-mauve hover:border-rose-deep/50"
                  }`}
                >
                  {formatUSD(cents)}
                </button>
              );
            })}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-[family-name:var(--font-quicksand)] text-sm font-semibold text-mauve">
              Or enter another amount (USD)
            </span>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-rose-deep/20 bg-surface px-4 py-3 focus-within:border-rose-deep/50">
              <span className="text-lg font-semibold text-mauve/70">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setErro(null);
                }}
                className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-mauve/40"
                aria-label="Custom donation amount in US dollars"
              />
            </div>
          </label>

          {erro && (
            <p className="rounded-xl bg-blush/15 px-3 py-2 text-sm text-rose-deep">
              {erro}
            </p>
          )}

          <button
            type="button"
            onClick={continuar}
            disabled={!valido || criando}
            className="botao-primario w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {criando
              ? "Preparing…"
              : `Donate ${valido ? formatUSD(valorCents) : ""}`.trim()}
          </button>

          <p className="text-center text-xs text-mauve/60">
            Secure payment powered by Stripe.
          </p>
        </div>
      )}

      {/* Passo 2: pagamento */}
      {clientSecret && options && (
        <div className="mt-6">
          <Elements stripe={stripePromise} options={options}>
            <FormularioPagamento
              valorCents={valorCents}
              aoConcluir={aoConcluir}
              aoVoltar={() => setClientSecret(null)}
            />
          </Elements>
        </div>
      )}
    </section>
  );
}

function FormularioPagamento({
  valorCents,
  aoConcluir,
  aoVoltar,
}: {
  valorCents: number;
  aoConcluir: () => void;
  aoVoltar: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function pagar(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessando(true);
    setErro(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url:
          typeof window !== "undefined"
            ? window.location.href.split("?")[0]
            : "",
      },
    });

    if (error) {
      setErro(error.message ?? "Something went wrong. Please try again.");
      setProcessando(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      aoConcluir();
      return;
    }

    setErro("The payment wasn't completed. Please try again.");
    setProcessando(false);
  }

  return (
    <form onSubmit={pagar} className="flex flex-col gap-5">
      <PaymentElement options={{ layout: "tabs" }} />

      {erro && (
        <p className="rounded-xl bg-blush/15 px-3 py-2 text-sm text-rose-deep">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || processando}
        className="botao-primario w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processando ? "Processing…" : `Donate ${formatUSD(valorCents)}`}
      </button>

      <button
        type="button"
        onClick={aoVoltar}
        disabled={processando}
        className="text-center text-sm text-mauve/70 underline-offset-4 hover:underline disabled:opacity-60"
      >
        ← Change amount
      </button>
    </form>
  );
}
