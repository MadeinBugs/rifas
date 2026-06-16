import Link from "next/link";
import { JORNADA } from "@/lib/fotos";
import Galeria from "./Galeria";

const NOME_GATO = "Suspiro";

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
          A Jornada do {NOME_GATO} 🐾
        </h2>
      </div>

      {JORNADA.map((ato, i) => (
        <article key={ato.id} className="flex flex-col gap-6">
          {/* Cabeçalho do ato */}
          <div
            className={`flex flex-col gap-1 ${
              i % 2 === 0
                ? "sm:items-start sm:text-left"
                : "sm:items-end sm:text-right"
            } items-center text-center`}
          >
            <span className="font-[family-name:var(--font-caveat)] text-xl text-blush">
              {ato.rotulo}
            </span>
            <h3 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-rose-deep sm:text-3xl">
              {ato.titulo}
            </h3>
          </div>

          {/* Fotos espalhadas */}
          <Galeria fotos={ato.fotos} />

          {/* Texto do ato */}
          <p
            className={`mx-auto max-w-2xl text-center text-lg leading-relaxed text-ink/85 ${
              i % 2 === 0
                ? "sm:mx-0 sm:text-left"
                : "sm:ml-auto sm:mr-0 sm:text-right"
            }`}
          >
            {ato.texto}
          </p>
        </article>
      ))}

      {/* Convite final */}
      <div className="cartao flex flex-col items-center gap-4 px-6 py-9 text-center">
        <p className="max-w-xl text-lg leading-relaxed text-ink/85">
          Cada número escolhido é um pedacinho de esperança no tratamento do{" "}
          {NOME_GATO}. Bora fazer parte dessa corrente do bem? 💛
        </p>
        <Link href="#numeros" className="botao-primario text-base">
          Quero ajudar o {NOME_GATO} 🐾
        </Link>
      </div>
    </section>
  );
}
