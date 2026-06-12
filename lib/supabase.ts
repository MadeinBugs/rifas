import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Indica se as variáveis públicas do Supabase já foram configuradas. */
export function hasSupabaseEnv(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Cliente PÚBLICO (anon). Pode rodar no browser e no server.
 * Use APENAS para ler a tabela `numeros` e ouvir o Realtime.
 * A tabela `compradores` é protegida por RLS e NUNCA fica acessível por aqui.
 */
export function createAnonClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

let browserClient: SupabaseClient | null = null;

/**
 * Singleton do cliente anon para uso em componentes client
 * (ex.: assinatura do Realtime na Fase 2). Evita abrir várias conexões.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createAnonClient();
  }
  return browserClient;
}
