"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  TOTAL_NUMEROS,
  PRECO_POR_NUMERO,
  type NumeroRow,
  type NumeroStatus,
} from "@/lib/rifa";

interface Contagem {
  livres: number;
  reservados: number;
  pagos: number;
}

interface NumerosContexto {
  statusPorNumero: Record<number, NumeroStatus>;
  contagem: Contagem;
  /** Total arrecadado (R$) = números pagos × preço. */
  arrecadado: number;
  aoVivo: boolean;
}

const Ctx = createContext<NumerosContexto | null>(null);

/**
 * Fonte única da verdade em tempo real para o estado dos números.
 * Mantém UMA assinatura Realtime e compartilha o mapa + contagens com a grade
 * e com a barra de progresso, evitando assinaturas duplicadas.
 */
export function NumerosProvider({
  initial,
  children,
}: {
  initial: NumeroRow[];
  children: ReactNode;
}) {
  const [statusPorNumero, setStatusPorNumero] = useState<
    Record<number, NumeroStatus>
  >(() => {
    const mapa: Record<number, NumeroStatus> = {};
    for (const row of initial) mapa[row.numero] = row.status;
    return mapa;
  });
  const [aoVivo, setAoVivo] = useState(false);

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

  const contagem = useMemo<Contagem>(() => {
    let livres = 0;
    let reservados = 0;
    let pagos = 0;
    for (let n = 1; n <= TOTAL_NUMEROS; n++) {
      const s = statusPorNumero[n] ?? "livre";
      if (s === "livre") livres++;
      else if (s === "reservado") reservados++;
      else pagos++;
    }
    return { livres, reservados, pagos };
  }, [statusPorNumero]);

  const valor = useMemo<NumerosContexto>(
    () => ({
      statusPorNumero,
      contagem,
      arrecadado: contagem.pagos * PRECO_POR_NUMERO,
      aoVivo,
    }),
    [statusPorNumero, contagem, aoVivo],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** Acessa o estado dos números. Deve ser usado dentro de <NumerosProvider>. */
export function useNumeros(): NumerosContexto {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useNumeros precisa estar dentro de <NumerosProvider>.");
  }
  return ctx;
}
