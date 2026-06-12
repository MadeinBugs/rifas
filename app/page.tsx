import { createAnonClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type ConnStatus =
  | { ok: true; total: number; livres: number }
  | {
      ok: false;
      kind: "env" | "erro";
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    };

async function checarSupabase(): Promise<ConnStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      ok: false,
      kind: "env",
      message: "Variáveis do Supabase ainda não preenchidas no .env.local.",
    };
  }
  try {
    const supabase = createAnonClient();
    const total = await supabase
      .from("numeros")
      .select("*", { count: "exact", head: true });
    if (total.error) {
      console.error("[checarSupabase] erro na query numeros:", total.error);
      return {
        ok: false,
        kind: "erro",
        message: total.error.message || "(sem mensagem)",
        code: total.error.code,
        details: total.error.details ?? undefined,
        hint: total.error.hint ?? undefined,
      };
    }
    const livres = await supabase
      .from("numeros")
      .select("*", { count: "exact", head: true })
      .eq("status", "livre");
    return { ok: true, total: total.count ?? 0, livres: livres.count ?? 0 };
  } catch (e) {
    console.error("[checarSupabase] exceção:", e);
    return {
      ok: false,
      kind: "erro",
      message: e instanceof Error ? e.message : "Erro desconhecido.",
    };
  }
}

export default async function Home() {
  const status = await checarSupabase();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl" role="img" aria-label="gatinho">
          🐱
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ação Solidária pelo Gatinho
        </h1>
        <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
          Uma ação entre amigos para ajudar no tratamento do nosso gatinho. Em
          breve você vai poder escolher o seu número da sorte. 🍀
        </p>
      </section>

      {/* Resumo da ação (placeholders da Fase 2) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card titulo="500 números" texto="R$ 10 cada" />
        <Card titulo="Prêmio único" texto="R$ 100 em iFood Card" />
        <Card titulo="Pagamento" texto="Pix via Mercado Pago" />
      </section>

      {/* Status de configuração (Fase 1) */}
      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Status da configuração · Fase 1
        </h2>
        <StatusConexao status={status} />
      </section>

      <footer className="mt-auto pt-6 text-center text-xs text-zinc-400">
        Fase 1 — Fundação · Next.js + Supabase. A grade de números chega na Fase 2.
      </footer>
    </main>
  );
}

function Card({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {titulo}
      </p>
      <p className="mt-1 font-semibold">{texto}</p>
    </div>
  );
}

function StatusConexao({ status }: { status: ConnStatus }) {
  if (status.ok) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
          <span aria-hidden>✅</span> Supabase conectado
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {status.total} números no banco · {status.livres} livres
        </p>
        {status.total === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Conectou, mas a tabela está vazia. Rode o{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              supabase/schema.sql
            </code>{" "}
            para popular de 1 a 500.
          </p>
        )}
      </div>
    );
  }

  if (status.kind === "env") {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
          <span aria-hidden>⚠️</span> Faltam as variáveis de ambiente
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Copie{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            .env.example
          </code>{" "}
          para{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            .env.local
          </code>
          , preencha as chaves do Supabase e reinicie o servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
        <span aria-hidden>❌</span> Erro ao consultar o Supabase
      </p>
      <p className="text-sm break-words text-zinc-700 dark:text-zinc-300">
        <strong>Mensagem:</strong> {status.message}
      </p>
      {status.code && (
        <p className="text-sm break-words text-zinc-600 dark:text-zinc-400">
          <strong>Código:</strong>{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            {status.code}
          </code>
        </p>
      )}
      {status.details && (
        <p className="text-sm break-words text-zinc-600 dark:text-zinc-400">
          <strong>Detalhes:</strong> {status.details}
        </p>
      )}
      {status.hint && (
        <p className="text-sm break-words text-zinc-600 dark:text-zinc-400">
          <strong>Dica:</strong> {status.hint}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-400">
        Veja também o terminal do <code>npm run dev</code> para o log completo.
      </p>
    </div>
  );
}
