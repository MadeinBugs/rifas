"use client";

import { useState } from "react";

/** Botão de fallback: copia a mensagem para a área de transferência. */
export default function BotaoCopiar({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          // Navegador sem permissão de clipboard: ignora silenciosamente.
        }
      }}
      className={
        className ??
        "text-sm font-medium text-gray-600 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
      }
    >
      {copiado ? "✓ Copiado" : "Copiar mensagem"}
    </button>
  );
}
