import { siPix } from "simple-icons";

/**
 * Ícone oficial do PIX (Banco Central do Brasil) via Simple Icons.
 * Herda `currentColor`, então funciona em qualquer paleta de cor.
 */
export default function IconePix({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={siPix.path} />
    </svg>
  );
}
