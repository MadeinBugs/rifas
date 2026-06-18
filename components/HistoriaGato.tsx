import { type HistoriaConteudo, CONTEUDO_HISTORIA_PT } from "@/lib/textos";
import Galeria from "./Galeria";

/**
 * "A Jornada do Suspiro" — a história contada em 3 atos (resgate, dias felizes,
 * tratamento), cada um com seu cluster de fotos espalhadas. Termina com um
 * convite acolhedor para participar. A barra de progresso vive na capa.
 *
 * O conteúdo é parametrizável (`conteudo`) para reaproveitar o componente em
 * outro idioma. Sem prop, usa o conteúdo PT-BR padrão (saída idêntica). A seção
 * de custos só aparece quando o conteúdo a fornece.
 */
export default function HistoriaGato({
  conteudo = CONTEUDO_HISTORIA_PT,
}: {
  conteudo?: HistoriaConteudo;
}) {
  const { custos } = conteudo;
  return (
    <section className="flex flex-col gap-14">
      <div className="text-center">
        <p className="font-[family-name:var(--font-caveat)] text-2xl text-rose-deep">
          {conteudo.sobrescrita}
        </p>
        <h2 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve sm:text-4xl">
          {conteudo.titulo}
        </h2>
      </div>

      {conteudo.jornada.map((ato, i) => {
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

      {/* Detalhamento dos custos e comprovantes */}
      {custos && (
        <details className="cartao overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 font-[family-name:var(--font-quicksand)] text-base font-semibold text-mauve transition-colors hover:text-rose-deep [&::-webkit-details-marker]:hidden">
            <span>{custos.resumo}</span>
            <span
              className="seta-dropdown shrink-0 text-rose-deep"
              aria-hidden
            >
              ▾
            </span>
          </summary>

          <div className="flex flex-col gap-5 border-t border-rose-deep/10 px-6 py-6">
            <p className="rounded-xl bg-peach/20 px-3 py-2 text-sm text-rose-deep">
              {custos.aviso}
            </p>

            <ul className="flex flex-col gap-2 text-ink/85">
              {custos.itens.map((c) => (
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
                  {custos.totalLabel}
                </span>
                <span className="font-[family-name:var(--font-baloo)] text-lg font-bold text-rose-deep">
                  {custos.totalValor}
                </span>
              </li>
            </ul>

            <div>
              <p className="mb-2 text-sm font-semibold text-mauve">
                {custos.comprovantesTitulo}
              </p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {custos.comprovantes.map((c) => (
                  <li key={c.href}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-rose-deep/15 bg-surface px-3 py-2.5 transition-colors hover:border-rose-deep/40 hover:bg-peach/10"
                    >
                      <span aria-hidden className="text-base">
                        🧾
                      </span>
                      <span className="flex flex-1 flex-col leading-tight">
                        <span className="text-sm font-medium text-mauve">
                          {c.rotulo}
                        </span>
                        <span className="text-xs text-mauve/60">{c.data}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-rose-deep">
                        {c.valor}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* Convite final */}
      <div className="flex flex-col items-center gap-1 py-1 text-center">
        <p className="max-w-xl text-lg leading-relaxed text-ink/85">
          {conteudo.convite}
        </p>
      </div>
    </section>
  );
}
