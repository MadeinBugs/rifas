// Helper para enviar eventos personalizados ao Umami (analytics sem cookies).
// O script do Umami expõe `window.umami`; aqui chamamos com segurança para não
// quebrar nada caso o script ainda não tenha carregado ou tenha sido bloqueado
// por um adblock.

type DadosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (evento: string, dados?: DadosEvento) => void;
    };
  }
}

/**
 * Dispara um evento personalizado no Umami, se o script já estiver presente.
 * Seguro no servidor (SSR) e quando o tracker foi bloqueado — nunca lança.
 */
export function track(evento: string, dados?: DadosEvento): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(evento, dados);
  } catch {
    // Telemetria nunca deve interferir na experiência do usuário.
  }
}
