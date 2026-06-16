"use client";

import { useSyncExternalStore } from "react";
import {
  inscreverSom,
  lerMudoCliente,
  lerMudoServidor,
  definirMudo,
  liberarAudio,
  tocarPop,
} from "@/lib/som";

/**
 * Botãozinho flutuante para ligar/desligar os sons sutis do site.
 * Começa mudo (respeitando quem prefere silêncio) e lembra a escolha.
 * Usa useSyncExternalStore para ler o localStorage sem divergência de hidratação.
 */
export default function BotaoSom() {
  const mudo = useSyncExternalStore(
    inscreverSom,
    lerMudoCliente,
    lerMudoServidor,
  );

  function alternar() {
    liberarAudio();
    const novo = !mudo;
    definirMudo(novo);
    if (!novo) tocarPop(); // feedbackzinho ao ligar
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={!mudo}
      aria-label={mudo ? "Ligar sons" : "Desligar sons"}
      title={mudo ? "Ligar sons" : "Desligar sons"}
      className="etiqueta fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center text-lg transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      <span aria-hidden>{mudo ? "🔇" : "🔊"}</span>
    </button>
  );
}
