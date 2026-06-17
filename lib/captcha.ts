import "server-only";

/**
 * Verificação anti-bot via Cloudflare Turnstile (server-side).
 *
 * Postura:
 * - Produção: exige TURNSTILE_SECRET. Sem secret ou sem token válido → recusa.
 * - Desenvolvimento: se TURNSTILE_SECRET não estiver configurado, libera
 *   (para não travar testes locais). Configure o secret para testar de verdade.
 *
 * Turnstile (modo Managed): a Cloudflare decide em tempo real — visitantes
 * legítimos passam de forma invisível; só tráfego suspeito recebe desafio.
 */
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Indica se o Turnstile está configurado neste ambiente (secret presente). */
export function turnstileConfigurado(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET);
}

type SiteverifyResposta = {
  success?: boolean;
  "error-codes"?: string[];
};

export async function verificarCaptcha(
  token: string | null | undefined,
  ip?: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[captcha] TURNSTILE_SECRET ausente em produção — recusando a reserva.",
      );
      return false;
    }
    console.warn(
      "[captcha] TURNSTILE_SECRET ausente — ignorando verificação (dev).",
    );
    return true;
  }

  if (!token) return false;

  try {
    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token);
    if (ip) params.set("remoteip", ip);

    const resp = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });

    if (!resp.ok) {
      console.error("[captcha] siteverify respondeu", resp.status);
      return false;
    }

    const dados = (await resp.json()) as SiteverifyResposta;
    if (dados.success !== true) {
      console.warn("[captcha] token Turnstile rejeitado:", dados["error-codes"]);
    }
    return dados.success === true;
  } catch (e) {
    console.error("[captcha] falha ao verificar token:", e);
    return false;
  }
}
