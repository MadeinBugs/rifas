import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/**
 * Componentes customizados do markdown. Selecionamos apenas as props válidas de
 * cada elemento (sem repassar `node`, que o react-markdown injeta e não é um
 * atributo de DOM).
 */
const COMPONENTES: Components = {
  img({ src, alt, title }) {
    // Imagens do markdown têm dimensões desconhecidas; usamos <img> nativo
    // (com lazy-loading) de propósito, em vez de next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ""} title={title} loading="lazy" />;
  },
};

/**
 * Renderiza o corpo (markdown) de uma atualização com o visual "aconchego" do
 * site (classe `.prose-suspiro`, definida em globals.css).
 *
 * Confiança / segurança: o conteúdo vem de arquivos versionados no
 * repositório, escritos pelos próprios donos do projeto (first-party). Por isso
 * habilitamos `rehype-raw`, que permite HTML embutido no markdown — necessário
 * para inserir <video> local e o <iframe> do YouTube no meio do texto.
 * NÃO reutilize este componente para conteúdo de terceiros/usuários sem antes
 * adicionar `rehype-sanitize` com uma allowlist, pois HTML arbitrário seria
 * um vetor de XSS.
 */
export default function MarkdownUpdate({ corpo }: { corpo: string }) {
  return (
    <div className="prose-suspiro">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={COMPONENTES}
      >
        {corpo}
      </ReactMarkdown>
    </div>
  );
}

