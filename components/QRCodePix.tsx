"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

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
          className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700"
        />
      ) : (
        <div className="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-700">
          Gerando QR Code…
        </div>
      )}

      {qrCode && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-center text-xs text-zinc-500">
            Ou copie o código Pix:
          </p>
          <div className="flex items-stretch gap-2">
            <input
              readOnly
              value={qrCode}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={copiar}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
