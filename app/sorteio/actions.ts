"use server";

import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";

export async function realizarSorteio(): Promise<{
  numero: number;
  nome: string;
} | { error: string }> {
  await requireAuth();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("numeros")
    .select(`
      numero,
      compradores (nome)
    `)
    .eq("status", "pago");

  if (error) {
    return { error: "Erro ao consultar números pagos." };
  }

  if (!data || data.length === 0) {
    return { error: "Nenhum número pago para sortear." };
  }

  // Escolhendo o vencedor aleatoriamente aqui no servidor para segurança
  const winnerIndex = Math.floor(Math.random() * data.length);
  const vencedor = data[winnerIndex];

  const compradorList = Array.isArray(vencedor.compradores)
    ? vencedor.compradores
    : [vencedor.compradores];
  
  const nomeVencedor = compradorList[0]?.nome || "Anônimo";

  return {
    numero: vencedor.numero,
    nome: nomeVencedor,
  };
}
