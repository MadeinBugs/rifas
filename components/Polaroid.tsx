import Image from "next/image";
import type { Foto } from "@/lib/fotos";

interface PolaroidProps {
  foto: Foto;
  /** Inclinação em graus (ex.: -3, 4) — dá o ar "espalhado" e espontâneo. */
  giro?: number;
  /** Prioriza o carregamento (use na foto de capa). */
  prioridade?: boolean;
  className?: string;
}

/**
 * Foto no estilo "polaroid": moldura branca + legenda manuscrita.
 * Fica levemente torta em repouso e se endireita no hover/foco — aquele
 * charme de foto colada na geladeira. Animações respeitam reduced-motion
 * via utilitárias do Tailwind (motion-safe / motion-reduce).
 */
export default function Polaroid({
  foto,
  giro = 0,
  prioridade = false,
  className = "",
}: PolaroidProps) {
  const ehPaisagem = foto.orientacao === "paisagem";

  return (
    <figure
      className={`polaroid w-full transition-transform duration-300 ease-out motion-safe:hover:rotate-0 motion-safe:hover:-translate-y-1 motion-safe:focus-within:rotate-0 ${className}`}
      style={{ transform: `rotate(${giro}deg)` }}
    >
      <div
        className={`relative overflow-hidden rounded-[0.35rem] bg-mauve/5 ${
          ehPaisagem ? "aspect-[16/9]" : "aspect-[3/4]"
        }`}
      >
        <Image
          src={foto.src}
          alt={foto.alt}
          fill
          priority={prioridade}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 360px"
          className="object-cover"
        />
      </div>
      <figcaption className="pt-3 text-center font-[family-name:var(--font-caveat)] text-xl leading-tight text-rose-deep">
        {foto.legenda}
      </figcaption>
    </figure>
  );
}
