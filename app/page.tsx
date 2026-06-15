import { createAnonClient } from "@/lib/supabase";
import GridNumeros from "@/components/GridNumeros";
import HistoriaGato from "@/components/HistoriaGato";
import {
  PRECO_POR_NUMERO,
  PREMIO,
  TOTAL_NUMEROS,
  formatBRL,
  type NumeroRow,
} from "@/lib/rifa";

export const dynamic = "force-dynamic";

type Resultado =
  | { ok: true; rows: NumeroRow[] }
  | { ok: false; message: string };

async function getNumeros(): Promise<Resultado> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      ok: false,
      message: "Variáveis do Supabase ainda não preenchidas no .env.local.",
    };
  }
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("numeros")
      .select("numero, status")
      .order("numero");
    if (error) {
      console.error("[getNumeros] erro:", error);
      return { ok: false, message: error.message || "(sem mensagem)" };
    }
    return { ok: true, rows: (data ?? []) as NumeroRow[] };
  } catch (e) {
    console.error("[getNumeros] exceção:", e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro desconhecido.",
    };
  }
}

export default async function Home() {
  const resultado = await getNumeros();
  const pagos = resultado.ok
    ? resultado.rows.filter((r) => r.status === "pago").length
    : 0;
  const arrecadado = pagos * PRECO_POR_NUMERO;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl" role="img" aria-label="gatinho">
          🐱
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ação Solidária pelo Gatinho
        </h1>
        <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
          Uma ação entre amigos para ajudar no tratamento do nosso gatinho.
          Escolha um número, contribua e concorra ao prêmio. 🍀
        </p>
      </section>

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          titulo={`${TOTAL_NUMEROS} números`}
          texto={`${formatBRL(PRECO_POR_NUMERO)} cada`}
        />
        <Card titulo="Prêmio único" texto={PREMIO} />
        <Card titulo="Pagamento" texto="Pix via Mercado Pago" />
      </section>

      {/* História do gato + meta */}
      <HistoriaGato arrecadado={arrecadado} />

      {/* Grade de números (ou erro de conexão) */}
      {resultado.ok ? (
        <GridNumeros initial={resultado.rows} />
      ) : (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <p className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
            <span aria-hidden>❌</span> Não foi possível carregar os números
          </p>
          <p className="mt-2 text-sm break-words text-zinc-600 dark:text-zinc-400">
            {resultado.message}
          </p>
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-zinc-400">
        Ação entre amigos · Pagamento seguro via Pix · Os dados informados são
        usados apenas para contato sobre esta ação.
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
