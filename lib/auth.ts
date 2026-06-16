import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "rifa_admin_session";

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error("ADMIN_PASSWORD não está configurada nas variáveis de ambiente.");
  }
  return pwd;
}

export async function isLogado(): Promise<boolean> {
  const c = await cookies();
  const val = c.get(COOKIE_NAME)?.value;
  if (!val) return false;

  const validHash = crypto.createHash("sha256").update(getAdminPassword()).digest("hex");
  try {
    const a = Buffer.from(val, "hex");
    const b = Buffer.from(validHash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  const pwd = getAdminPassword();
  if (password !== pwd) {
    return false;
  }
  
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const c = await cookies();
  c.set(COOKIE_NAME, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
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
