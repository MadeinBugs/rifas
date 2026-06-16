"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { realizarSorteio } from "./actions";

export default function SorteioClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ numero: number; nome: string } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<string>("000");

  const iniciarSorteio = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);
    setSpinning(true);

    // Efeito visual (suspense de 3 segundos)
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 500 + 1).toString().padStart(3, "0"));
    }, 50);

    const res = await realizarSorteio();

    setTimeout(() => {
      clearInterval(interval);
      setSpinning(false);
      setLoading(false);

      if ("error" in res) {
        setError(res.error);
        setDisplayNumber("000");
      } else {
        setResultado(res);
        setDisplayNumber(res.numero.toString().padStart(3, "0"));
        
        // Efeito de confete ao ganhar!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#10b981", "#fbbf24", "#f59e0b", "#ef4444"],
        });
      }
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      
      <div className="bg-white p-12 rounded-3xl shadow-xl border w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-700 mb-8 border-b pb-4">Roleta do Sorteio</h2>
        
        <div className="text-8xl font-black text-blue-600 font-mono tracking-widest mb-8 py-8 bg-gray-50 rounded-2xl border-2 border-gray-100 shadow-inner">
          {displayNumber}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-6 font-medium">
            {error}
          </div>
        )}

        {resultado && !spinning && (
          <div className="animate-bounce bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 mb-8">
            <p className="text-lg">Parabéns ao ganhador!</p>
            <p className="text-3xl font-bold mt-2">{resultado.nome}</p>
          </div>
        )}

        <button
          onClick={iniciarSorteio}
          disabled={loading || spinning}
          className={`w-full py-4 text-xl font-bold text-white rounded-xl shadow-md transition transform hover:-translate-y-1 ${
            loading || spinning
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
        >
          {spinning ? "Sorteando..." : "Realizar Sorteio"}
        </button>
      </div>

    </div>
  );
}
