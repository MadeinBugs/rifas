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

/** "Pop" curtinho e fofo — para toques/cliques leves. */
export function tocarPop(): void {
  tocarNotas([{ freq: 660, inicio: 0, duracao: 0.09, volume: 0.05 }]);
}

/** Carrilhão suave de duas notas — para confirmação do pagamento. */
export function tocarChime(): void {
  tocarNotas([
    { freq: 587.33, inicio: 0, duracao: 0.5, volume: 0.06 }, // ré
    { freq: 880, inicio: 0.12, duracao: 0.6, volume: 0.05 }, // lá
  ]);
}
