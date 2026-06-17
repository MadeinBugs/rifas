// Sons sutis via Web Audio API (sem arquivos de áudio). Tudo discreto, pra
// combinar com o tom carinhoso do site. Só tocam dentro de uma interação do
// usuário (cliques), respeitando a política de autoplay dos navegadores.

let contexto: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!contexto) contexto = new AC();
  return contexto;
}

interface Nota {
  freq: number;
  inicio: number; // segundos a partir de agora
  duracao: number;
  volume?: number;
  tipo?: OscillatorType;
}

function tocarNotas(notas: Nota[]): void {
  const ctx = obterContexto();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const agora = ctx.currentTime;
  for (const n of notas) {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = n.tipo ?? "sine";
    osc.frequency.value = n.freq;

    const t0 = agora + n.inicio;
    const vol = n.volume ?? 0.06; // bem baixinho
    ganho.gain.setValueAtTime(0.0001, t0);
    ganho.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + n.duracao);

    osc.connect(ganho).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + n.duracao + 0.02);
  }
}

/** "Pop" curtinho e fofo — para SELECIONAR um número / toques leves. */
export function tocarPop(): void {
  tocarNotas([{ freq: 660, inicio: 0, duracao: 0.09, volume: 0.05 }]);
}

/** Descidinha suave — para REMOVER um número já escolhido. */
export function tocarRemover(): void {
  tocarNotas([
    { freq: 520, inicio: 0, duracao: 0.08, volume: 0.045 },
    { freq: 390, inicio: 0.05, duracao: 0.1, volume: 0.04 },
  ]);
}

/** "Tum" grave e abafado — ao tocar num número indisponível/bloqueado. */
export function tocarBloqueado(): void {
  tocarNotas([
    { freq: 196, inicio: 0, duracao: 0.12, volume: 0.05, tipo: "triangle" },
    { freq: 165, inicio: 0.07, duracao: 0.14, volume: 0.045, tipo: "triangle" },
  ]);
}

/** Varredura descendente — ao limpar a seleção ("Limpar"). */
export function tocarLimpar(): void {
  tocarNotas([
    { freq: 700, inicio: 0, duracao: 0.07, volume: 0.045 },
    { freq: 560, inicio: 0.05, duracao: 0.07, volume: 0.04 },
    { freq: 440, inicio: 0.1, duracao: 0.09, volume: 0.04 },
  ]);
}

/** Subida confiante (dó→sol) — ao seguir para o checkout ("Continuar"). */
export function tocarContinuar(): void {
  tocarNotas([
    { freq: 523.25, inicio: 0, duracao: 0.12, volume: 0.05 }, // dó
    { freq: 783.99, inicio: 0.1, duracao: 0.18, volume: 0.05 }, // sol
  ]);
}

/** Descida gentil (ré→lá) — ao voltar para a grade. */
export function tocarVoltar(): void {
  tocarNotas([
    { freq: 587.33, inicio: 0, duracao: 0.12, volume: 0.045 }, // ré
    { freq: 440, inicio: 0.09, duracao: 0.16, volume: 0.045 }, // lá
  ]);
}

/** Arpejo acolhedor (dó-mi-sol) — convite do "Quero ajudar!". */
export function tocarAjudar(): void {
  tocarNotas([
    { freq: 523.25, inicio: 0, duracao: 0.14, volume: 0.05 }, // dó
    { freq: 659.25, inicio: 0.09, duracao: 0.16, volume: 0.05 }, // mi
    { freq: 783.99, inicio: 0.18, duracao: 0.24, volume: 0.05 }, // sol
  ]);
}

/** Carrilhão suave de duas notas — para confirmação do pagamento. */
export function tocarChime(): void {
  tocarNotas([
    { freq: 587.33, inicio: 0, duracao: 0.5, volume: 0.06 }, // ré
    { freq: 880, inicio: 0.12, duracao: 0.6, volume: 0.05 }, // lá
  ]);
}
