"use client";

import { useState } from "react";
import { dispararConfete } from "@/lib/efeitos";
import {
  realizarSorteio,
  resetarSorteio,
  type ResultadoSorteio,
} from "./actions";

interface Props {
  resultadoInicial: ResultadoSorteio | null;
}

export default function SorteioClient({ resultadoInicial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(
    resultadoInicial,
  );
  const [spinning, setSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<string>(
    resultadoInicial
      ? resultadoInicial.numero.toString().padStart(3, "0")
      : "000",
  );

  const iniciarSorteio = async () => {
    setLoading(true);
    setError(null);
    setSpinning(true);

    // Efeito visual de suspense enquanto a action roda no servidor
    const interval = setInterval(() => {
      setDisplayNumber(
        Math.floor(Math.random() * 500 + 1)
          .toString()
          .padStart(3, "0"),
      );
    }, 50);

    const res = await realizarSorteio();

    // Mínimo de 3 s de animação para o efeito live no Instagram
    await new Promise<void>((resolve) => setTimeout(resolve, 3000));

    clearInterval(interval);
    setSpinning(false);
    setLoading(false);

    if ("error" in res) {
      setError(res.error);
      setDisplayNumber("000");
    } else {
      setResultado(res);
      setDisplayNumber(res.numero.toString().padStart(3, "0"));

      if (!res.jaSorteado) {
        // Confete apenas quando o sorteio acontece de verdade
        dispararConfete();
      }
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Tem certeza que deseja apagar o resultado e refazer o sorteio?\n\n" +
          "Use isto apenas para testes antes de ir ao ar no Instagram.",
      )
    )
      return;

    setLoading(true);
    const res = await resetarSorteio();
    setLoading(false);

    if ("error" in res) {
      setError(res.error);
    } else {
      setResultado(null);
      setDisplayNumber("000");
      setError(null);
    }
  };

  const jaSorteado = resultado !== null && !spinning;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8 text-center">
      <div className="cartao w-full max-w-lg p-10">
        <h2 className="mb-8 border-b border-rose-deep/15 pb-4 font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
          Roleta da Sorte 🍀
        </h2>

        <div className="mb-8 rounded-2xl border-2 border-sage/30 bg-sage-soft py-8 font-[family-name:var(--font-baloo)] text-8xl font-bold tracking-widest text-sage-deep shadow-inner">
          {displayNumber}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose/40 bg-blush/15 p-4 font-medium text-rose-deep">
            {error}
          </div>
        )}

        {jaSorteado && resultado && (
          <div className="mb-8 rounded-xl border border-sage/40 bg-sage-soft p-6 text-sage-deeper">
            <p className="text-lg">Parabéns ao ganhador! 🎉</p>
            <p className="mt-2 font-[family-name:var(--font-baloo)] text-3xl font-bold text-rose-deep">
              {resultado.nome}
            </p>
            <p className="mt-3 text-xs text-mauve">
              Sorteado em{" "}
              {new Date(resultado.sorteadoEm).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}

        <button
          onClick={iniciarSorteio}
          disabled={loading || spinning || jaSorteado}
          className="botao-primario w-full py-4 text-xl"
        >
          {spinning
            ? "Sorteando…"
            : jaSorteado
              ? "Sorteio Realizado ✓"
              : "Realizar Sorteio"}
        </button>

        {jaSorteado && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="mt-4 w-full py-2 text-sm text-mauve/60 transition hover:text-rose-deep disabled:opacity-50"
          >
            Refazer sorteio (somente para testes)
          </button>
        )}
      </div>
    </div>
  );
}
