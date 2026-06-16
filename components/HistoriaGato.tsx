import Link from "next/link";
import { JORNADA } from "@/lib/fotos";
import Galeria from "./Galeria";

const NOME_GATO = "Suspiro";

// Conteúdo claramente provisório — será substituído pelos valores e
// comprovantes reais do tratamento do Suspiro.
const CUSTOS_EXEMPLO = [
  { item: "Consulta + exames iniciais", valor: "R$ 000,00" },
  { item: "Diagnóstico (FelV + linfoma)", valor: "R$ 000,00" },
  { item: "Sessões de quimioterapia", valor: "R$ 000,00" },
  { item: "Medicamentos e cuidados", valor: "R$ 000,00" },
];

/**
 * "A Jornada do Suspiro" — a história contada em 3 atos (resgate, dias felizes,
 * tratamento), cada um com seu cluster de fotos espalhadas. Termina com um
 * convite acolhedor para participar. A barra de progresso vive na capa.
 */
export default function HistoriaGato() {
  return (
    <section className="flex flex-col gap-14">
      <div className="text-center">
        <p className="font-[family-name:var(--font-caveat)] text-2xl text-rose-deep">
          do começo até aqui
        </p>
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          A Jornada do {NOME_GATO}
        </h2>
      </div>

      {JORNADA.map((ato, i) => {
        const alinhamento =
          i % 2 === 0
            ? "sm:items-start sm:text-left"
            : "sm:items-end sm:text-right";
        const alinhamentoTexto =
          i % 2 === 0
            ? "sm:mx-0 sm:text-left"
            : "sm:ml-auto sm:mr-0 sm:text-right";

        // No Ato 3 (tratamento), o texto vem antes das fotos.
        const textoPrimeiro = ato.id === "tratamento";

        const cabecalho = (
          <div
            className={`flex flex-col gap-1 items-center text-center ${alinhamento}`}
          >
            <span className="font-[family-name:var(--font-caveat)] text-xl text-blush">
              {ato.rotulo}
            </span>
            <h3 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-rose-deep sm:text-3xl">
              {ato.titulo}
            </h3>
          </div>
        );

        const galeria = <Galeria fotos={ato.fotos} />;

        const texto = (
          <div
            className={`mx-auto flex max-w-2xl flex-col gap-3 text-center ${alinhamentoTexto}`}
          >
            {ato.paragrafos.map((p, j) => (
              <p key={j} className="text-lg leading-relaxed text-ink/85">
                {p}
              </p>
            ))}
          </div>
        );

        return (
          <article key={ato.id} className="flex flex-col gap-6">
            {cabecalho}
            {textoPrimeiro ? (
              <>
                {texto}
                {galeria}
              </>
            ) : (
              <>
                {galeria}
                {texto}
              </>
            )}
          </article>
        );
      })}

      {/* Detalhamento dos custos (placeholder) */}
      <details className="cartao overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 font-[family-name:var(--font-quicksand)] text-base font-semibold text-mauve transition-colors hover:text-rose-deep [&::-webkit-details-marker]:hidden">
          <span>Veja todos os custos que tivemos até o momento:</span>
          <span
            className="seta-dropdown shrink-0 text-rose-deep"
            aria-hidden
          >
            ▾
          </span>
        </summary>

        <div className="flex flex-col gap-5 border-t border-rose-deep/10 px-6 py-6">
          <p className="rounded-xl bg-peach/20 px-3 py-2 text-sm text-rose-deep">
            ⚠️ Conteúdo de exemplo — em breve vamos preencher com os valores
            reais e os comprovantes do tratamento do {NOME_GATO}.
          </p>

          <ul className="flex flex-col gap-2 text-ink/85">
            {CUSTOS_EXEMPLO.map((c) => (
              <li
                key={c.item}
                className="flex items-center justify-between gap-4 border-b border-dashed border-rose-deep/15 pb-2 text-sm"
              >
                <span>{c.item}</span>
                <span className="font-semibold tabular-nums text-mauve">
                  {c.valor}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 pt-1">
              <span className="font-[family-name:var(--font-quicksand)] font-semibold text-mauve">
                Total até agora
              </span>
              <span className="font-[family-name:var(--font-baloo)] text-lg font-bold text-rose-deep">
                R$ 0.000,00
              </span>
            </li>
          </ul>

          <div>
            <p className="mb-2 text-sm font-semibold text-mauve">Comprovantes</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-rose-deep/25 bg-surface text-center text-xs text-mauve/60"
                >
                  <span aria-hidden className="text-base">
                    🧾
                  </span>
                  comprovante {n}
                  <span>(em breve)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Convite final */}
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <p className="max-w-xl text-lg leading-relaxed text-ink/85">
          Cada número escolhido é um pedacinho de esperança no tratamento do{" "}
          {NOME_GATO}. Faça parte da história do {NOME_GATO}.
        </p>
        <Link href="#numeros" className="botao-primario text-base">
          Quero ajudar o {NOME_GATO} 🐾
        </Link>
      </div>
    </section>
  );
}
