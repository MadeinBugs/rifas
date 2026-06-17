"use client";

import Link from "next/link";
import { useNumeros } from "@/components/NumerosProvider";
import { PRECO_POR_NUMERO, formatBRL } from "@/lib/rifa";

/**
 * Barra fofa fixa no rodapé que aparece quando há números escolhidos.
 * Mostra a quantidade, o total e leva para o checkout (uma cobrança só).
 * Sem ícones de carrinho — a pegada é de "ação entre amigos", não de loja.
 */
export default function BarraSelecao() {
  const { selecionadosOrdenados, quantidade, limpar } = useNumeros();

  if (quantidade < 1) return null;

  const total = quantidade * PRECO_POR_NUMERO;
  const href = `/apoiar?n=${selecionadosOrdenados.join(",")}`;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="anim-surgir pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full border border-rose-deep/10 bg-surface/95 px-4 py-3 shadow-[0_12px_34px_-12px_rgba(109,104,117,0.5)] backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-quicksand)] text-sm font-semibold text-mauve">
            Você escolheu {quantidade}{" "}
            {quantidade === 1 ? "número" : "números"} 💛
          </p>
          <p className="text-xs text-mauve/70">
            {quantidade} × {formatBRL(PRECO_POR_NUMERO)} ={" "}
            <strong className="text-sage-deep">{formatBRL(total)}</strong> · Pix
          </p>
        </div>

        <button
          type="button"
          onClick={limpar}
          className="shrink-0 text-xs text-rose-deep/70 underline-offset-2 hover:underline"
        >
          limpar
        </button>

        <Link href={href} className="botao-primario shrink-0 px-5 py-2.5 text-sm">
          Continuar
        </Link>
      </div>
    </div>
  );
}
