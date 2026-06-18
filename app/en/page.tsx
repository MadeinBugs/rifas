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
    <footer className="mt-auto flex flex-col items-center gap-3 pt-6 text-center text-xs text-mauve/70">
      <a
        href="https://www.instagram.com/lar.amorinha?igsh=MWNhYm9objhsNjVvZw=="
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Lar Amorinha on Instagram"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-deep transition-opacity hover:opacity-80"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden
          className="h-5 w-5"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>
      <p>{EN.rodape}</p>
    </footer>
  );
}
