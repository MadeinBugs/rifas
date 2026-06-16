import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "rifa_admin_session";
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 dias

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error("ADMIN_PASSWORD não está configurada nas variáveis de ambiente.");
  }
  return pwd;
}

/**
 * Lê SESSION_SECRET do ambiente. Exige pelo menos 32 caracteres para
 * garantir entropia suficiente.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET não está configurada ou é muito curta (mínimo 32 caracteres). " +
      "Gere com: openssl rand -hex 32",
    );
  }
  return secret;
}

/**
 * Cria o valor do cookie: `<issuedAt>.<hmac>`
 * O HMAC vincula o token ao SESSION_SECRET do servidor, não à senha.
 * Revogar: rotacionar SESSION_SECRET invalida todos os tokens existentes.
 */
function criarTokenSessao(): string {
  const issuedAt = Date.now().toString();
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(`admin:${issuedAt}`)
    .digest("hex");
  return `${issuedAt}.${sig}`;
}

/**
 * Valida o token e verifica expiração no servidor, independente do maxAge
 * do cookie, para que a rotação do SESSION_SECRET invalide tokens imediatamente.
 */
function validarTokenSessao(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [issuedAt, sig] = parts;

  // Verificar assinatura com timingSafeEqual (evita timing attacks)
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(`admin:${issuedAt}`)
    .digest("hex");

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  // Verificar expiração server-side (7 dias em ms)
  const age = Date.now() - parseInt(issuedAt, 10);
  if (isNaN(age) || age < 0 || age > MAX_AGE_S * 1000) return false;

  return true;
}

export async function isLogado(): Promise<boolean> {
  const c = await cookies();
  const val = c.get(COOKIE_NAME)?.value;
  if (!val) return false;
  try {
    return validarTokenSessao(val);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  const pwd = getAdminPassword();

  // Comparação em tempo constante para evitar timing attacks na senha
  const a = Buffer.from(crypto.createHash("sha256").update(password).digest("hex"), "hex");
  const b = Buffer.from(crypto.createHash("sha256").update(pwd).digest("hex"), "hex");
  const senhaCorreta = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!senhaCorreta) return false;

  const token = criarTokenSessao();
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_S,
    path: "/",
  });
  return true;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
  redirect("/admin/login");
}

export async function requireAuth(): Promise<void> {
  if (!(await isLogado())) {
    redirect("/admin/login");
  }
}
