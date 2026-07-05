import type { NextConfig } from "next";

// Match de host do domínio internacional: cobre `savesuspiro.vercel.app` e um
// eventual domínio próprio (com ou sem `www.`).
const HOST_EN = "(.*\\.)?savesuspiro\\..*";

const nextConfig: NextConfig = {
  /**
   * Empacotamento de conteúdo: a home PT (app/page.tsx) é `force-dynamic` e lê
   * os arquivos de `content/updates/**` em tempo de execução para montar o
   * teaser de novidades. O rastreamento automático do Next não segue leituras
   * de arquivo com caminho dinâmico, então incluímos a pasta explicitamente
   * para que ela seja empacotada na função serverless (senão a lista viria
   * vazia em produção).
   */
  outputFileTracingIncludes: {
    "/": ["./content/updates/**/*"],
  },

  /**
   * Rewrite por host: no domínio internacional (savesuspiro.*) a raiz "/"
   * serve a página de doação em inglês (app/en/page.tsx) e "/updates" serve as
   * novidades (app/en/updates), mantendo as URLs limpas (sem "/en" visível). O
   * domínio PT-BR (salveosuspiro.*) continua servindo a rifa normalmente.
   *
   * Escopo proposital: só "/" e "/updates(/*)" são reescritas. As rotas de API
   * da rifa (/api/*), assets e demais páginas nunca são tocadas — o backend da
   * rifa fica 100% isolado. Usamos `beforeFiles` para que os rewrites tenham
   * prioridade sobre os arquivos de página.
   *
   * Em dev local (localhost) o rewrite não dispara; teste a versão EN acessando
   * "/en" e "/en/updates" diretamente.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/en",
          has: [{ type: "host", value: HOST_EN }],
        },
        {
          source: "/updates",
          destination: "/en/updates",
          has: [{ type: "host", value: HOST_EN }],
        },
        {
          source: "/updates/:path*",
          destination: "/en/updates/:path*",
          has: [{ type: "host", value: HOST_EN }],
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
