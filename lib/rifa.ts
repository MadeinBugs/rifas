/**
 * Configuração e tipos compartilhados da rifa.
 * Centralizado para o frontend e o backend usarem os mesmos valores.
 */

export const TOTAL_NUMEROS = 500;
export const PRECO_POR_NUMERO = 10; // R$
export const PREMIO = "R$ 100 em iFood Card";

/**
 * Máximo de números que uma pessoa pode reservar em um único pedido.
 * Trava anti-abuso por checkout (o captcha cuida dos bots).
 */
export const MAX_NUMEROS_POR_PEDIDO = 50;

/** Minutos que um número fica reservado aguardando o pagamento do Pix. */
export const RESERVA_MINUTOS = 15;

/** Meta de arrecadação (R$). Usada na barra de progresso da história. */
export const META_ARRECADACAO = TOTAL_NUMEROS * PRECO_POR_NUMERO; // R$ 5.000

export type NumeroStatus = "livre" | "reservado" | "pago";

/** Linha pública da tabela `numeros` (sem dados pessoais). */
export type NumeroRow = {
  numero: number;
  status: NumeroStatus;
};

/** Formata um valor numérico (em reais) como moeda BRL. */
export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
