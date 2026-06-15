import { META_ARRECADACAO, formatBRL } from "@/lib/rifa";

type Props = {
  /** Total já arrecadado (R$), calculado a partir dos números pagos. */
  arrecadado: number;
};

// 🐱 PREENCHA AQUI os dados reais do gatinho.
// Para as fotos: coloque os arquivos em /public (ex.: public/gato-1.jpg)
// e troque `src: null` por `src: "/gato-1.jpg"` abaixo.
const NOME_GATO = "Suspiro";
const FOTOS: { src: string | null; legenda: string }[] = [
  { src: null, legenda: "Foto 1" },
  { src: null, legenda: "Foto 2" },
  { src: null, legenda: "Foto 3" },
];

export default function HistoriaGato({ arrecadado }: Props) {
  const progresso = Math.min(
    100,
    Math.round((arrecadado / META_ARRECADACAO) * 100),
  );

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          A história do {NOME_GATO} 🐾
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {/* ✏️ Troque este texto pela história real: diagnóstico, tratamento
              necessário, e por que a ajuda faz diferença. */}
          Aqui vai a história do {NOME_GATO}: o diagnóstico, o tratamento de que
          ele precisa e como a sua participação ajuda. Capriche neste texto — é o
          que mais gera confiança e doações.
        </p>
      </div>

      {/* Fotos */}
      <div className="grid grid-cols-3 gap-3">
        {FOTOS.map((foto, i) =>
          foto.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={foto.src}
              alt={`${NOME_GATO} — ${foto.legenda}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ) : (
            <div
              key={i}
              className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-center text-xs text-zinc-400 dark:border-zinc-700"
            >
              adicione uma foto
              <br />
              em /public
            </div>
          ),
        )}
      </div>

      {/* Barra de progresso da meta */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            {formatBRL(arrecadado)}{" "}
            <span className="font-normal text-zinc-500">
              de {formatBRL(META_ARRECADACAO)}
            </span>
          </span>
          <span className="text-zinc-500">{progresso}%</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da arrecadação"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>
    </section>
  );
}
