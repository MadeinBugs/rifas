"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { track } from "@/lib/analytics";

type Props = {
  /** Imagem PNG base64 vinda do Mercado Pago (sem o prefixo data:). */
  qrCodeBase64: string | null;
  /** Código copia-e-cola do Pix. */
  qrCode: string | null;
};

/**
 * Mostra o QR Code do Pix. Prefere a imagem do Mercado Pago; se ela não vier,
 * gera o QR a partir do código copia-e-cola no próprio navegador.
 */
export default function QRCodePix({ qrCodeBase64, qrCode }: Props) {
  const [gerado, setGerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!qrCodeBase64 && qrCode) {
      QRCode.toDataURL(qrCode, { width: 240, margin: 1 })
        .then(setGerado)
        .catch(() => setGerado(null));
    }
  }, [qrCodeBase64, qrCode]);

  const src = qrCodeBase64
    ? `data:image/png;base64,${qrCodeBase64}`
    : gerado;

  async function copiar() {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiado(true);
      track("pix_copiado");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard pode estar indisponível; o usuário ainda pode selecionar manualmente.
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="QR Code do Pix"
          width={240}
          height={240}
          className="rounded-2xl border border-rose-deep/15 bg-white p-3 shadow-[0_4px_14px_-6px_rgba(181,131,141,0.3)]"
        />
      ) : (
        <div className="flex h-[240px] w-[240px] items-center justify-center rounded-2xl border border-dashed border-rose-deep/25 text-sm text-mauve/70">
          Gerando QR Code…
        </div>
      )}

      {qrCode && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-center text-xs text-mauve/80">
            Ou copie o código Pix:
          </p>
          <div className="flex items-stretch gap-2">
            <input
              readOnly
              value={qrCode}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-xl border border-rose-deep/15 bg-cream px-3 py-2 text-xs text-ink"
            />
            <button
              type="button"
              onClick={copiar}
              className="botao-primario shrink-0 px-4 py-2 text-xs"
            >
              {copiado ? "Copiado! ✓" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
