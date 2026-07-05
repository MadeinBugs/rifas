import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import MarkdownUpdate from "@/components/MarkdownUpdate";
import {
  listarAtualizacoes,
  obterAtualizacao,
  formatarData,
  TEXTOS,
} from "@/lib/updates";

// Só existem as atualizações versionadas no repositório: qualquer slug
// desconhecido resulta em 404 (sem renderização sob demanda).
export const dynamicParams = false;

export function generateStaticParams() {
  return listarAtualizacoes("pt").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = obterAtualizacao(slug, "pt");
  if (!item) return {};
  return {
    title: `${item.titulo} · Novidades`,
    description: item.resumo,
  };
}

export default async function PaginaAtualizacao({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = obterAtualizacao(slug, "pt");
  if (!item) notFound();

  const t = TEXTOS.pt;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-10 sm:px-6 sm:py-14">
      <Link
        href="/novidades"
        className="botao-voltar inline-flex items-center gap-1.5"
      >
        <ArrowLeft weight="bold" size={16} aria-hidden />
        {t.voltar}
      </Link>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-[family-name:var(--font-quicksand)] text-sm font-semibold tracking-wide text-rose-deep uppercase">
            {formatarData(item.data, "pt")}
          </p>
          <h1 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
            {item.titulo}
          </h1>
        </header>

        <MarkdownUpdate corpo={item.corpo} />
      </article>
    </main>
  );
}
