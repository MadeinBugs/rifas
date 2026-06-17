"use client";

import { tocarAjudar } from "@/lib/som";

/**
 * Botão "Quero ajudar!" que leva à grade de números.
 *
 * Faz a rolagem manualmente (em vez de depender só do hash #numeros): assim
 * funciona TODA vez, inclusive ao clicar de novo já estando com #numeros na
 * URL — caso em que o navegador, sozinho, não rolaria pela segunda vez.
 */
export default function BotaoAjudar() {
  function aoClicar(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    tocarAjudar();
    const alvo = document.getElementById("numeros");
    if (alvo) {
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      // Atualiza o hash sem provocar um segundo salto nem poluir o histórico.
      history.replaceState(null, "", "#numeros");
    }
  }

  return (
    <div className="flex justify-center">
      <a href="#numeros" onClick={aoClicar} className="botao-primario text-base">
        Quero ajudar!
      </a>
    </div>
  );
}
