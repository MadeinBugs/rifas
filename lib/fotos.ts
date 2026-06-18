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
  /** Um ou mais parágrafos de texto do ato. */
  paragrafos: string[];
  fotos: Foto[];
}

export const JORNADA: Ato[] = [
  {
    id: "resgate",
    rotulo: "Suspiro chega machucado",
    titulo: "O Resgate",
    paragrafos: [
      "O Suspiro foi encontrado sozinho na rua a três anos atrás, " +
        "extremamente fragilizado e machucado, com uma parte do seu peito " +
        "exposto a feridas e insetos. O veterinário disse que ele não ia " +
        "resistir e que deveríamos sacrificar.",
    ],
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
    rotulo: "Suspiro forte e saudável",
    titulo: "Dias Felizes",
    paragrafos: [
      "Com cuidado, comida (muita comida!) e tratamento, o Suspiro sobreviveu. " +
        "Ficou forte e saudável, e um gato muito amoroso e brincalhão.",
    ],
    fotos: [
      {
        src: "/photos/saudavel/paisagem-1.jpeg",
        largura: 1280,
        altura: 576,
        orientacao: "paisagem",
        legenda: "Soninho enquanto a gente joga videogame",
        alt: "Suspiro dormindo tranquilo, aninhado em uma mão.",
      },
      {
        src: "/photos/saudavel/retrato-1.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Cicatriz acima do nariz",
        alt: "Suspiro saudável e relaxado sobre um cobertor macio.",
      },
      {
        src: "/photos/saudavel/retrato-2.jpeg",
        largura: 720,
        altura: 1600,
        orientacao: "retrato",
        legenda: "Pose de galã",
        alt: "Suspiro confortável no colo de alguém.",
      },
      {
        src: "/photos/saudavel/retrato-3.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Recuperado do acidente",
        alt: "Suspiro saudável com peitoral floral, no sofá.",
      },
    ],
  },
  {
    id: "tratamento",
    rotulo: "Suspiro doente",
    titulo: "A Luta Até Agora",
    paragrafos: [
      "Em 30 de março de 2026 notamos a respiração dele ofegante. Levamos para o " +
        "veterinário e ele foi diagnosticado com FeLV e um Linfoma de " +
        "mediastino, um tipo de câncer. O Suspiro é forte e está enfrentando o " +
        "tratamento com a mesma coragem de sempre, mas a conta está sendo " +
        "bastante pesada.",
      "É por isso que criamos esse site e essa rifa.",
      "Hoje ele completa 3 ciclos de quimioterapia, mas ainda falta muito."
    ],
    fotos: [
      {
        src: "/photos/tratamento/retrato-1.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Suspiro magrinho :(",
        alt: "Suspiro magrinho, com curativos no peito após procedimento.",
      },
      {
        src: "/photos/tratamento/retrato-2.jpeg",
        largura: 576,
        altura: 1280,
        orientacao: "retrato",
        legenda: "Cada dia uma nova luta",
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
