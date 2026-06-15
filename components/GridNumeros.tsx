"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  TOTAL_NUMEROS,
  formatBRL,
  PRECO_POR_NUMERO,
  type NumeroRow,
  type NumeroStatus,
} from "@/lib/rifa";

type Props = {
  /** Estado inicial vindo do servidor (Server Component). */
  initial: NumeroRow[];
};

const ESTILO_BOTAO: Record<NumeroStatus, string> = {
  livre:
    "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50",
  reservado:
    "bg-amber-50 text-amber-700 border-amber-300 cursor-not-allowed dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  pago: "bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700",
};

export default function GridNumeros({ initial }: Props) {
  // Mapa numero -> status, semeado com o estado inicial do servidor.
  const [statusPorNumero, setStatusPorNumero] = useState<
    Record<number, NumeroStatus>
  >(() => {
    const mapa: Record<number, NumeroStatus> = {};
    for (const row of initial) mapa[row.numero] = row.status;
    return mapa;
  });
  const [aoVivo, setAoVivo] = useState(false);

  // Realtime: escuta mudanças na tabela `numeros` e atualiza só a célula afetada.
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const canal = supabase
      .channel("numeros-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "numeros" },
        (payload) => {
          const row = payload.new as Partial<NumeroRow> | null;
          if (row && typeof row.numero === "number" && row.status) {
            setStatusPorNumero((prev) => ({
              ...prev,
              [row.numero as number]: row.status as NumeroStatus,
            }));
          }
        },
      )
      .subscribe((status) => {
        setAoVivo(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const numeros = useMemo(
    () => Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1),
    [],
  );

  const contagem = useMemo(() => {
    let livres = 0;
    let reservados = 0;
    let pagos = 0;
    for (const n of numeros) {
      const s = statusPorNumero[n] ?? "livre";
      if (s === "livre") livres++;
      else if (s === "reservado") reservados++;
      else pagos++;
    }
    return { livres, reservados, pagos };
  }, [numeros, statusPorNumero]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Escolha o seu número da sorte
        </h2>
        <span
          className="flex items-center gap-1.5 text-xs text-zinc-500"
          title={aoVivo ? "Atualizando em tempo real" : "Conectando…"}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              aoVivo ? "bg-emerald-500" : "bg-zinc-400"
            }`}
            aria-hidden
          />
          {aoVivo ? "Ao vivo" : "Conectando…"}
        </span>
      </div>

      {/* Legenda + contadores */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Legenda cor="bg-emerald-300" rotulo="Livres" valor={contagem.livres} />
        <Legenda
          cor="bg-amber-300"
          rotulo="Reservados"
          valor={contagem.reservados}
        />
        <Legenda cor="bg-zinc-300" rotulo="Pagos" valor={contagem.pagos} />
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
          const classes = `flex h-11 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors ${ESTILO_BOTAO[status]}`;

          if (status === "livre") {
            return (
              <Link
                key={n}
                href={`/comprar/${n}`}
                className={classes}
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
    <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
      <span className={`inline-block h-3 w-3 rounded ${cor}`} aria-hidden />
      {rotulo}
      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
        {valor}
      </strong>
    </span>
  );
}
