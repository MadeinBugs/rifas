import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Rewrite por host: no domínio internacional (savesuspiro.*) a raiz "/"
   * serve a página de doação em inglês (app/en/page.tsx), mantendo a URL limpa
   * (sem "/en" visível). O domínio PT-BR (salveosuspiro.*) continua servindo a
   * rifa normalmente.
   *
   * Escopo proposital: SÓ a rota "/" é reescrita. As rotas de API da rifa
   * (/api/*), assets e demais páginas nunca são tocadas — o backend da rifa
   * fica 100% isolado. Usamos `beforeFiles` para que o rewrite tenha
   * prioridade sobre o arquivo de página da raiz.
   *
   * O match de host cobre `savesuspiro.vercel.app` e um eventual domínio
   * próprio (com ou sem `www.`). Em dev local (localhost) o rewrite não
   * dispara; teste a página EN acessando "/en" diretamente.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/en",
          has: [
            {
              type: "host",
              value: "(.*\\.)?savesuspiro\\..*",
            },
          ],
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
