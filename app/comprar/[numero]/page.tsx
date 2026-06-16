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
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12 sm:px-6">
      {jaPago ? (
        <div className="cartao anim-surgir flex flex-col items-center gap-4 px-6 py-9 text-center">
          <span className="text-5xl" role="img" aria-hidden>
            💛
          </span>
          <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
            O número {n} já tem dono
          </h1>
          <p className="max-w-sm text-ink/85">
            Esse já está garantido por alguém. Escolha outro na grade e venha
            ajudar o Suspiro também! 🐾
          </p>
          <Link href="/" className="botao-primario mt-1">
            Escolher outro número
          </Link>
        </div>
      ) : (
        <ComprarFlow numero={n} />
      )}
    </main>
  );
}

