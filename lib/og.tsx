import "server-only";

import { ImageResponse } from "next/og";
import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { obterAtualizacao, type Locale } from "@/lib/updates";

/**
 * Geração das imagens de social preview (Open Graph / Twitter) das páginas de
 * atualização. Usa a `capa` da atualização como fundo, o `titulo` como título
 * e o `resumo` como subtítulo — em vez do banner padrão do site.
 *
 * As imagens são geradas em tempo de build (as páginas de atualização usam
 * `generateStaticParams` + `dynamicParams = false`), então as leituras de
 * arquivo aqui acontecem no build, não sob demanda.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Banner usado quando a atualização não tem capa (ou o arquivo não existe). */
const BANNER_PADRAO = "photos/saudavel/paisagem-1.jpeg";

/** Nome do site por idioma, usado como "eyebrow" (marca) na imagem. */
const MARCA: Record<Locale, string> = {
  pt: "Salve o Suspiro",
  en: "Save Suspiro",
};

/** Tipos de imagem suportados como fundo, por extensão. */
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/**
 * Resolve o caminho absoluto (e o mime) da capa dentro de `public/`. Faz o
 * fallback para o banner padrão se a capa não existir, tiver um formato não
 * suportado, ou tentar escapar da pasta `public/` (defesa contra path traversal
 * — o conteúdo é de primeira parte, mas mantemos a checagem por segurança).
 */
function resolverCapa(capa?: string): { caminho: string; mime: string } {
  const publico = path.join(process.cwd(), "public");
  const fallback = {
    caminho: path.join(publico, BANNER_PADRAO),
    mime: "image/jpeg",
  };

  const relativo = capa?.replace(/^\/+/, "").trim();
  if (!relativo) return fallback;

  const absoluto = path.resolve(publico, relativo);
  if (!absoluto.startsWith(publico + path.sep)) return fallback;

  const ext = path.extname(absoluto).toLowerCase();
  const mime = MIME[ext];
  if (!mime || !fs.existsSync(absoluto)) return fallback;

  return { caminho: absoluto, mime };
}

/** Corta um texto longo, adicionando reticências, para caber na imagem. */
function cortar(texto: string, max: number): string {
  const limpo = texto.trim();
  if (limpo.length <= max) return limpo;
  return `${limpo.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Gera a imagem de preview de uma atualização específica. Se o slug não existir
 * (não deveria acontecer, pois as páginas são estáticas), cai num preview com a
 * marca do site sobre o banner padrão.
 */
export async function imagemAtualizacao(slug: string, locale: Locale) {
  const item = obterAtualizacao(slug, locale);
  const titulo = cortar(item?.titulo ?? MARCA[locale], 90);
  const resumo = item?.resumo ? cortar(item.resumo, 160) : undefined;
  const capa = resolverCapa(item?.capa);

  const [fontData, fotoData] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/Baloo2-Bold.woff")),
    readFile(capa.caminho),
  ]);

  const fotoBase64 = `data:${capa.mime};base64,${fotoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#4f444b",
        }}
      >
        {/* Foto de capa ao fundo (renderizada pelo Satori, não é uma <img> do DOM) */}
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img
          src={fotoBase64}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Gradiente escuro para legibilidade do texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.82) 100%)",
            display: "flex",
          }}
        />

        {/* Conteúdo de texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "64px 72px",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "Baloo 2",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#ffcdb2",
            }}
          >
            {MARCA[locale].toUpperCase()}
          </span>
          <span
            style={{
              fontFamily: "Baloo 2",
              fontSize: 68,
              fontWeight: 700,
              color: "#fff7f1",
              lineHeight: 1.08,
            }}
          >
            {titulo}
          </span>
          {resumo ? (
            <span
              style={{
                fontFamily: "Baloo 2",
                fontSize: 32,
                fontWeight: 700,
                color: "rgba(255,247,241,0.9)",
                lineHeight: 1.3,
              }}
            >
              {resumo}
            </span>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Baloo 2",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
