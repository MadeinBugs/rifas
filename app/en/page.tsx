import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PawPrint, Heart, Gift } from "@phosphor-icons/react/dist/ssr";
import HistoriaGato from "@/components/HistoriaGato";
import DoacaoFlow from "@/components/DoacaoFlow";
import { FOTO_CAPA } from "@/lib/fotos";
import { CONTEUDO_HISTORIA_EN, EN } from "@/lib/textos";
import { PT_SITE_URL, EN_SITE_URL } from "@/lib/site";

/**
 * Página de doação internacional (inglês). Servida na raiz do domínio
 * internacional via rewrite por host (ver next.config.ts). Reaproveita a
 * história e as fotos do Suspiro — sem rifa, sem Pix, sem números.
 *
 * `metadataBase` fixado no domínio EN para que o preview social (og:image,
 * og:url) aponte para o host certo, independentemente de onde o build rode.
 */
export const metadata: Metadata = {
  metadataBase: new URL(EN_SITE_URL),
  title: EN.meta.title,
  description: EN.meta.description,
  openGraph: {
    title: EN.meta.ogTitle,
    description: EN.meta.ogDescription,
    siteName: EN.meta.siteName,
    url: "/",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: EN.meta.ogTitle,
    description: EN.meta.ogDescription,
  },
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": PT_SITE_URL,
      en: EN_SITE_URL,
    },
  },
};

export default function PaginaDoacaoEN() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-12 px-5 py-10 sm:px-6 sm:py-14">
      <Capa />

      <Chips />

      <HistoriaGato conteudo={CONTEUDO_HISTORIA_EN} />

      <DoacaoFlow />

      <Familia />

      <Rodape />
    </main>
  );
}

/** Capa: nome do Suspiro animado, foto de destaque e chamada para doar. */
function Capa() {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <TituloOnda />

      <figure className="polaroid mt-1 w-full max-w-lg -rotate-1">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[0.35rem]">
          <Image
            src={FOTO_CAPA.src}
            alt={EN.hero.coverAlt}
            fill
            priority
            sizes="(max-width: 640px) 90vw, 32rem"
            className="object-cover"
          />
        </div>
      </figure>

      <div className="flex max-w-xl flex-col gap-3 text-base leading-relaxed text-ink/85">
        {EN.hero.paragrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <a href="#donate" className="botao-primario mt-1">
        Donate now 💛
      </a>
    </section>
  );
}

/** Título "Save Suspiro" com cada letra subindo em cascata (onda sutil). */
function TituloOnda() {
  const titulo = EN.hero.titulo;
  return (
    <h1
      aria-label={titulo}
      className="font-[family-name:var(--font-baloo)] text-5xl font-bold leading-none text-sage-deep sm:text-6xl"
    >
      <span aria-hidden="true">
        {titulo.split("").map((ch, i) => (
          <span
            key={i}
            className="onda-letra"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </h1>
  );
}

/** Três "stickers" com um resumo acolhedor da causa. */
function Chips() {
  const icones: ReactNode[] = [
    <PawPrint key="paw" weight="duotone" size={24} aria-hidden />,
    <Heart key="heart" weight="duotone" size={24} aria-hidden />,
    <Gift key="gift" weight="duotone" size={24} aria-hidden />,
  ];
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {EN.chips.map((c, i) => (
        <Chip key={c.titulo} icone={icones[i]} titulo={c.titulo} texto={c.texto} />
      ))}
    </section>
  );
}

function Chip({
  icone,
  titulo,
  texto,
}: {
  icone: ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="etiqueta flex flex-col items-center gap-1.5 px-4 py-4 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-peach/30 text-rose-deep">
        {icone}
      </span>
      <p className="font-[family-name:var(--font-quicksand)] text-sm font-semibold text-rose-deep">
        {titulo}
      </p>
      <p className="text-sm text-mauve">{texto}</p>
    </div>
  );
}

/** A família de seis gatos — foto coletiva. */
function Familia() {
  return (
    <section className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          {EN.familia.titulo}
        </h2>
      </div>

      <figure className="polaroid w-full rotate-[0.4deg]">
        <Image
          src="/photos/familia/FamiliaGatos.jpeg"
          alt={EN.familia.alt}
          width={1484}
          height={718}
          sizes="(max-width: 640px) 90vw, 48rem"
          className="h-auto w-full rounded-[0.35rem]"
        />
        <figcaption className="pt-2 text-center font-[family-name:var(--font-caveat)] text-base text-mauve/80">
          {EN.familia.legenda}
        </figcaption>
      </figure>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-2 pt-6 text-center text-xs text-mauve/70">
      <a
        href={PT_SITE_URL}
        aria-label={EN.verEmPortuguesAria}
        className="font-[family-name:var(--font-quicksand)] text-sm font-semibold text-rose-deep underline-offset-4 hover:underline"
      >
        {EN.verEmPortugues}
      </a>
      <span className="text-base" aria-hidden>
        🐾 💛 🐾
      </span>
      <p>{EN.rodape}</p>
    </footer>
  );
}
