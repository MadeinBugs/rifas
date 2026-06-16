"use server";

import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";

export interface ResultadoSorteio {
  numero: number;
  nome: string;
  sorteadoEm: string; // ISO string
  jaSorteado: boolean; // true = resultado recuperado do banco, não gerado agora
}

/**
 * Lê o resultado persistido (se houver), sem lock.
 * Retorna null se o sorteio ainda não foi realizado.
 */
async function lerSorteioExistente(): Promise<ResultadoSorteio | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sorteio")
    .select(`
      numero,
      sorteado_em,
      numeros (
        compradores ( nome )
      )
    `)
    .eq("id", 1)
    .maybeSingle();

  if (!data) return null;

  // Supabase pode retornar a relação FK como objeto ou array; tratar os dois casos
  const numerosRaw = Array.isArray(data.numeros) ? data.numeros[0] : data.numeros;
  const compradores = numerosRaw?.compradores;
  const lista = Array.isArray(compradores) ? compradores : compradores ? [compradores] : [];
  const nome = lista[0]?.nome || "Anônimo";

  return {
    numero: data.numero,
    nome,
    sorteadoEm: data.sorteado_em,
    jaSorteado: true,
  };
}

/**
 * Realiza o sorteio entre os números pagos e persiste o resultado.
 *
 * - Se já existe um resultado salvo, retorna o mesmo (idempotente).
 * - Usa `crypto.randomInt` (CSPRNG) em vez de `Math.random` para seleção justa.
 * - Em caso de corrida (dois cliques simultâneos), o conflito de PK (id=1)
 *   garante que apenas um vencedor seja inserido; o perdedor relê o vencedor.
 */
export async function realizarSorteio(): Promise<ResultadoSorteio | { error: string }> {
  await requireAuth();

  // Verificar se já existe resultado antes de qualquer trabalho pesado
  const existente = await lerSorteioExistente();
  if (existente) return existente;

  const supabase = createServiceClient();

  // Buscar números pagos com nome do comprador
  const { data: pagos, error } = await supabase
    .from("numeros")
    .select(`
      numero,
      compradores ( nome )
    `)
    .eq("status", "pago");

  if (error) {
    return { error: "Erro ao consultar números pagos." };
  }
  if (!pagos || pagos.length === 0) {
    return { error: "Nenhum número pago para sortear." };
  }

  // Seleção criptograficamente justa
  const idx = crypto.randomInt(pagos.length);
  const vencedor = pagos[idx];
  const lista = Array.isArray(vencedor.compradores)
    ? vencedor.compradores
    : vencedor.compradores
    ? [vencedor.compradores]
    : [];
  const nome = lista[0]?.nome || "Anônimo";

  // Persistir com id=1 (singleton). Em conflito de PK por corrida, ler o existente.
  const { error: insertError } = await supabase
    .from("sorteio")
    .insert({ id: 1, numero: vencedor.numero });

  if (insertError) {
    // Conflito de PK = outra instância ganhou a corrida; devolver o vencedor real
    if (insertError.code === "23505") {
      const existenteAposConflito = await lerSorteioExistente();
      if (existenteAposConflito) return existenteAposConflito;
    }
    return { error: "Erro ao salvar resultado do sorteio." };
  }

  // Reler para obter o sorteado_em gerado pelo banco
  const final = await lerSorteioExistente();
  return final ?? { numero: vencedor.numero, nome, sorteadoEm: new Date().toISOString(), jaSorteado: false };
}

/**
 * Apaga o resultado do sorteio para permitir refazer (uso em testes pré-live).
 * Requer autenticação; deve ser protegido por confirmação no client.
 */
export async function resetarSorteio(): Promise<{ ok: boolean } | { error: string }> {
  await requireAuth();
  const supabase = createServiceClient();
  const { error } = await supabase.from("sorteio").delete().eq("id", 1);
  if (error) return { error: "Erro ao resetar sorteio." };
  return { ok: true };
}
