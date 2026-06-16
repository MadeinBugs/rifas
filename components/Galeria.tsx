import type { Foto } from "@/lib/fotos";
import Polaroid from "./Polaroid";

interface GaleriaProps {
  fotos: Foto[];
  className?: string;
}

// Inclinações e deslocamentos "decorados à mão" — alternados para dar o ar de
// fotos espalhadas, não enfileiradas. Repetem em ciclo se houver muitas fotos.
const GIROS = [-3.5, 2.5, -1.5, 4, -2.5, 1.5];
const DESLOCAMENTOS = ["sm:mt-0", "sm:mt-8", "sm:-mt-4", "sm:mt-10", "sm:mt-2"];

/**
 * Mostra um conjunto pequeno de fotos de um ato, espalhadas com leves
 * inclinações e alturas variadas. Funciona bem com 1 a ~5 fotos.
 * No mobile vira uma coluna aconchegante; no desktop, fotos "soltas".
 */
export default function Galeria({ fotos, className = "" }: GaleriaProps) {
  if (fotos.length === 0) return null;

  // Foto única: destaca no centro.
  if (fotos.length === 1) {
    const foto = fotos[0];
    return (
      <div className={`flex justify-center ${className}`}>
        <div className={foto.orientacao === "paisagem" ? "max-w-xl w-full" : "max-w-xs w-full"}>
          <Polaroid foto={foto} giro={GIROS[0]} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-start justify-center gap-6 sm:gap-8 ${className}`}
    >
      {fotos.map((foto, i) => {
        const ehPaisagem = foto.orientacao === "paisagem";
        return (
          <div
            key={foto.src}
            className={`${DESLOCAMENTOS[i % DESLOCAMENTOS.length]} ${
              ehPaisagem
                ? "basis-full sm:basis-[22rem] max-w-md"
                : "basis-[10rem] sm:basis-[14rem] max-w-[14rem]"
            } w-full`}
          >
            <Polaroid foto={foto} giro={GIROS[i % GIROS.length]} />
          </div>
        );
      })}
    </div>
  );
}
