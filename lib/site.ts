/**
 * URLs canônicas (produção) dos dois domínios do projeto.
 *
 * - O domínio PT-BR serve a rifa (Pix) na raiz.
 * - O domínio internacional serve a página de doação em inglês na raiz
 *   (via rewrite por host em `next.config.ts`, que mapeia "/" -> "/en").
 *
 * Usadas para `hreflang` (alternates) e para o `metadataBase` da página EN,
 * de modo que o preview social (og:image, og:url) aponte para o host certo
 * em cada domínio. Podem ser sobrescritas por env na Vercel se os domínios
 * mudarem (ex.: domínio próprio no futuro).
 */

export const PT_SITE_URL = (
  process.env.NEXT_PUBLIC_PT_SITE_URL || "https://salveosuspiro.vercel.app"
).replace(/\/+$/, "");

export const EN_SITE_URL = (
  process.env.NEXT_PUBLIC_EN_SITE_URL || "https://savesuspiro.vercel.app"
).replace(/\/+$/, "");

/**
 * Prefixo do host internacional usado no rewrite por host.
 * Mantido aqui só para documentação; o valor real do match vive em
 * `next.config.ts` (precisa ser constante, analisável em build).
 */
export const EN_HOST_PREFIX = "savesuspiro";
