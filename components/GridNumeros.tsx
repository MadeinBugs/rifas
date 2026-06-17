"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useNumeros } from "@/components/NumerosProvider";
import { tocarPop, tocarRemover, tocarBloqueado } from "@/lib/som";
import {
  TOTAL_NUMEROS,
  formatBRL,
  PRECO_POR_NUMERO,
  type NumeroStatus,
} from "@/lib/rifa";

// Base comum + cor por status. Em repouso ficam retinhos; o "charme" vem só no
// toque (squish) e no hover (leve inclinação/elevação).
const BASE_BOTAO =
  "relative flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-transform duration-150 active:scale-95";

const ESTILO_BOTAO: Record<NumeroStatus, string> = {
  livre:
    "border-sage/50 bg-sage-soft text-sage-deeper hover:-translate-y-0.5 hover:rotate-2 hover:border-sage hover:shadow-[0_6px_14px_-8px_rgba(111,133,89,0.6)]",
  reservado:
    "border-blush/60 bg-peach/30 text-rose-deep cursor-not-allowed",
  pago: "border-mauve/20 bg-mauve/10 text-mauve/50 cursor-not-allowed",
};

// Número escolhido pela pessoa: preenchido em sage, com selo de confirmação.
const ESTILO_SELECIONADO =
  "border-sage-deep bg-sage text-white shadow-[0_6px_14px_-7px_rgba(94,115,80,0.75)] hover:-translate-y-0.5";

// Livre, porém bloqueado por ter atingido o limite por pedido.
const ESTILO_BLOQUEADO =
  "border-sage/25 bg-sage-soft/50 text-sage-deeper/40 cursor-not-allowed";

export default function GridNumeros() {
  const {
    statusPorNumero,
    contagem,
    selecionados,
    alternar,
    atingiuMax,
    maximo,
  } = useNumeros();

  const numeros = useMemo(
    () => Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1),
    [],
  );

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
          Escolha o seu número da sorte
        </h2>
        <p className="text-sm text-mauve/80">
          Toque para escolher quantos quiser
        </p>
      </div>

      {/* Legenda + contadores */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Legenda cor="bg-sage" rotulo="Livres" valor={contagem.livres} />
        <Legenda
          cor="bg-blush"
          rotulo="Aguardando"
          valor={contagem.reservados}
        />
        <Legenda cor="bg-mauve/40" rotulo="Reservados" valor={contagem.pagos} />
      </div>

      {/* Grade de números */}
      <div className="grade-numeros">
        {numeros.map((n) => {
          const status = statusPorNumero[n] ?? "livre";
          const selecionado = selecionados.has(n);

          // Selecionado: preenchido em sage, com selo. Toque remove.
          if (selecionado) {
            return (
              <button
                key={n}
                type="button"
                aria-pressed
                onClick={() => {
                  alternar(n);
                  tocarRemover();
                }}
                className={`${BASE_BOTAO} ${ESTILO_SELECIONADO}`}
                aria-label={`Número ${n} — escolhido. Toque para remover.`}
              >
                {n}
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-sage-deep shadow-sm"
                  aria-hidden
                >
                  ✓
                </span>
              </button>
            );
          }

          if (status === "livre") {
            const bloqueado = atingiuMax;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={false}
                aria-disabled={bloqueado}
                onClick={() => {
                  if (bloqueado) {
                    tocarBloqueado();
                    return;
                  }
                  alternar(n);
                  tocarPop();
                }}
                className={`${BASE_BOTAO} ${
                  bloqueado ? ESTILO_BLOQUEADO : ESTILO_BOTAO.livre
                }`}
                aria-label={
                  bloqueado
                    ? `Número ${n} — limite de ${maximo} números por pedido atingido`
                    : `Número ${n} — livre, ${formatBRL(
                        PRECO_POR_NUMERO,
                      )}. Toque para escolher.`
                }
              >
                {n}
              </button>
            );
          }

          if (status === "pago") {
            return (
              <button
                key={n}
                type="button"
                aria-disabled
                onClick={() => tocarBloqueado()}
                className={`${BASE_BOTAO} ${ESTILO_BOTAO.pago}`}
                aria-label={`Número ${n} — pago`}
              >
                <Pata cor="#6d6875" giro={-15} opacidade={0.3} />
                {n}
              </button>
            );
          }

          // reservado
          return (
            <button
              key={n}
              type="button"
              aria-disabled
              onClick={() => tocarBloqueado()}
              className={`${BASE_BOTAO} ${ESTILO_BOTAO.reservado}`}
              aria-label={`Número ${n} — reservado`}
            >
              <Pata cor="#e5989b" giro={20} opacidade={0.5} />
              {n}
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

/** Máscara da pata — colorida via CSS mask-image sobre fundo de cor sólida. */
const PAW_MASK: CSSProperties = {
  maskImage: "url('/paw.png')",
  WebkitMaskImage: "url('/paw.png')",
  maskSize: "80%",
  WebkitMaskSize: "80%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

function Pata({
  cor,
  giro,
  opacidade,
}: {
  cor: string;
  giro: number;
  opacidade: number;
}) {
  return (
    <span
      className="pointer-events-none absolute inset-0 rounded-full"
      style={{
        ...PAW_MASK,
        backgroundColor: cor,
        opacity: opacidade,
        transform: `rotate(${giro}deg)`,
      }}
      aria-hidden
    />
  );
}
