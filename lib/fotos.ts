// Manifesto das fotos do Suspiro, organizado como uma jornada em 3 atos.
// As dimensões reais ajudam o next/image a reservar o espaço certo (sem "pulo"
// de layout). Os textos abaixo são um ponto de partida — edite à vontade para
// contar a história do jeitinho de vocês. 💛

export type Orientacao = "retrato" | "paisagem";

export interface Foto {
  src: string;
  largura: number;
  altura: number;
  orientacao: Orientacao;
  /** Legenda manuscrita exibida na polaroid. */
  legenda: string;
  /** Texto alternativo (acessibilidade). */
  alt: string;
}

export interface Ato {
  id: "resgate" | "saudavel" | "tratamento";
  rotulo: string; // "Ato 1", "Ato 2"...
  titulo: string;
  texto: string;
  fotos: Foto[];
}

export const JORNADA: Ato[] = [
  {
    id: "resgate",
    rotulo: "Ato 1",
    titulo: "O Resgate",
    texto:
      "O Suspiro foi encontrado sozinho na rua, fraquinho e assustado. " +
      "Mesmo sem forças, ele ainda confiou na gente — e foi aí que essa " +
      "história de amor começou.",
    fotos: [
      {
        src: "/photos/resgate/retrato-1.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "O dia em que ele chegou",
        alt: "Suspiro fraquinho ao lado da caixa de transporte, no dia do resgate.",
      },
    ],
  },
  {
    id: "saudavel",
    rotulo: "Ato 2",
    titulo: "Dias Felizes",
    texto:
      "Com cuidado, comida e muito carinho, o Suspiro floresceu. Virou aquele " +
      "gato manhoso que ama um colo, um cobertor quentinho e um soninho no fim " +
      "da tarde. Foram os melhores dias.",
    fotos: [
      {
        src: "/photos/saudavel/paisagem-1.jpeg",
        largura: 1280,
        altura: 576,
        orientacao: "paisagem",
        legenda: "Soninho no colo 🐾",
        alt: "Suspiro dormindo tranquilo, aninhado em uma mão.",
      },
      {
        src: "/photos/saudavel/retrato-1.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Rei do cobertor",
        alt: "Suspiro saudável e relaxado sobre um cobertor macio.",
      },
      {
        src: "/photos/saudavel/retrato-2.jpeg",
        largura: 720,
        altura: 1600,
        orientacao: "retrato",
        legenda: "Meu lugar favorito é o colo",
        alt: "Suspiro confortável no colo de alguém.",
      },
      {
        src: "/photos/saudavel/retrato-3.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Todo charmoso 💛",
        alt: "Suspiro saudável com peitoral floral, no sofá.",
      },
    ],
  },
  {
    id: "tratamento",
    rotulo: "Ato 3",
    titulo: "A Luta de Agora",
    texto:
      "Há pouco tempo veio o diagnóstico: linfoma. O Suspiro é forte e está " +
      "enfrentando o tratamento com a mesma coragem de sempre — mas a conta é " +
      "pesada pra gente sozinho. É por isso que pedimos a sua ajuda.",
    fotos: [
      {
        src: "/photos/tratamento/retrato-1.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Forte como sempre",
        alt: "Suspiro magrinho, com curativos no peito após procedimento.",
      },
      {
        src: "/photos/tratamento/retrato-2.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Cada dia, um pouquinho mais",
        alt: "Suspiro no colo, mais fragilzinho, durante o tratamento.",
      },
    ],
  },
];

/** Foto de destaque da capa (hero). */
export const FOTO_CAPA: Foto = {
  src: "/photos/saudavel/paisagem-1.jpeg",
  largura: 1280,
  altura: 576,
  orientacao: "paisagem",
  legenda: "Suspiro",
  alt: "Suspiro dormindo tranquilo, aninhado em uma mão.",
};
