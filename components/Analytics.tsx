"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Script from "next/script";
import { track } from "@/lib/analytics";

// Instância Umami self-hosted (removendo a "/" final, se houver). Os Website
// IDs de cada site são criados no painel do Umami e injetados via env vars.
const URL_UMAMI = process.env.NEXT_PUBLIC_UMAMI_URL?.replace(/\/$/, "");
const ID_PT = process.env.NEXT_PUBLIC_UMAMI_ID_PT;
const ID_EN = process.env.NEXT_PUBLIC_UMAMI_ID_EN;

/**
 * Escolhe o Website ID conforme o domínio. Os dois sites são o MESMO app Next
 * servido em hosts diferentes, então o ID é definido em runtime pelo hostname.
 * Domínios desconhecidos (previews da Vercel, localhost) não são rastreados —
 * assim os dados de produção ficam limpos.
 */
function idDoSite(host: string): string | undefined {
  if (host.includes("savesuspiro")) return ID_EN; // doação (EN)
  if (host.includes("salveosuspiro")) return ID_PT; // rifa (PT)
  return undefined;
}

// subscribe no-op: o domínio não muda durante a sessão, então nunca notificamos.
const semInscricao = () => () => {};

/**
 * Carrega o script do Umami só no cliente, com o Website ID do domínio atual.
 * `useSyncExternalStore` evita divergência de hidratação sem `setState` em
 * efeito: no servidor devolve `null`; no cliente, o ID do domínio atual.
 */
export default function Analytics() {
  const plataformaRef = useRef<string | null>(null);

  const websiteId = useSyncExternalStore(
    semInscricao,
    () => idDoSite(window.location.hostname) ?? null,
    () => null,
  );

  // Lê ?audience= e limpa a URL no mount (antes do script Umami carregar),
  // para que o parâmetro não apareça em links compartilhados ou bookmarks.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plataforma = params.get("audience");
    if (!plataforma) return;
    plataformaRef.current = plataforma;
    params.delete("audience");
    const novaQuery = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname +
        (novaQuery ? `?${novaQuery}` : "") +
        window.location.hash,
    );
  }, []);

  if (!URL_UMAMI || !websiteId) return null;

  return (
    <Script
      src={`${URL_UMAMI}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
      onLoad={() => {
        if (plataformaRef.current) {
          track("entrada", { plataforma: plataformaRef.current });
        }
      }}
    />
  );
}
