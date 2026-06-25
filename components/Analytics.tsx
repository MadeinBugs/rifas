"use client";

import { useSyncExternalStore } from "react";
import Script from "next/script";

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
  const websiteId = useSyncExternalStore(
    semInscricao,
    () => idDoSite(window.location.hostname) ?? null,
    () => null,
  );

  if (!URL_UMAMI || !websiteId) return null;

  return (
    <Script
      src={`${URL_UMAMI}/script.js`}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
