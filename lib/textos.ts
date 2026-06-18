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

/** Bloco opcional de custos/comprovantes da história (placeholder na rifa PT). */
export interface CustosConteudo {
  resumo: string;
  aviso: string;
  itens: { item: string; valor: string }[];
  totalLabel: string;
  totalValor: string;
  comprovantesTitulo: string;
  comprovanteLabel: string;
  emBreve: string;
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
    resumo: "Veja todos os custos que tivemos até o momento:",
    aviso:
      "⚠️ Conteúdo de exemplo — em breve vamos preencher com os valores reais e os comprovantes do tratamento do Suspiro.",
    itens: [
      { item: "Consulta + exames iniciais", valor: "R$ 000,00" },
      { item: "Diagnóstico (FelV + linfoma)", valor: "R$ 000,00" },
      { item: "Sessões de quimioterapia", valor: "R$ 000,00" },
      { item: "Medicamentos e cuidados", valor: "R$ 000,00" },
    ],
    totalLabel: "Total até agora",
    totalValor: "R$ 0.000,00",
    comprovantesTitulo: "Comprovantes",
    comprovanteLabel: "comprovante",
    emBreve: "(em breve)",
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
  chips: [
    { titulo: "Rescued", texto: "Found hurt 3 years ago" },
    { titulo: "Fighting", texto: "Lymphoma & FeLV" },
    { titulo: "Your gift", texto: "Goes to his care" },
  ],
  familia: {
    titulo: "The Family",
    alt: "The family's six cats together on the couch and rug: Caju, Bambu, Mirtilo, Coco, Amora and Suspiro",
    legenda: "Caju, Bambu, Mirtilo, Coco, Amora and Suspiro",
  },
  rodape:
    "A donation made with love · Secure payment by card · Your information is only used to process your gift.",
  verEmPortugues: "🇧🇷 Ver em português",
  verEmPortuguesAria: "Switch to the Portuguese version of this page",
} as const;
