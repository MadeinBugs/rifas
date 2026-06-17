"use client";

import {
  createContext,
  useCallback,
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
  MAX_NUMEROS_POR_PEDIDO,
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
  /** Números que a pessoa selecionou para comprar de uma vez. */
  selecionados: Set<number>;
  /** Os selecionados em ordem crescente (para exibir e montar a URL). */
  selecionadosOrdenados: number[];
  /** Adiciona/remove um número da seleção (respeitando o máximo). */
  alternar: (n: number) => void;
  /** Limpa toda a seleção. */
  limpar: () => void;
  /** Quantidade selecionada. */
  quantidade: number;
  /** Máximo de números por pedido. */
  maximo: number;
  /** Já chegou no máximo permitido. */
  atingiuMax: boolean;
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
  const [selecionados, setSelecionados] = useState<Set<number>>(
    () => new Set(),
  );

  const alternar = useCallback((n: number) => {
    setSelecionados((prev) => {
      const prox = new Set(prev);
      if (prox.has(n)) {
        prox.delete(n);
      } else {
        // Trava no máximo por pedido (não silenciamos: a UI avisa).
        if (prox.size >= MAX_NUMEROS_POR_PEDIDO) return prev;
        prox.add(n);
      }
      return prox;
    });
  }, []);

  const limpar = useCallback(() => setSelecionados(new Set()), []);

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

  const valor = useMemo<NumerosContexto>(() => {
    const selecionadosOrdenados = Array.from(selecionados).sort(
      (a, b) => a - b,
    );
    return {
      statusPorNumero,
      contagem,
      arrecadado: contagem.pagos * PRECO_POR_NUMERO,
      aoVivo,
      selecionados,
      selecionadosOrdenados,
      alternar,
      limpar,
      quantidade: selecionados.size,
      maximo: MAX_NUMEROS_POR_PEDIDO,
      atingiuMax: selecionados.size >= MAX_NUMEROS_POR_PEDIDO,
    };
  }, [statusPorNumero, contagem, aoVivo, selecionados, alternar, limpar]);

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
