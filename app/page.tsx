import Image from "next/image";
import { createAnonClient } from "@/lib/supabase";
import GridNumeros from "@/components/GridNumeros";
import HistoriaGato from "@/components/HistoriaGato";
import { NumerosProvider } from "@/components/NumerosProvider";
import BarraProgresso from "@/components/BarraProgresso";
import { FOTO_CAPA } from "@/lib/fotos";
import {
  PRECO_POR_NUMERO,
  PREMIO,
  TOTAL_NUMEROS,
  formatBRL,
  type NumeroRow,
} from "@/lib/rifa";

export const dynamic = "force-dynamic";

type Resultado =
  | { ok: true; rows: NumeroRow[] }
  | { ok: false; message: string };

async function getNumeros(): Promise<Resultado> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      ok: false,
      message: "Variáveis do Supabase ainda não preenchidas no .env.local.",
    };
  }
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("numeros")
      .select("numero, status")
      .order("numero");
    if (error) {
      console.error("[getNumeros] erro:", error);
      return { ok: false, message: error.message || "(sem mensagem)" };
    }
    return { ok: true, rows: (data ?? []) as NumeroRow[] };
  } catch (e) {
    console.error("[getNumeros] exceção:", e);
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro desconhecido.",
    };
  }
}

export default async function Home() {
  const resultado = await getNumeros();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col gap-12 px-5 py-10 sm:px-6 sm:py-14">
      <Capa />

      {resultado.ok ? (
        <NumerosProvider initial={resultado.rows}>
          {/* Barra de progresso ao vivo, em destaque */}
          <div className="cartao anim-surgir px-6 py-6">
            <BarraProgresso />
          </div>

          <Chips />

          <HistoriaGato />

          <section id="numeros" className="scroll-mt-6">
            <GridNumeros />
          </section>
        </NumerosProvider>
      ) : (
        <>
          <Chips />

          <HistoriaGato />

          <section id="numeros" className="cartao border-rose/40 bg-blush/10 p-6">
            <p className="flex items-center gap-2 font-[family-name:var(--font-quicksand)] font-semibold text-rose-deep">
              <span aria-hidden>🙀</span> Ops, não conseguimos carregar os números
              agora
            </p>
            <p className="mt-2 text-sm break-words text-mauve">
              Tente atualizar a página em instantes. ({resultado.message})
            </p>
          </section>
        </>
      )}

      <Rodape />
    </main>
  );
}

/** Cabeçalho com a foto de capa e o nome do Suspiro. */
function Capa() {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <TituloOnda />

      <figure className="polaroid mt-1 w-full max-w-lg -rotate-1">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[0.35rem]">
          <Image
            src={FOTO_CAPA.src}
            alt={FOTO_CAPA.alt}
            fill
            priority
            sizes="(max-width: 640px) 90vw, 32rem"
            className="object-cover"
          />
        </div>
      </figure>

      <div className="flex max-w-md flex-col gap-3 text-base leading-relaxed text-ink/85">
        <p>
          O Suspiro está enfrentando um problema sério de saúde: um linfoma. Ele
          está fazendo quimioterapia, tomando vários remédios, e está lentamente
          vencendo o tratamento, mas está difícil.
        </p>
        <p>
          Escolha um número, nos ajude com carinho e concorra a um prêmio. Cada
          número ajuda mais do que você imagina 💖
        </p>
      </div>
    </section>
  );
}

/** Título "Salve o Suspiro" com cada letra subindo em cascata (onda sutil). */
function TituloOnda() {
  const titulo = "Salve o Suspiro";
  return (
    <h1
      aria-label={titulo}
      className="font-[family-name:var(--font-baloo)] text-5xl font-bold leading-none text-mauve sm:text-6xl"
    >
      <span aria-hidden="true">
        {titulo.split("").map((ch, i) => (
          <span
            key={i}
            className="onda-letra"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </h1>
  );
}

/** Três "stickers" com as informações essenciais. */
function Chips() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Chip
        emoji="🎟️"
        titulo={`${TOTAL_NUMEROS} números`}
        texto={`${formatBRL(PRECO_POR_NUMERO)} cada`}
      />
      <Chip emoji="🎁" titulo="Prêmio" texto={PREMIO} />
      <Chip emoji="💳" titulo="Pagamento" texto="Pix via Mercado Pago" />
    </section>
  );
}

function Chip({
  emoji,
  titulo,
  texto,
}: {
  emoji: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="etiqueta flex flex-col items-center gap-0.5 px-4 py-4 text-center">
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <p className="font-[family-name:var(--font-quicksand)] text-sm font-semibold text-rose-deep">
        {titulo}
      </p>
      <p className="text-sm text-mauve">{texto}</p>
    </div>
  );
}

function Rodape() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-1 pt-6 text-center text-xs text-mauve/70">
      <span className="text-base" aria-hidden>
        🐾 💛 🐾
      </span>
      <p>
        Ação entre amigos · Pagamento seguro via Pix · Seus dados são usados
        apenas para falar com você sobre esta ação.
      </p>
    </footer>
  );
}
