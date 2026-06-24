import Image from "next/image";
import { createAnonClient } from "@/lib/supabase";
import GridNumeros from "@/components/GridNumeros";
import HistoriaGato from "@/components/HistoriaGato";
import { NumerosProvider } from "@/components/NumerosProvider";
import BarraProgresso from "@/components/BarraProgresso";
import BarraSelecao from "@/components/BarraSelecao";
import BotaoAjudar from "@/components/BotaoAjudar";
import { FOTO_CAPA } from "@/lib/fotos";
import {
  PRECO_POR_NUMERO,
  PREMIO,
  TOTAL_NUMEROS,
  formatBRL,
  type NumeroRow,
} from "@/lib/rifa";
import { Gift, Ticket } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import IconePix from "@/components/IconePix";

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
          <Chips />

          <BotaoAjudar />

          <HistoriaGato />

          {/* Barra de progresso ao vivo, logo acima da grade */}
          <div className="cartao anim-surgir px-6 py-6">
            <BarraProgresso />
          </div>

          <section id="numeros" className="scroll-mt-6">
            <GridNumeros />
          </section>

          <BarraSelecao />
        </NumerosProvider>
      ) : (
        <>
          <Chips />

          <BotaoAjudar />

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

      <FamiliaGatos />

      <SobreFelv />

      <Rodape />
    </main>
  );
}

/** A família de seis gatos — foto coletiva e apresentação. */
function FamiliaGatos() {
  return (
    <section className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          A Família
        </h2>
      </div>

      <figure className="polaroid w-full rotate-[0.4deg]">
        <Image
          src="/photos/familia/FamiliaGatos.jpeg"
          alt="Os seis gatos da família reunidos no sofá e no tapete: Caju, Bambu, Mirtilo, Coco, Amora e Suspiro"
          width={1484}
          height={718}
          sizes="(max-width: 640px) 90vw, 48rem"
          className="h-auto w-full rounded-[0.35rem]"
        />
        <figcaption className="pt-3 text-center font-[family-name:var(--font-caveat)] text-xl leading-tight text-rose-deep">
          Caju, Bambu, Mirtilo, Coco, Amora e Suspiro
        </figcaption>
      </figure>
    </section>
  );
}

/** Seção educativa sobre a FeLV, em memória do Bambu. */
function SobreFelv() {
  return (
    <section className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          Sobre a FeLV
        </h2>
      </div>

      <div className="cartao flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
        <figure className="polaroid w-full max-w-[13rem] shrink-0 -rotate-1">
          <Image
            src="/photos/familia/bamboo_portrait.jpeg"
            alt="Bambu, nosso gato que faleceu, em uma foto de retrato."
            width={707}
            height={1067}
            sizes="(max-width: 640px) 60vw, 13rem"
            className="h-auto w-full rounded-[0.35rem]"
          />
          <figcaption className="pt-3 text-center font-[family-name:var(--font-caveat)] text-xl leading-tight text-rose-deep">
            Bambu ⭐
          </figcaption>
        </figure>

        <div className="flex flex-col gap-3 text-base leading-relaxed text-ink/85">
          <p>
            Nosso eterno falecido Bambu também foi vítima da FeLV, mesmo
            vacinado.
          </p>
          <p>
            A FeLV (vírus da leucemia felina) é uma das principais causas
            infecciosas de morte em gatos. Ela se espalha pelo contato próximo.
          </p>
          <p>
            A vacina reduz bastante o risco, mas não é uma garantia total. Por
            isso é tão importante se informar, testar gatos novos antes de
            apresentá-los aos outros, criá-los dentro de casa e manter a vacinação em dia 💛
          </p>
        </div>
      </div>
    </section>
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

      <div className="flex max-w-xl flex-col gap-3 text-base leading-relaxed text-ink/85">
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
      className="font-[family-name:var(--font-baloo)] text-5xl font-bold leading-none text-sage-deep sm:text-6xl"
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
        icone={<Ticket weight="duotone" size={24} aria-hidden />}
        fundo="bg-peach/30"
        cor="text-rose-deep"
        titulo={`${TOTAL_NUMEROS} números`}
        texto={`${formatBRL(PRECO_POR_NUMERO)} cada`}
      />
      <Chip
        icone={<Gift weight="duotone" size={24} aria-hidden />}
        fundo="bg-peach/30"
        cor="text-rose-deep"
        titulo="Prêmio"
        texto={PREMIO}
      />
      <Chip
        icone={<IconePix size={24} />}
        fundo="bg-peach/30"
        cor="text-rose-deep"
        titulo="Pagamento"
        texto="Pix de 10"
      />
    </section>
  );
}

function Chip({
  icone,
  fundo,
  cor,
  titulo,
  texto,
}: {
  icone: ReactNode;
  fundo: string;
  cor: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="etiqueta flex flex-col items-center gap-1.5 px-4 py-4 text-center">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full ${fundo} ${cor}`}
      >
        {icone}
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
    <footer className="mt-auto flex flex-col items-center gap-3 pt-6 text-center text-xs text-mauve/70">
      <a
        href="https://www.instagram.com/oi.belbel?igsh=MWNhYm9objhsNjVvZw=="
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram do Lar Amorinha"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-deep transition-opacity hover:opacity-80"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          aria-hidden
          className="h-5 w-5"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>
      <p>
        Ação entre amigos · Pagamento seguro via Pix · Seus dados são usados
        apenas para entrar em contato sobre esta ação.
      </p>
    </footer>
  );
}
