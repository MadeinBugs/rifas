import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import {
  formatarData,
  type Locale,
  type ResumoAtualizacao,
} from "@/lib/updates";

/**
 * Cartão de uma atualização, reaproveitado no teaser das home pages e nas
 * páginas com a lista completa (PT e EN).
 */
export default function CartaoAtualizacao({
  item,
  base,
  locale,
  lerMais,
}: {
  item: ResumoAtualizacao;
  /** Caminho base das novidades no idioma (ex.: "/novidades" ou "/updates"). */
  base: string;
  locale: Locale;
  /** Texto do link "ler mais" no idioma. */
  lerMais: string;
}) {
  return (
    <Link
      href={`${base}/${item.slug}`}
      className="cartao group flex items-stretch gap-4 overflow-hidden p-0 transition-transform hover:-translate-y-0.5"
    >
      {item.capa ? (
        <div className="relative w-24 shrink-0 overflow-hidden sm:w-32">
          <Image
            src={item.capa}
            alt=""
            fill
            sizes="8rem"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 px-5 py-4">
        <p className="font-[family-name:var(--font-quicksand)] text-xs font-semibold tracking-wide text-rose-deep uppercase">
          {formatarData(item.data, locale)}
        </p>
        <h3 className="font-[family-name:var(--font-quicksand)] text-lg font-bold text-mauve">
          {item.titulo}
        </h3>
        {item.resumo ? (
          <p className="text-sm leading-relaxed text-ink/80">{item.resumo}</p>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-sage-deep">
          {lerMais}
          <ArrowRight
            weight="bold"
            size={16}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
