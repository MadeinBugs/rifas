"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useNumeros } from "@/components/NumerosProvider";
import { tocarPop } from "@/lib/som";
import {
  TOTAL_NUMEROS,
  formatBRL,
  PRECO_POR_NUMERO,
  type NumeroStatus,
} from "@/lib/rifa";

// Base comum + cor por status. Em repouso ficam retinhos; o "charme" vem só no
// toque (squish) e no hover (leve inclinação/elevação).
const BASE_BOTAO =
  "relative flex h-11 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-transform duration-150 active:scale-95";

const ESTILO_BOTAO: Record<NumeroStatus, string> = {
  livre:
    "border-sage/50 bg-sage-soft text-sage-deeper hover:-translate-y-0.5 hover:rotate-2 hover:border-sage hover:shadow-[0_6px_14px_-8px_rgba(111,133,89,0.6)]",
  reservado:
    "border-blush/60 bg-peach/30 text-rose-deep cursor-not-allowed",
  pago: "border-mauve/20 bg-mauve/10 text-mauve/50 line-through cursor-not-allowed",
};

export default function GridNumeros() {
  const { statusPorNumero, contagem } = useNumeros();

  const numeros = useMemo(
    () => Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1),
    [],
  );

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
        Escolha o seu número da sorte
      </h2>

      {/* Legenda + contadores */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Legenda cor="bg-sage" rotulo="Livres" valor={contagem.livres} />
        <Legenda
          cor="bg-blush"
          rotulo="Reservados"
          valor={contagem.reservados}
        />
        <Legenda cor="bg-mauve/40" rotulo="Pagos" valor={contagem.pagos} />
      </div>

      {/* Grade de números */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(2.75rem, 1fr))",
        }}
      >
        {numeros.map((n) => {
          const status = statusPorNumero[n] ?? "livre";
          const classes = `${BASE_BOTAO} ${ESTILO_BOTAO[status]}`;

          if (status === "livre") {
            return (
              <Link
                key={n}
                href={`/comprar/${n}`}
                className={classes}
                onClick={() => tocarPop()}
                aria-label={`Número ${n} — livre, ${formatBRL(
                  PRECO_POR_NUMERO,
                )}. Clique para comprar.`}
              >
                {n}
              </Link>
            );
          }

          return (
            <button
              key={n}
              type="button"
              disabled
              className={classes}
              aria-label={`Número ${n} — ${status}`}
            >
              {n}
              {status === "pago" && (
                <span
                  className="pointer-events-none absolute -right-1 -top-1 text-xs"
                  aria-hidden
                >
                  🐾
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Legenda({
  cor,
  rotulo,
  valor,
}: {
  cor: string;
  rotulo: string;
  valor: number;
}) {
  return (
    <span className="flex items-center gap-2 text-mauve">
      <span className={`inline-block h-3 w-3 rounded ${cor}`} aria-hidden />
      {rotulo}
      <strong className="font-bold text-ink">{valor}</strong>
    </span>
  );
}
