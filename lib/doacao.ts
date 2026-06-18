/**
 * Configuração e helpers da doação internacional (Stripe, em USD).
 * Espelha o papel de lib/rifa.ts, mas para a página de doação em inglês.
 *
 * Valores em centavos (a menor unidade da moeda), como o Stripe espera.
 */

export const DONATION_CURRENCY = "usd";

/** Valor mínimo aceito: US$ 2.00 (acima do mínimo técnico do Stripe). */
export const DONATION_MIN_CENTS = 200;

/** Valor máximo aceito por doação: US$ 1,000.00 (trava anti-erro/anti-abuso). */
export const DONATION_MAX_CENTS = 100_000;

/** Valores sugeridos (em centavos) exibidos como atalhos. */
export const SUGESTOES_CENTS = [500, 1500, 3000] as const;

/** Formata centavos de USD como "$12.00" (en-US). */
export function formatUSD(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Valida um valor de doação (em centavos): inteiro e dentro dos limites.
 * Boundary de servidor e de cliente.
 */
export function valorDoacaoValido(cents: unknown): cents is number {
  return (
    typeof cents === "number" &&
    Number.isInteger(cents) &&
    cents >= DONATION_MIN_CENTS &&
    cents <= DONATION_MAX_CENTS
  );
}
