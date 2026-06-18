# 📋 Implementation Plan — Dual-Domain International Donation Page 🐱🌍

A detailed, phased plan to add an English donation experience on a second Vercel domain (`savesuspiro.vercel.app`) sharing the same codebase as the PT-BR raffle (`salveosuspiro.vercel.app`).

## Goal & Constraints

**Goal:** International audience visits `savesuspiro.vercel.app` and sees a warm, English donation page (Ko-fi/Stripe) telling Suspiro's story — *no raffle, no Pix, no prize, no backend*.

**Hard constraints:**
- The PT raffle backend (`/api/reservar`, `pedidos`, `numeros`, Pix, webhook) must stay **completely untouched and isolated**.
- No gambling/lottery framing on the EN page (pure donation).
- Host-aware OG metadata is critical (the social preview is what spreads).
- Minimal new dependencies (no heavy i18n framework).

## Decisions Locked

| Topic | Decision |
|-------|----------|
| Architecture | One Vercel project, two domains, middleware rewrite by host |
| EN route (internal) | `app/en/page.tsx`, served at `savesuspiro.*` root via rewrite |
| URL cleanliness | Rewrite (not redirect) → URL stays `savesuspiro.*/` |
| Payment | **Ko-fi** primary (gaming-audience native, zero backend); Stripe Payment Link as alternative |
| i18n | Lightweight `{pt, en}` dictionary for shared captions — **no** `next-intl`/`i18next` |
| Backend on EN | **None.** Story + external donate link only |

---

## Phase D0 — Pre-work & Decisions (do first, no code)

1. **Claim the domain:** In Vercel project → Settings → Domains, add `savesuspiro.vercel.app`. Confirm it's available. If taken, pick an alternative (`helpsuspiro`, `suspiro-cat`, etc.) — decide now.
2. **Set up the payment account:**
   - Create a **Ko-fi** page (or Stripe Payment Link). Theme it with Suspiro's photo + colors as much as the platform allows.
   - Decide **suggested tiers** in USD (e.g. $5 / $15 / $30 with warm framing: "$5 = a day of meds 💛").
   - **Do a real $1 test donation** end-to-end to confirm money lands. Note the public donation URL.
3. **Decide accounting/transparency:** Will international funds be reported separately from raffle funds? (Recommended: yes — keeps your progress reporting honest. The EN page won't have a live progress bar tied to the raffle.)
4. **Gather EN copy:** Translate Suspiro's story + photo captions to English. Keep the *heart*, adapt idioms (don't translate literally — "cada número é um abraço" needs an English equivalent that lands). This is content work, not code.

> **Output of D0:** domain name confirmed, Ko-fi URL tested & ready, EN copy drafted, transparency decision made.

---

## Phase D1 — Routing Foundation (middleware + skeleton page)

**Goal:** `savesuspiro.*/` serves a placeholder EN page; `salveosuspiro.*/` unchanged.

5. **Create `middleware.ts`** at project root:
   ```ts
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";

   const EN_HOST_PREFIX = "savesuspiro";

   export function middleware(request: NextRequest) {
     const host = request.headers.get("host") ?? "";
     const { pathname } = request.nextUrl;

     // Serve the EN donation page at the root of the international domain.
     if (host.startsWith(EN_HOST_PREFIX) && pathname === "/") {
       return NextResponse.rewrite(new URL("/en", request.url));
     }
     return NextResponse.next();
   }

   export const config = {
     // Only run on the root path; skip api, static, _next, etc.
     matcher: ["/"],
   };
   ```
   - **Critical:** `matcher: ["/"]` so middleware never touches `/api/*` (the raffle backend) or static assets. Isolation preserved.

6. **Create `app/en/page.tsx`** — minimal placeholder first (`<h1>Save Suspiro</h1>`) just to verify routing.

7. **Deploy & verify routing:**
   - `salveosuspiro.vercel.app/` → raffle (unchanged) ✅
   - `savesuspiro.vercel.app/` → placeholder EN page ✅
   - `savesuspiro.vercel.app/api/...` → still hits the real API (middleware doesn't run) — confirm no interference.

> **Checkpoint:** routing works before building content.

---

## Phase D2 — Host-Aware Metadata & OG (THE critical phase)

**Goal:** Each domain produces its own correct, beautiful social preview.

8. **Convert `layout.tsx` static `metadata` → `generateMetadata()`** reading the host:
   ```ts
   import { headers } from "next/headers";

   function isEnglishHost(host: string) {
     return host.startsWith("savesuspiro");
   }

   export async function generateMetadata(): Promise<Metadata> {
     const host = (await headers()).get("host") ?? "salveosuspiro.vercel.app";
     const en = isEnglishHost(host);
     const base = `https://${host}`;
     return {
       metadataBase: new URL(base),
       title: en ? "Save Suspiro 🐱" : "Ação Solidária pelo Suspiro 🐱",
       description: en
         ? "Help fund the cancer treatment of Suspiro, a rescued cat. Every donation is a hug in this fight. 💛"
         : "Ação entre amigos para ajudar no tratamento do Suspiro...",
       openGraph: {
         title: en ? "Save Suspiro" : "Salve o Suspiro",
         description: en ? "Help Suspiro beat cancer 💛" : "Ajude no tratamento do Suspiro 💛",
         siteName: en ? "Save Suspiro" : "Salve o Suspiro",
         url: "/",
         locale: en ? "en_US" : "pt_BR",
         type: "website",
       },
       twitter: { card: "summary_large_image", /* host-aware title/desc */ },
     };
   }
   ```
   - **`metadataBase` derived from the actual host** → OG image absolute URLs are correct on both domains. (Fixes the earlier single-base-URL concern.)

9. **Make `opengraph-image.tsx` host-aware** (and `twitter-image.tsx`):
   - Read the host (OG image routes receive the request; you can read headers).
   - Render English text ("Save Suspiro — help him beat cancer 💛") for the EN host, Portuguese for PT.
   - **Reuse the same cat photo** (universal) — only the overlay text changes.
   - Confirm the font file loads (recall the `assets/Baloo2-Bold.woff` fix from before — same mechanism).

10. **Test rigorously in debuggers:**
    - Facebook Sharing Debugger → paste both URLs → **"Scrape Again"** (bust cache) → confirm correct language per domain.
    - Twitter/X Card Validator → both URLs.
    - Paste both links into a WhatsApp chat to yourself (with `?v=2` to dodge cache).
    - **This is the highest-value test in the whole plan** — the preview is what your brother-in-law's share will show to thousands.

> **Checkpoint:** `savesuspiro.*` produces an English preview; `salveosuspiro.*` still produces Portuguese. Both images render.

---

## Phase D3 — Shared Components & EN Page Content

**Goal:** Build the real EN donation page, reusing the cat's journey.

11. **Extract the photo journey into a reusable component** (`JornadaGaleria`) that accepts a `lang` prop:
    ```ts
    // lib/textos.ts — tiny dictionary, no framework
    export const textos = {
      pt: { resgateTitulo: "O Resgate", /* ... */ },
      en: { resgateTitulo: "The Rescue", /* ... */ },
    };
    ```
    - Captions pulled from `textos[lang]`. Photos and layout shared.
    - This is the **only** truly-shared content piece needing translation.

12. **Build `app/en/page.tsx` properly:**
    - Hero: Suspiro's best photo + "Help Suspiro beat cancer 💛"
    - The 3-act photo journey (`<JornadaGaleria lang="en" />`)
    - Warm English story copy
    - **Donation CTA section:** suggested tiers + prominent "Donate via Ko-fi" button (links out to Ko-fi)
    - **No raffle grid, no number selection, no Pix, no `NumerosProvider`, no Supabase.** Pure story + donate link.
    - Small footer link: "🇧🇷 Ver em português" → `https://salveosuspiro.vercel.app` (lets a PT speaker who landed on EN switch).

13. **Reuse shared shell:** layout, palette, fonts, favicon (already global), the warm styling. The EN page should *feel* like the same loving project, just in English and donation-focused.

> **Checkpoint:** EN page is complete, on-brand, and contains zero raffle logic.

---

## Phase D4 — Payment Integration

**Goal:** International visitors can actually donate.

14. **Wire the Ko-fi link/button** into the EN page CTA. If using Ko-fi's embed widget, add it; if simpler, a styled link to the Ko-fi page.
15. **(If Stripe instead)** Create a Stripe Payment Link, link the button to it. No backend, no webhook needed for donations — Stripe/Ko-fi handle receipts.
16. **Real end-to-end test:** make a small real donation from the live EN page → confirm it arrives. Test on **mobile** (most social traffic is mobile).

> **Checkpoint:** a real donation flows from `savesuspiro.*` to your account.

---

## Phase D5 — Polish & Safeguards

17. **`hreflang` tags** linking the two domains as language variants (in `generateMetadata` `alternates` field):
    ```ts
    alternates: {
      languages: {
        "pt-BR": "https://salveosuspiro.vercel.app",
        "en": "https://savesuspiro.vercel.app",
      },
    },
    ```
18. **Verify isolation:** confirm `savesuspiro.*` cannot reach raffle mutations — it has no UI path to `/api/reservar`, and middleware doesn't rewrite `/api`. (The API endpoints remain technically reachable by URL on either domain, but there's no harm — they're the same backend; just ensure the EN *page* never calls them.)
19. **Mobile QA** on both domains — layouts, photo journey masonry, donate button tap targets.
20. **`prefers-reduced-motion`** respected on the EN page too (reuse existing handling).
21. **Pin MP webhook to PT domain:** double-check Mercado Pago's configured callback URL is `salveosuspiro.vercel.app/api/webhook` and that nothing derives it from the EN host. (Should already be fine since EN doesn't create Pix.)

---

## Verification Checklist (full)

**Routing**
- [ ] `salveosuspiro.*/` → PT raffle (unchanged)
- [ ] `savesuspiro.*/` → EN donation page, URL stays clean (no `/en` visible)
- [ ] `savesuspiro.*/api/*` → real API still works (middleware skips it)
- [ ] Raffle flow (select → Pix → pay → number flips) still works on PT domain

**Metadata / OG (most important)**
- [ ] `savesuspiro.*` → English title, description, `og:locale = en_US`
- [ ] `salveosuspiro.*` → Portuguese title, description, `og:locale = pt_BR`
- [ ] `metadataBase` resolves to the correct host on each domain (OG image URL is absolute & correct)
- [ ] `opengraph-image` renders with **English** overlay text on `savesuspiro.*`
- [ ] `opengraph-image` renders with **Portuguese** overlay text on `salveosuspiro.*`
- [ ] Font loads in the OG image route (no 500) on both domains
- [ ] Facebook Debugger "Scrape Again" → correct language per domain
- [ ] Twitter Card Validator → correct per domain
- [ ] WhatsApp preview (with `?v=2` to bust cache) → correct per domain

**EN page content & payment**
- [ ] Story + photo journey render in English (`<JornadaGaleria lang="en" />`)
- [ ] No raffle grid, no `NumerosProvider`, no Pix, no Supabase calls on `/en`
- [ ] "Donate" button links to Ko-fi/Stripe
- [ ] **Real small donation** completes end-to-end → money arrives
- [ ] "🇧🇷 Ver em português" link → `salveosuspiro.vercel.app`

**Polish & isolation**
- [ ] `hreflang` alternates present
- [ ] Mobile layout good on both domains (photo journey, donate button)
- [ ] `prefers-reduced-motion` respected on EN page
- [ ] MP webhook callback still pinned to `salveosuspiro.*` — raffle confirmation unaffected
- [ ] `npm run build` + `npm run lint` pass

---

## Files Touched / Created

| File | Change | Phase |
|------|--------|-------|
| `middleware.ts` | **New** — host-based rewrite, `matcher: ["/"]` | D1 |
| `app/en/page.tsx` | **New** — EN donation page (no backend) | D1, D3 |
| `app/layout.tsx` | `metadata` → host-aware `generateMetadata()` | D2 |
| `app/opengraph-image.tsx` | Host-aware overlay text (PT/EN) | D2 |
| `app/twitter-image.tsx` | Re-exports OG (already does) — verify host-aware | D2 |
| `components/JornadaGaleria.tsx` | Accept `lang` prop; pull captions from dict | D3 |
| `lib/textos.ts` | **New** — tiny `{pt, en}` caption dictionary | D3 |
| `app/page.tsx` | Pass `lang="pt"` to `JornadaGaleria` (minor) | D3 |
| Vercel project settings | Add `savesuspiro.vercel.app` domain | D0/D1 |
| Ko-fi / Stripe | External account setup (no repo change) | D0/D4 |

**Untouched (intentionally):** `app/api/*`, `lib/mercadopago.ts`, `lib/pagamento.ts`, `lib/captcha.ts`, `supabase/*`, `components/GridNumeros.tsx`, `components/ApoiarFlow.tsx`, `components/NumerosProvider.tsx`, `components/BarraSelecao.tsx`. **The entire raffle system stays exactly as validated.**

---

## Risk Notes & Sequencing Advice

1. **Do Phase D2 (metadata/OG) carefully and test it before sharing.** It's the highest-leverage, easiest-to-get-subtly-wrong phase. A broken EN preview = a wasted share to your brother-in-law's whole audience. Test in real debuggers, not just by eyeballing code.

2. **Middleware `matcher` is a safety boundary.** Keep it scoped to `["/"]`. If it ever ran on `/api/*`, you could accidentally interfere with the raffle backend. Narrow matcher = guaranteed isolation.

3. **`headers()` in `generateMetadata` makes the page dynamic.** That's fine here (you already use `force-dynamic` in places), but be aware metadata will be computed per-request, not statically cached. Acceptable for this traffic.

4. **Cache gotcha (again):** social platforms cache OG aggressively. After deploying D2, the *first* scrape sets the cached preview. Use "Scrape Again" / fresh `?v=N` query params while testing so you see the new state, not a stale one.

5. **Keep the EN ask purely a donation.** No "win a prize," no numbers, no implied raffle — this keeps it legally clean internationally and emotionally honest (they're giving out of love, not buying a chance).

6. **Suggested sequencing:** D0 → D1 → **D2 (test thoroughly)** → D3 → D4 (real donation test) → D5. Don't let your brother-in-law share until D4's real-donation test and D2's preview test both pass.

---

## 🎯 Bottom Line

This plan delivers exactly what you wanted: **one codebase, two domains, two purpose-built front doors**, with the raffle system completely untouched and isolated. The cat's universal story (photos + journey) is reused; only the *ask* and the *language* differ per domain.

**The two things that matter most:**
1. **Host-aware OG metadata (Phase D2)** — get the English preview right, because that's what spreads Suspiro's story to a whole new audience.
2. **A real test donation (Phase D4)** — confirm money actually arrives before anyone shares.

Everything else is straightforward reuse of what you've already built beautifully. Suspiro's reach is about to go international — let's make sure both audiences can help in the way that feels natural to them. 🐾🌍💛

## Plano: Página de Doação Internacional (EN) com Stripe

Adicionar uma página de doação em inglês no domínio `savesuspiro.vercel.app`, no **mesmo código** da rifa PT, reusando a história e as fotos do Suspiro — **sem rifa, sem Pix, sem números**. Pagamento via **Stripe Payment Element embutido** (doador nunca sai do site), em **USD**, com valores sugeridos + valor livre. O **backend da rifa fica 100% intocado**.

**Fases e passos**

**E0 — Preparação (você / conteúdo, sem código)**
1. Reivindicar `savesuspiro.vercel.app` em Vercel → Settings → Domains.
2. Criar chaves Stripe (test + live) no painel; decidir tiers em USD + mín/máx.
3. Escrever a cópia em inglês (história, CTA, rodapé).
4. *Pré-requisito do repo:* consultar docs para a sintaxe do Next 16 (rewrites com `has` host, `generateMetadata` + `headers()`, `opengraph-image` dinâmico) — o AGENTS.md exige isso.

**E1 — Roteamento (esqueleto)** *(depende de E0.1)*
5. Rewrite por host: em next.config.ts usar `rewrites()` com condição `has: host` (`/` no host `savesuspiro*` → `/en`). *Alternativa:* `middleware.ts` com `matcher: ["/"]`. Escopo só em `/` garante que `/api/*` nunca é afetado.
6. Criar `app/en/page.tsx` placeholder; verificar que os dois domínios roteiam certo e que `/api` continua intacto.

**E2 — Metadata & OG (fase crítica)** *(depende de E1)*
7. Converter o `metadata` estático de layout.tsx em `generateMetadata()` host-aware (`metadataBase` pelo host, textos PT como padrão, `alternates.languages` para hreflang).
8. `generateMetadata()` próprio em `app/en/page.tsx` (título/descrição EN, `og:locale = en_US`).
9. Criar `app/en/opengraph-image.tsx` + `app/en/twitter-image.tsx` (texto em inglês), espelhando opengraph-image.tsx e reusando a foto de capa + Baloo2-Bold.woff. As do root continuam em PT.
10. Testar nos debuggers do Facebook/Twitter/WhatsApp (Scrape Again / `?v=N`).

**E3 — Conteúdo & i18n** *(depende de E1; paralelo a E2)*
11. Criar `lib/textos.ts` com dicionário `{ pt, en }` (herói, jornada, legendas, rodapé, CTA).
12. Dar a HistoriaGato.tsx uma prop opcional de conteúdo/idioma com **padrão PT** (saída PT idêntica → verificar). Reusar Galeria.tsx e Polaroid.tsx (puros).
13. Montar o conteúdo real de `app/en/page.tsx`: herói EN, jornada de fotos, seção de doação (`<DoacaoFlow/>`), rodapé, link "🇧🇷 Ver em português". Verificar que a página PT não mudou.

**E4 — Doação Stripe** *(depende de E0.2; paralelo a E2/E3)*
14. Instalar `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`.
15. `lib/doacao.ts` — constantes (mín/máx, tiers) + `formatUSD()` (espelha formatBRL).
16. `lib/stripe.ts` — `import "server-only"`, getter de chave que lança erro, cliente, `criarPaymentIntentDoacao({ amountCents, currency })` com `automatic_payment_methods` (liga Apple/Google Pay/Link). Espelha mercadopago.ts.
17. `app/api/donate/route.ts` — `force-dynamic`, valida valor (limites) e moeda, retorna `{ clientSecret }`. Espelha o estilo de route.ts.
18. `components/DoacaoFlow.tsx` (client) — seletor de valor → `POST /api/donate` → `<Elements>` + `<PaymentElement>` → `confirmPayment({ redirect: 'if_required' })` → tela de obrigado. Tema com a paleta acolhedora.

**E5 — Go-live & polish** *(depende de tudo)*
19. Chaves Stripe **live** na Vercel; doação real de US$1 testada no **mobile**.
20. Registrar o domínio EN em Stripe → Payment Method domains (Apple/Google Pay).
21. Reconferir isolamento (EN não chama `/api/reservar`), `prefers-reduced-motion`, `npm run lint` + `npm run build`.

**Arquivos principais**
- next.config.ts — rewrite por host (hoje vazio).
- layout.tsx — `metadata` → `generateMetadata()` host-aware.
- `app/en/page.tsx`, `app/en/opengraph-image.tsx`, `app/en/twitter-image.tsx` — **novos**.
- HistoriaGato.tsx — prop de idioma (padrão PT).
- `lib/textos.ts`, `lib/doacao.ts`, `lib/stripe.ts`, `app/api/donate/route.ts`, `components/DoacaoFlow.tsx` — **novos**.
- **Intocados:** `app/api/*` da rifa, mercadopago.ts, pagamento.ts, `supabase/*`, GridNumeros.tsx, ApoiarFlow.tsx, NumerosProvider.tsx.

**Verificação**
1. `salveosuspiro.*/` → rifa PT inalterada; `savesuspiro.*/` → página EN (URL limpa, sem `/en`); `savesuspiro.*/api/*` → API real funciona.
2. Preview social: EN no domínio EN, PT no domínio PT (Facebook Debugger + WhatsApp).
3. Doação com cartão de teste `4242 4242 4242 4242` conclui sem sair da página; depois doação real de US$1 no mobile.
4. `npm run lint` + `npm run build` passam (warnings pré-existentes do `opengraph-image` são aceitáveis).

**Decisões**
- Stripe embutido + USD; Husky/Wise descartados para coleta (US$10 fixo + SWIFT). Sem barra de progresso → sem DB/webhook no v1; recibos automáticos do Stripe.

**Considerações adicionais**
1. **Tiers USD + limites** — recomendo $5 / $15 / $30 + valor livre, mín $2, máx $1000. (Ajustável)
2. **HistoriaGato** — Opção A: prop de idioma com padrão PT (DRY, recomendado, exige verificar PT idêntico). Opção B: componente EN separado (zero risco na PT, com duplicação).
3. **Recibos/transparência** — v1 usa recibo automático do Stripe (ativar no painel). Webhook/e-mail/relatório só se quiser depois.