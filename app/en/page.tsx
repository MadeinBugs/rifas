import Image from "next/image";
import type { Metadata } from "next";
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

      <HistoriaGato conteudo={CONTEUDO_HISTORIA_EN} />

      <DoacaoFlow />

      <Familia />

      <SobreFelv />

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
        <figcaption className="pt-3 text-center font-[family-name:var(--font-caveat)] text-xl leading-tight text-rose-deep">
          {EN.familia.legenda}
        </figcaption>
      </figure>
    </section>
  );
}

/** Educational section about FeLV, in memory of Bambu. */
function SobreFelv() {
  return (
    <section className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          {EN.felv.titulo}
        </h2>
      </div>

      <div className="cartao flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
        <figure className="polaroid w-full max-w-[13rem] shrink-0 -rotate-1">
          <Image
            src="/photos/familia/bamboo_portrait.jpeg"
            alt={EN.felv.fotoAlt}
            width={707}
            height={1067}
            sizes="(max-width: 640px) 60vw, 13rem"
            className="h-auto w-full rounded-[0.35rem]"
          />
          <figcaption className="pt-3 text-center font-[family-name:var(--font-caveat)] text-xl leading-tight text-rose-deep">
            {EN.felv.legenda}
          </figcaption>
        </figure>

        <div className="flex flex-col gap-3 text-base leading-relaxed text-ink/85">
          {EN.felv.paragrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-2 pt-6 text-center text-xs text-mauve/70">
      <span className="text-base" aria-hidden>
        🐾 💛 🐾
      </span>
      <p>{EN.rodape}</p>
    </footer>
  );
}
