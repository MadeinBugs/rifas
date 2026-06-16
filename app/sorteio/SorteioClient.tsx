"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { realizarSorteio, resetarSorteio, type ResultadoSorteio } from "./actions";

interface Props {
  resultadoInicial: ResultadoSorteio | null;
}

export default function SorteioClient({ resultadoInicial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(resultadoInicial);
  const [spinning, setSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<string>(
    resultadoInicial ? resultadoInicial.numero.toString().padStart(3, "0") : "000",
  );

  const iniciarSorteio = async () => {
    setLoading(true);
    setError(null);
    setSpinning(true);

    // Efeito visual de suspense enquanto a action roda no servidor
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 500 + 1).toString().padStart(3, "0"));
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
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#10b981", "#fbbf24", "#f59e0b", "#ef4444"],
        });
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <div className="bg-white p-12 rounded-3xl shadow-xl border w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-700 mb-8 border-b pb-4">Roleta do Sorteio</h2>

        <div className="text-8xl font-black text-blue-600 font-mono tracking-widest mb-8 py-8 bg-gray-50 rounded-2xl border-2 border-gray-100 shadow-inner">
          {displayNumber}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-6 font-medium">{error}</div>
        )}

        {jaSorteado && resultado && (
          <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 mb-8">
            <p className="text-lg">Parabéns ao ganhador!</p>
            <p className="text-3xl font-bold mt-2">{resultado.nome}</p>
            <p className="text-xs text-green-600 mt-3">
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
          className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-md transition transform hover:-translate-y-1 ${
            loading || spinning || jaSorteado
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
        >
          {spinning ? "Sorteando..." : jaSorteado ? "Sorteio Realizado ✓" : "Realizar Sorteio"}
        </button>

        {jaSorteado && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-red-500 transition disabled:opacity-50"
          >
            Refazer sorteio (somente para testes)
          </button>
        )}
      </div>
    </div>
  );
}
