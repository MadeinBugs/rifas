import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-admin";
import { TOTAL_NUMEROS } from "@/lib/rifa";

export const dynamic = "force-dynamic";

/**
 * Rota antiga de compra de um número só. Mantida por compatibilidade:
 * agora redireciona para o checkout unificado (/apoiar), que cuida de um ou
 * vários números. Se o número já estiver pago, mostramos um aviso gentil.
 */
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

  // Estado atual do número (server-side) para evitar mandar para o checkout
  // um número já pago.
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
    // Se a checagem falhar, seguimos para o checkout (a reserva validará de novo).
  }

  if (!jaPago) {
    redirect(`/apoiar?n=${n}`);
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12 sm:px-6">
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
    </main>
  );
}

