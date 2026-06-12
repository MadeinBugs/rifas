import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente ADMINISTRATIVO (service role). SOMENTE no servidor.
 * Ignora RLS — usado nas rotas /api para reservar números, marcar pago,
 * ler `compradores` no /admin, etc.
 *
 * O import "server-only" garante, em tempo de build, que este módulo
 * NUNCA seja incluído em um bundle do client (vazaria a chave secreta).
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
