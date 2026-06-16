"use client";

import { useEffect, useRef, useState } from "react";
import { useNumeros } from "./NumerosProvider";
import { META_ARRECADACAO, formatBRL } from "@/lib/rifa";

/**
 * Barra de progresso da arrecadação, ao vivo. Fica em destaque na capa para
 * mostrar, com carinho, o quanto já foi alcançado rumo ao tratamento do Suspiro.
 * A barra anima suavemente conforme novos números são pagos.
 */
export default function BarraProgresso({
  className = "",
}: {
  className?: string;
}) {
  const { arrecadado } = useNumeros();
  const progresso = Math.min(
    100,
    Math.round((arrecadado / META_ARRECADACAO) * 100),
  );

  // Largura animada: começa em 0 e cresce até o valor real (efeito de "enchendo").
  const [largura, setLargura] = useState(0);
  const montou = useRef(false);

  useEffect(() => {
    if (!montou.current) {
      // pequeno atraso pra garantir a transição na primeira pintura
      const t = setTimeout(() => {
        montou.current = true;
        setLargura(progresso);
      }, 120);
      return () => clearTimeout(t);
    }
    setLargura(progresso);
  }, [progresso]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <span className="font-[family-name:var(--font-quicksand)] text-sm font-semibold text-mauve">
          Já arrecadado
        </span>
        <span className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-sage-deep">
          {formatBRL(arrecadado)}
        </span>
      </div>

      <div
        className="h-4 w-full overflow-hidden rounded-full bg-sage-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progresso}
        aria-label={`Arrecadação: ${progresso}% da meta`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sage to-sage-deep transition-[width] duration-1000 ease-out"
          style={{ width: `${largura}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-mauve/80">
        <span>{progresso}% da meta</span>
        <span>Meta: {formatBRL(META_ARRECADACAO)}</span>
      </div>
    </div>
  );
}
