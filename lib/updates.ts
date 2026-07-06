import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Sistema de "novidades" (blog) baseado em arquivos versionados no repositório.
 *
 * Cada atualização é uma pasta em `content/updates/` nomeada como
 * `YYYY-MM-DD-slug`, contendo um ou dois arquivos markdown:
 *
 *   content/updates/2026-07-05-primeira-quimio/
 *     pt.md   ← versão em português (opcional)
 *     en.md   ← versão em inglês (opcional)
 *
 * Uma atualização só aparece em um idioma se o arquivo daquele idioma existir.
 * A data e o slug vêm do nome da pasta; o título e o resumo vêm do frontmatter
 * de cada arquivo. As mídias (imagens/vídeos) ficam em `public/updates/<slug>/`.
 */

export type Locale = "pt" | "en";

/** Metadados de uma atualização (sem o corpo), usados nas listagens. */
export interface ResumoAtualizacao {
  /** Identificador na URL (parte do nome da pasta após a data). */
  slug: string;
  /** Data no formato ISO `YYYY-MM-DD` (vinda do nome da pasta). */
  data: string;
  /** Título exibido (frontmatter `titulo`). */
  titulo: string;
  /** Resumo curto para os cartões (frontmatter `resumo`, opcional). */
  resumo?: string;
  /** Caminho da imagem de capa (frontmatter `capa`, opcional). */
  capa?: string;
}

/** Uma atualização completa, incluindo o corpo em markdown. */
export interface AtualizacaoCompleta extends ResumoAtualizacao {
  /** Corpo em markdown (com HTML embutido permitido para vídeos/embeds). */
  corpo: string;
}

const DIRETORIO = path.join(process.cwd(), "content", "updates");
const PADRAO_PASTA = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

/** Textos de interface por idioma, para as páginas e seções de novidades. */
export const TEXTOS: Record<
  Locale,
  {
    secao: string;
    subtitulo: string;
    verTodas: string;
    lerMais: string;
    voltar: string;
    tituloPagina: string;
    vazio: string;
  }
> = {
  pt: {
    secao: "Atualizações",
    subtitulo: "Acompanhe a recuperação",
    verTodas: "Ver todas as atualizações",
    lerMais: "Ler mais",
    voltar: "Voltar para as atualizações",
    tituloPagina: "Atualizações",
    vazio: "Ainda não há atualizações por aqui. Volte em breve!",
  },
  en: {
    secao: "Updates",
    subtitulo: "Follow his recovery",
    verTodas: "See all updates",
    lerMais: "Read more",
    voltar: "Back to updates",
    tituloPagina: "Updates",
    vazio: "No updates here yet. Check back soon!",
  },
};

/** Lê e valida o nome de uma pasta de atualização; retorna null se inválido. */
function analisarPasta(nome: string): { data: string; slug: string } | null {
  const m = PADRAO_PASTA.exec(nome);
  if (!m) return null;
  return { data: m[1], slug: m[2] };
}

/** Extrai frontmatter + corpo de um arquivo markdown, se ele existir. */
function lerArquivo(
  caminhoPasta: string,
  locale: Locale,
): { data: Record<string, unknown>; corpo: string } | null {
  const arquivo = path.join(caminhoPasta, `${locale}.md`);
  if (!fs.existsSync(arquivo)) return null;
  const bruto = fs.readFileSync(arquivo, "utf8");
  const { data, content } = matter(bruto);
  return { data: data as Record<string, unknown>, corpo: content };
}

/** Converte um valor de frontmatter em string, se for texto não vazio. */
function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

/**
 * Lista todas as atualizações disponíveis em um idioma, da mais recente para a
 * mais antiga. Atualizações sem o arquivo daquele idioma são omitidas.
 */
export function listarAtualizacoes(locale: Locale): ResumoAtualizacao[] {
  if (!fs.existsSync(DIRETORIO)) return [];

  const itens: ResumoAtualizacao[] = [];

  for (const entrada of fs.readdirSync(DIRETORIO, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;

    const info = analisarPasta(entrada.name);
    if (!info) continue;

    const arquivo = lerArquivo(path.join(DIRETORIO, entrada.name), locale);
    if (!arquivo) continue;

    itens.push({
      slug: info.slug,
      data: info.data,
      titulo: texto(arquivo.data.titulo) ?? info.slug,
      resumo: texto(arquivo.data.resumo),
      capa: texto(arquivo.data.capa),
    });
  }

  // Mais recentes primeiro (empate por slug, para ordem estável).
  itens.sort((a, b) =>
    a.data === b.data
      ? a.slug.localeCompare(b.slug)
      : b.data.localeCompare(a.data),
  );

  return itens;
}

/**
 * Carrega uma atualização específica (com corpo) em um idioma. Retorna null se
 * a pasta não existir ou não houver arquivo para o idioma pedido.
 */
export function obterAtualizacao(
  slug: string,
  locale: Locale,
): AtualizacaoCompleta | null {
  if (!fs.existsSync(DIRETORIO)) return null;

  for (const entrada of fs.readdirSync(DIRETORIO, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;

    const info = analisarPasta(entrada.name);
    if (!info || info.slug !== slug) continue;

    const arquivo = lerArquivo(path.join(DIRETORIO, entrada.name), locale);
    if (!arquivo) return null;

    return {
      slug: info.slug,
      data: info.data,
      titulo: texto(arquivo.data.titulo) ?? info.slug,
      resumo: texto(arquivo.data.resumo),
      capa: texto(arquivo.data.capa),
      corpo: arquivo.corpo,
    };
  }

  return null;
}

/** Formata uma data ISO (`YYYY-MM-DD`) por extenso no idioma pedido. */
export function formatarData(data: string, locale: Locale): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  // Usa meio-dia UTC para evitar variação de fuso na exibição da data.
  const d = new Date(Date.UTC(ano, mes - 1, dia, 12));
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
