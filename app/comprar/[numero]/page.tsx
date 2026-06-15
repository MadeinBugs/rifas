import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-admin";
import ComprarFlow from "@/components/ComprarFlow";
import { TOTAL_NUMEROS } from "@/lib/rifa";

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

  // Estado atual do número (server-side) para evitar mostrar o form de um número já pago.
  let jaPago = false;
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("numeros")
      .select("status")
      .eq("numero", n)
      .single();
    jaPago = data?.status === "pago";
  } catch {
    // Se a checagem falhar, deixamos o fluxo normal seguir (a reserva validará de novo).
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      {jaPago ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-5xl" role="img" aria-hidden>
            ✅
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Número {n} já foi pago
          </h1>
          <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
            Este número já tem dono. Escolha outro na grade para participar!
          </p>
          <Link href="/" className="botao-voltar">
            ← Escolher outro número
          </Link>
        </div>
      ) : (
        <ComprarFlow numero={n} />
      )}
    </main>
  );
}

