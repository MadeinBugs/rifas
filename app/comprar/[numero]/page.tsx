import Link from "next/link";
import { notFound } from "next/navigation";
import { TOTAL_NUMEROS, PRECO_POR_NUMERO, formatBRL } from "@/lib/rifa";

// Placeholder da Fase 2. O fluxo de pagamento (form + QR Code Pix + polling)
// será implementado na Fase 3.
export const dynamic = "force-dynamic";

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const n = Number(numero);

  if (!Number.isInteger(n) || n < 1 || n > TOTAL_NUMEROS) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="text-5xl" role="img" aria-label="bilhete">
        🎟️
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Número {n} selecionado
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Valor: <strong>{formatBRL(PRECO_POR_NUMERO)}</strong>
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
        O formulário e o pagamento via Pix chegam na{" "}
        <strong>Fase 3</strong>. Por enquanto, esta página confirma que a
        navegação a partir da grade está funcionando.
      </div>

      <Link
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← Voltar para a grade
      </Link>
    </main>
  );
}
