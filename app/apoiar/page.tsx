import Link from "next/link";
import ApoiarFlow from "@/components/ApoiarFlow";
import { TOTAL_NUMEROS, MAX_NUMEROS_POR_PEDIDO } from "@/lib/rifa";

export const dynamic = "force-dynamic";

/**
 * Checkout de apoio: recebe os números escolhidos via `?n=3,7,42`.
 *
 * Não filtramos aqui os que já foram reservados — se algum "voar", a reserva
 * no servidor escolhe um substituto livre para manter a quantidade (e o valor)
 * que a pessoa decidiu doar. A troca é avisada com carinho no fluxo.
 */
export default async function ApoiarPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string | string[] }>;
}) {
  const sp = await searchParams;
  const bruto = Array.isArray(sp.n) ? sp.n.join(",") : (sp.n ?? "");

  const numeros = Array.from(
    new Set(
      bruto
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((x) => Number.isInteger(x) && x >= 1 && x <= TOTAL_NUMEROS),
    ),
  )
    .sort((a, b) => a - b)
    .slice(0, MAX_NUMEROS_POR_PEDIDO);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-12 sm:px-6">
      {numeros.length === 0 ? (
        <div className="cartao anim-surgir flex flex-col items-center gap-4 px-6 py-9 text-center">
          <span className="text-5xl" role="img" aria-hidden>
            🐾
          </span>
          <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
            Vamos escolher os números?
          </h1>
          <p className="max-w-sm text-ink/85">
            Volte para a grade, toque nos números que você quer e clique em
            “Continuar” para apoiar o Suspiro 💛
          </p>
          <Link href="/#numeros" className="botao-primario mt-1">
            Ir para a grade
          </Link>
        </div>
      ) : (
        <ApoiarFlow numeros={numeros} />
      )}
    </main>
  );
}
