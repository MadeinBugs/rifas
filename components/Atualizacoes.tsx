import Link from "next/link";
import CartaoAtualizacao from "@/components/CartaoAtualizacao";
import { listarAtualizacoes, TEXTOS, type Locale } from "@/lib/updates";

/** Caminho base das páginas de novidades por idioma. */
const BASE: Record<Locale, string> = {
  pt: "/novidades",
  en: "/updates",
};

/**
 * Seção "Novidades" das home pages: mostra as atualizações mais recentes com
 * um link para a página com todas. Não renderiza nada se ainda não houver
 * nenhuma atualização no idioma pedido.
 */
export default function Atualizacoes({
  locale,
  limite = 3,
}: {
  locale: Locale;
  limite?: number;
}) {
  const todas = listarAtualizacoes(locale);
  if (todas.length === 0) return null;

  const t = TEXTOS[locale];
  const base = BASE[locale];
  const recentes = todas.slice(0, limite);

  return (
    <section id="novidades" className="flex scroll-mt-6 flex-col gap-6">
      <div className="text-center">
        <p className="font-[family-name:var(--font-caveat)] text-xl text-rose-deep">
          {t.subtitulo}
        </p>
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          {t.secao}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {recentes.map((a) => (
          <CartaoAtualizacao
            key={a.slug}
            item={a}
            base={base}
            locale={locale}
            lerMais={t.lerMais}
          />
        ))}
      </div>

      {todas.length > limite ? (
        <div className="text-center">
          <Link href={base} className="botao-voltar">
            {t.verTodas}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
