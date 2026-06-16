// Efeitos visuais delicados de comemoração. Tudo client-side e gentil — o tom
// do site é de uma luta séria, então a festa é discreta: um respiro de alegria,
// não um carnaval. Tudo respeita `prefers-reduced-motion`.

function prefereMenosMovimento(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Importa o canvas-confetti só quando precisamos (mantém o bundle inicial leve).
async function carregarConfetti() {
  const mod = await import("canvas-confetti");
  return mod.default;
}

/**
 * Uma única chuvinha de corações, suave, vinda de baixo. Usada quando o Pix é
 * confirmado — um "obrigado" carinhoso.
 */
export async function dispararCoracoes(): Promise<void> {
  if (prefereMenosMovimento()) return;
  try {
    const confetti = await carregarConfetti();
    const coracao = confetti.shapeFromText({ text: "❤️", scalar: 2 });
    const base = {
      shapes: [coracao],
      scalar: 2,
      spread: 70,
      startVelocity: 38,
      gravity: 0.9,
      ticks: 200,
      colors: ["#e5989b", "#ffb4a2", "#b5838d"],
    };
    confetti({ ...base, particleCount: 26, origin: { x: 0.5, y: 1.05 } });
    setTimeout(() => {
      confetti({ ...base, particleCount: 16, origin: { x: 0.3, y: 1.05 } });
      confetti({ ...base, particleCount: 16, origin: { x: 0.7, y: 1.05 } });
    }, 220);
  } catch {
    // Sem confete não é problema; é só um agrado.
  }
}

/**
 * Confete comemorativo discreto (ex.: resultado do sorteio), nas cores do tema.
 */
export async function dispararConfete(): Promise<void> {
  if (prefereMenosMovimento()) return;
  try {
    const confetti = await carregarConfetti();
    confetti({
      particleCount: 70,
      spread: 80,
      startVelocity: 40,
      gravity: 0.9,
      ticks: 220,
      origin: { y: 0.4 },
      colors: ["#9caf88", "#e5989b", "#ffcdb2", "#ffb4a2", "#b5838d"],
    });
  } catch {
    // ignora
  }
}
