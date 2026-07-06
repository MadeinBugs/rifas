// Conteúdo textual do projeto, organizado por idioma.
//
// - O conteúdo PT-BR da história (CONTEUDO_HISTORIA_PT) reproduz exatamente os
//   textos que antes viviam dentro de <HistoriaGato>, para que a página PT
//   continue idêntica.
// - O conteúdo em inglês (CONTEUDO_HISTORIA_EN + EN) é usado pela página de
//   doação internacional (app/en).
//
// As fotos (arquivos e dimensões) são compartilhadas; só as legendas/alt e os
// textos mudam por idioma.

import { JORNADA, type Ato, type Foto } from "@/lib/fotos";

/** Um comprovante de pagamento real, exibido como link para o PDF. */
export interface ComprovanteItem {
  rotulo: string;
  data: string;
  valor: string;
  href: string;
}

/** Bloco opcional de custos/comprovantes da história (rifa PT). */
export interface CustosConteudo {
  resumo: string;
  aviso: string;
  itens: { item: string; valor: string }[];
  totalLabel: string;
  totalValor: string;
  comprovantesTitulo: string;
  comprovantes: ComprovanteItem[];
}

/** Conteúdo completo do componente de história (A Jornada do Suspiro). */
export interface HistoriaConteudo {
  sobrescrita: string;
  titulo: string;
  jornada: Ato[];
  /** Quando ausente, a seção de custos não é renderizada (ex.: página EN). */
  custos?: CustosConteudo;
  convite: string;
}

// ---------------------------------------------------------------------------
// Português (padrão) — textos idênticos aos que estavam embutidos no componente.
// ---------------------------------------------------------------------------

export const CONTEUDO_HISTORIA_PT: HistoriaConteudo = {
  sobrescrita: "do começo até aqui",
  titulo: "A Jornada do Suspiro",
  jornada: JORNADA,
  custos: {
    resumo: "Veja os custos do tratamento até agora:",
    aviso:
      "Valores somados a partir dos comprovantes de pagamento do tratamento do Suspiro.",
    itens: [
      { item: "Quimioterapia e internação", valor: "R$ 5.830,00" },
      { item: "Medicamentos manipulados (abr–mai)", valor: "R$ 992,00" },
      { item: "Exames de controle", valor: "R$ 864,80" },
    ],
    totalLabel: "Total em comprovantes",
    totalValor: "R$ 7.686,80",
    comprovantesTitulo: "Comprovantes de pagamento",
    comprovantes: [
      {
        rotulo: "Medicamentos manipulados",
        data: "10/04",
        valor: "R$ 291,00",
        href: "/comprovantes/2026-04-10-medicamentos.pdf",
      },
      {
        rotulo: "Medicamentos manipulados",
        data: "22/04",
        valor: "R$ 166,00",
        href: "/comprovantes/2026-04-22-medicamentos.pdf",
      },
      {
        rotulo: "Quimioterapia + internação",
        data: "19/05",
        valor: "R$ 5.830,00",
        href: "/comprovantes/2026-05-19-quimioterapia-internacao.pdf",
      },
      {
        rotulo: "Medicamento manipulado",
        data: "21/05",
        valor: "R$ 144,00",
        href: "/comprovantes/2026-05-21-medicamento.pdf",
      },
      {
        rotulo: "Medicamentos manipulados",
        data: "26/05",
        valor: "R$ 146,00",
        href: "/comprovantes/2026-05-26-medicamentos.pdf",
      },
      {
        rotulo: "Ultrassom + exames",
        data: "12/06",
        valor: "R$ 394,80",
        href: "/comprovantes/2026-06-12-ultrassom-exames.pdf",
      },
    ],
  },
  convite:
    "Cada número escolhido é um pedacinho de esperança!",
};

// ---------------------------------------------------------------------------
// Inglês — jornada do Suspiro para o público internacional (sem rifa).
// Mesmos arquivos/dimensões das fotos; legendas e textos em inglês.
// ---------------------------------------------------------------------------

const fotoEN = (
  base: Pick<Foto, "src" | "largura" | "altura" | "orientacao">,
  legenda: string,
  alt: string,
): Foto => ({ ...base, legenda, alt });

export const JORNADA_EN: Ato[] = [
  {
    id: "resgate",
    rotulo: "Suspiro arrives hurt",
    titulo: "The Rescue",
    paragrafos: [
      "Suspiro was found alone on the street three years ago, extremely weak " +
        "and injured, with part of his chest exposed to wounds and larvae. " +
        "The vet said he wouldn't survive and that we should euthanize him.",
    ],
    fotos: [
      fotoEN(
        {
          src: "/photos/resgate/retrato-1.jpeg",
          largura: 576,
          altura: 1280,
          orientacao: "retrato",
        },
        "The day he arrived",
        "Tiny, weak Suspiro next to the carrier on the day of his rescue.",
      ),
    ],
  },
  {
    id: "saudavel",
    rotulo: "Suspiro strong and healthy",
    titulo: "Happy Days",
    paragrafos: [
      "With care, food (lots of food!) and treatment, Suspiro survived. " +
        "He grew strong and healthy, and became a lovely and playful cat.",
    ],
    fotos: [
      fotoEN(
        {
          src: "/photos/saudavel/paisagem-1.jpeg",
          largura: 1280,
          altura: 576,
          orientacao: "paisagem",
        },
        "A nap while we play video games",
        "Suspiro sleeping peacefully, curled up in a hand.",
      ),
      fotoEN(
        {
          src: "/photos/saudavel/retrato-1.jpeg",
          largura: 576,
          altura: 1280,
          orientacao: "retrato",
        },
        "He's got scar above the nose",
        "Healthy, relaxed Suspiro on a soft blanket.",
      ),
      fotoEN(
        {
          src: "/photos/saudavel/retrato-2.jpeg",
          largura: 720,
          altura: 1600,
          orientacao: "retrato",
        },
        "Alpha pose",
        "Resting comfortably in someone's lap.",
      ),
      fotoEN(
        {
          src: "/photos/saudavel/retrato-3.jpeg",
          largura: 576,
          altura: 1280,
          orientacao: "retrato",
        },
        "Recovered from accident",
        "Healthy Suspiro with a floral wrap, on the couch.",
      ),
    ],
  },
  {
    id: "tratamento",
    rotulo: "Suspiro falls ill",
    titulo: "The Fight So Far",
    paragrafos: [
      "On March 30th we noticed his breathing was heavy. We quickly took him to the " +
        "vet, and he was diagnosed with FeLV and a mediastinal lymphoma, a " +
        "type of cancer. Suspiro is strong and is facing treatment with the " +
        "same courage as always, but the bills are growing rapidly on us. ",
      "That's why we are asking for your help, either directly or to spread the word.",
	  "Today he's completed 3 cycles of chemo, but there's still a long way to go.",
    ],
    fotos: [
      fotoEN(
        {
          src: "/photos/tratamento/retrato-1.jpeg",
          largura: 576,
          altura: 1280,
          orientacao: "retrato",
        },
        "Very skinny :(",
        "Skinny Suspiro with bandages on his chest after a procedure.",
      ),
      fotoEN(
        {
          src: "/photos/tratamento/retrato-2.jpeg",
          largura: 576,
          altura: 1280,
          orientacao: "retrato",
        },
        "Every day a new fight",
        "Suspiro in someone's lap, more fragile, during treatment.",
      ),
    ],
  },
];

export const CONTEUDO_HISTORIA_EN: HistoriaConteudo = {
  sobrescrita: "from the very beginning",
  titulo: "Suspiro's Journey",
  jornada: JORNADA_EN,
  // Sem seção de custos no v1 internacional (valores em R$ são placeholder).
  convite:
    "Every donation is a little piece of hope in Suspiro's treatment 💛",
};

// ---------------------------------------------------------------------------
// Strings de interface da página de doação em inglês.
// ---------------------------------------------------------------------------

export const EN = {
  meta: {
    title: "Save Suspiro 🐱",
    description:
      "Help fund the cancer treatment of Suspiro, our rescued cat. Every donation helps 💛",
    ogTitle: "Save Suspiro",
    ogDescription: "Help Suspiro beat cancer — every donation helps 💛",
    siteName: "Save Suspiro",
  },
  hero: {
    titulo: "Save Suspiro",
    coverAlt: "Suspiro sleeping peacefully, curled up in a hand.",
    paragrafos: [
      "Suspiro is facing a serious illness: lymphoma. He's going through " +
        "chemotherapy and taking many medications, and he's slowly winning — " +
        "but it's a hard fight.",
      "Your donation helps us pay for his expensive treatment. Every bit of love helps " +
        "more than you know 💖",
    ],
  },
  familia: {
    titulo: "The Family",
    alt: "The family's six cats together on the couch and rug: Caju, Bamboo, Mirtilo, Coco, Amora and Suspiro",
    legenda: "Caju, Bamboo, Mirtilo, Coco, Amora and Suspiro",
  },
  felv: {
    titulo: "About FeLV",
    fotoAlt: "Bamboo, a beloved family cat who has passed away, in a portrait photo.",
    legenda: "Bamboo ⭐",
    paragrafos: [
      "Our beloved Bamboo was also a FeLV victim, even though he was vaccinated.",
      "FeLV (the feline leukemia virus) is one of the leading infectious " +
        "causes of death in cats. It spreads through close contact between " +
        "them.",
      "The vaccine greatly lowers the risk, but it isn't a full guarantee. " +
        "That's why it matters so much to learn about it, test new cats before " +
        "introducing them to the others, raising them indoors and keeping vaccinations up to date 💛",
    ],
  },
  rodape:
    "A donation made with love · Secure payment by card · Your information is only used to process your gift.",
  verEmPortugues: "🇧🇷 Ver em português",
  verEmPortuguesAria: "Switch to the Portuguese version of this page",
} as const;
