import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import CartaoAtualizacao from "@/components/CartaoAtualizacao";
import { listarAtualizacoes, TEXTOS } from "@/lib/updates";

const BASE = "/novidades";

export const metadata: Metadata = {
  title: "Novidades · Salve o Suspiro",
  description:
    "Acompanhe as novidades e a evolução do tratamento do Suspiro.",
};

export default function PaginaNovidades() {
  const itens = listarAtualizacoes("pt");
  const t = TEXTOS.pt;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-10 px-5 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-4">
        <Link href="/" className="botao-voltar inline-flex items-center gap-1.5">
          <ArrowLeft weight="bold" size={16} aria-hidden />
          Voltar para a rifa
        </Link>
        <div className="text-center">
          <p className="font-[family-name:var(--font-caveat)] text-xl text-rose-deep">
            {t.subtitulo}
          </p>
          <h1 className="font-[family-name:var(--font-baloo)] text-4xl font-bold text-mauve sm:text-5xl">
            {t.tituloPagina}
          </h1>
        </div>
      </header>

      {itens.length === 0 ? (
        <p className="cartao px-6 py-8 text-center text-mauve">{t.vazio}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {itens.map((a) => (
            <CartaoAtualizacao
              key={a.slug}
              item={a}
              base={BASE}
              locale="pt"
              lerMais={t.lerMais}
            />
          ))}
        </div>
      )}
    </main>
  );
}
