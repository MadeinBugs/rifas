// Sons sutis via Web Audio API (sem arquivos de áudio). Tudo discreto, pra
// combinar com o tom carinhoso do site. Regras importantes:
//  - DESLIGADO por padrão (precisa ser ligado no botãozinho de som).
//  - Só toca depois da primeira interação do usuário (política dos navegadores).
//  - A preferência fica salva no localStorage.

const CHAVE = "suspiro:som";

let contexto: AudioContext | null = null;
let interagiu = false;

// Mini-store para o estado "mudo", consumido via useSyncExternalStore.
type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

/** Inscreve um ouvinte para mudanças na preferência de som. */
export function inscreverSom(cb: Ouvinte): () => void {
  ouvintes.add(cb);
  return () => {
    ouvintes.delete(cb);
  };
}

function notificar(): void {
  for (const cb of ouvintes) cb();
}

/** Snapshot para o cliente (lê o localStorage). */
export function lerMudoCliente(): boolean {
  return estaMudo();
}

/** Snapshot para o servidor: sempre mudo (sem áudio na renderização). */
export function lerMudoServidor(): boolean {
  return true;
}

/** Marca que o usuário já interagiu (libera o áudio nos navegadores). */
export function liberarAudio(): void {
  interagiu = true;
}

/** O som está mudo? Mudo por padrão. */
export function estaMudo(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(CHAVE) !== "on";
}

/** Liga/desliga o som e salva a preferência. */
export function definirMudo(mudo: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE, mudo ? "off" : "on");
  notificar();
}

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
  if (estaMudo() || !interagiu) return;
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
