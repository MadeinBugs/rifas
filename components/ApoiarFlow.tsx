"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import QRCodePix from "@/components/QRCodePix";
import { PRECO_POR_NUMERO, formatBRL } from "@/lib/rifa";
import { dispararCoracoes } from "@/lib/efeitos";
import { tocarChime, tocarPop } from "@/lib/som";
import IconePix from "@/components/IconePix";

type Props = { numeros: number[] };

type Troca = { de: number; para: number };

type Resultado = {
  pedidoId: string;
  numeros: number[];
  substituidos: Troca[];
  perdidos: number[];
  quantidade: number;
  total: number; // R$
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiraEmMinutos: number;
};

type Etapa = "form" | "enviando" | "pix" | "pago" | "indisponivel";

const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

/** Aplica a máscara (DDD) 9XXXX-XXXX ao digitar. */
function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validarTelefone(valor: string): string | null {
  const d = valor.replace(/\D/g, "");
  if (d.length === 0) return null;
  if (d.length < 11) return "Número incompleto — use o formato (DDD) 9XXXX-XXXX";
  if (d[2] !== "9")
    return "Celulares brasileiros têm 9 como primeiro dígito após o DDD";
  return null;
}

function validarEmail(valor: string): string | null {
  if (!valor.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
    ? null
    : "E-mail inválido — verifique e tente novamente";
}

export default function ApoiarFlow({ numeros }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [tocadoWhatsapp, setTocadoWhatsapp] = useState(false);
  const [tocadoEmail, setTocadoEmail] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [restante, setRestante] = useState<number>(0); // segundos
  // Token preenchido automaticamente pelo widget Turnstile em background.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const captchaRef = useRef<TurnstileInstance>(null);

  const quantidade = numeros.length;
  const totalPrevisto = quantidade * PRECO_POR_NUMERO;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTocadoWhatsapp(true);
    setTocadoEmail(true);
    if (validarTelefone(whatsapp) || validarEmail(email)) return;
    setErro(null);
    tocarPop();

    // Anti-robô: o Turnstile já resolveu em background — só bloqueia se
    // a sitekey está configurada e o token ainda não chegou.
    if (SITEKEY && !captchaToken) {
      setErro("Aguarde a verificação de segurança e tente de novo.");
      return;
    }

    setEtapa("enviando");
    try {
      const resp = await fetch("/api/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeros, nome, whatsapp, email, captchaToken }),
      });
      const dados = await resp.json();
      if (!resp.ok) {
        // Rotaciona o token para que a próxima tentativa gere um novo.
        captchaRef.current?.reset();
        setCaptchaToken(null);
        if (resp.status === 409) {
          setEtapa("indisponivel");
          return;
        }
        setErro(dados.erro ?? "Erro ao reservar. Tente novamente.");
        setEtapa("form");
        return;
      }
      setResultado(dados as Resultado);
      setRestante((dados.expiraEmMinutos ?? 15) * 60);
      setEtapa("pix");
    } catch {
      captchaRef.current?.reset();
      setCaptchaToken(null);
      setErro("Falha de conexão. Tente novamente.");
      setEtapa("form");
    }
  }

  // Countdown da reserva.
  useEffect(() => {
    if (etapa !== "pix") return;
    if (restante <= 0) return;
    const t = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [etapa, restante]);

  // Polling do status do pedido enquanto o Pix está ativo.
  const pedidoId = resultado?.pedidoId;
  const checarStatus = useCallback(async () => {
    if (!pedidoId) return;
    try {
      const r = await fetch(`/api/status?pedido=${pedidoId}`, {
        cache: "no-store",
      });
      const d = await r.json();
      if (d.status === "pago") setEtapa("pago");
    } catch {
      // ignora; tenta de novo no próximo tick
    }
  }, [pedidoId]);

  const pollRef = useRef(checarStatus);
  useEffect(() => {
    pollRef.current = checarStatus;
  }, [checarStatus]);

  useEffect(() => {
    if (etapa !== "pix") return;
    const t = setInterval(() => pollRef.current(), 5000);
    return () => clearInterval(t);
  }, [etapa]);

  // Comemoração ao confirmar o pagamento: corações + carrilhão (uma vez).
  useEffect(() => {
    if (etapa !== "pago") return;
    dispararCoracoes();
    tocarChime();
  }, [etapa]);

  // Turnstile (Managed mode): resolve em background para a grande maioria.
  // Só mostra desafio visual para tráfego identificado como suspeito.
  const widgetCaptcha = SITEKEY ? (
    <Turnstile
      ref={captchaRef}
      siteKey={SITEKEY}
      options={{ appearance: "interaction-only", action: "reservar" }}
      onSuccess={(token) => setCaptchaToken(token)}
      onExpire={() => setCaptchaToken(null)}
      onError={() => setCaptchaToken(null)}
    />
  ) : null;

  if (etapa === "pago" && resultado) {
    return (
      <Estado
        emoji="💖"
        titulo="Pagamento confirmado!"
        texto={
          resultado.quantidade === 1
            ? "Seu número está garantido. Obrigado de coração por nos ajudar nessa luta 💕"
            : `Seus ${resultado.quantidade} números estão garantidos. Obrigado de coração por nos ajudar nessa luta 💕`
        }
        corTitulo="text-rose-deep"
      >
        <Fichas numeros={resultado.numeros} />
        <BarraComemoracao />
        <p className="self-end text-right text-base italic text-rose-deep/55">
          ~ Bela e Andress, pais do Suspiro
        </p>
        <Link href="/" className="botao-primario mt-1">
          Voltar para a grade
        </Link>
      </Estado>
    );
  }

  if (etapa === "indisponivel") {
    return (
      <Estado
        emoji="😿"
        titulo="Os números voaram!"
        texto="Os números escolhidos já foram reservados e não encontramos outros livres agora. Dá uma olhada na grade — logo abrem mais."
      >
        <Link href="/#numeros" className="botao-primario mt-1">
          Voltar para a grade
        </Link>
      </Estado>
    );
  }

  if (etapa === "pix" && resultado) {
    const expirou = restante <= 0;
    const mm = String(Math.floor(restante / 60)).padStart(2, "0");
    const ss = String(restante % 60).padStart(2, "0");
    return (
      <div className="cartao flex flex-col items-center gap-5 px-6 py-8">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-rose-deep">
            Pague {formatBRL(resultado.total)} no Pix
          </h1>
          <p className="mt-1 text-sm font-bold text-mauve/80">
            {resultado.quantidade}{" "}
            {resultado.quantidade === 1 ? "número" : "números"} · escaneie o QR
            Code no app do seu banco
          </p>
        </div>

        <Fichas numeros={resultado.numeros} />

        {resultado.substituidos.length > 0 && (
          <div className="w-full rounded-xl border border-sage/40 bg-sage-soft/60 px-4 py-3 text-sm text-sage-deeper">
            <p className="font-semibold">
              Alguns números voaram, então cuidamos da troca 💛
            </p>
            <p className="mt-1 tabular-nums">
              {resultado.substituidos
                .map((s) => `${s.de} → ${s.para}`)
                .join(" · ")}
            </p>
          </div>
        )}

        {resultado.perdidos.length > 0 && (
          <div className="w-full rounded-xl border border-blush/50 bg-peach/20 px-4 py-3 text-sm text-rose-deep">
            Não achamos substituto para{" "}
            <span className="tabular-nums">
              {resultado.perdidos.join(", ")}
            </span>
            . Por isso seu total ficou {formatBRL(resultado.total)}.
          </div>
        )}

        {expirou ? (
          <div className="rounded-xl border border-blush/50 bg-peach/20 p-4 text-center text-sm text-rose-deep">
            O tempo da reserva acabou. Se você já pagou, aguarde uns segundos.
            Senão, os números foram liberados de novo. 🙏
          </div>
        ) : (
          <p className="text-sm text-mauve/80">
            Tempo restante:{" "}
            <strong className="font-[family-name:var(--font-nunito)] tabular-nums text-ink">
              {mm}:{ss}
            </strong>
          </p>
        )}

        <QRCodePix
          qrCodeBase64={resultado.qrCodeBase64}
          qrCode={resultado.qrCode}
        />

        <div className="flex items-center gap-2 text-sm text-mauve/80">
          <span className="anim-pulsar inline-block h-2 w-2 rounded-full bg-sage" />
          Aguardando a confirmação do pagamento…
        </div>

        <Link href="/" className="botao-voltar">
          ← Voltar para a grade
        </Link>
      </div>
    );
  }

  // etapa 'form' | 'enviando'
  return (
    <div className="cartao flex flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <h1 className="mt-1 font-[family-name:var(--font-baloo)] text-2xl font-bold text-rose-deep">
          {quantidade === 1
            ? "Reservar o seu número"
            : `Reservar os seus ${quantidade} números`}
        </h1>
        <p className="mt-1 text-mauve/85">
          Total:{" "}
          <strong className="text-sage-deep">
            {formatBRL(totalPrevisto)}
          </strong>{" "}
          · pagamento via Pix
        </p>
      </div>

      <Fichas numeros={numeros} />

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo
          label="Nome"
          value={nome}
          onChange={setNome}
          placeholder="Seu nome"
          required
          autoComplete="name"
        />
        <Campo
          label="WhatsApp (com DDD)"
          value={whatsapp}
          onChange={(v) => setWhatsapp(mascaraTelefone(v))}
          onBlur={() => setTocadoWhatsapp(true)}
          placeholder="(11) 90000-0000"
          required
          inputMode="tel"
          autoComplete="tel"
          erroValidacao={tocadoWhatsapp ? validarTelefone(whatsapp) : null}
        />
        <Campo
          label="E-mail (opcional)"
          value={email}
          onChange={setEmail}
          onBlur={() => setTocadoEmail(true)}
          placeholder="voce@email.com"
          inputMode="email"
          autoComplete="email"
          erroValidacao={tocadoEmail ? validarEmail(email) : null}
        />

        {erro && (
          <p className="rounded-lg border border-rose/40 bg-blush/15 px-3 py-2 text-sm text-rose-deep">
            {erro}
          </p>
        )}

        {widgetCaptcha}

        <button
          type="submit"
          disabled={etapa === "enviando"}
          className="botao-primario mt-1 h-12 text-base"
        >
          {etapa === "enviando" ? (
            "Gerando Pix…"
          ) : (
            <>
              Gerar Pix{" "}
              <IconePix size={18} className="inline-block align-middle" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-mauve/70">
        Seus dados são usados apenas para entrar em contato sobre esta ação.
      </p>

      <Link href="/" className="botao-voltar text-center">
        ← Voltar para a grade
      </Link>
    </div>
  );
}

/** Mostra os números escolhidos como "patinhas". */
function Fichas({ numeros }: { numeros: number[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {numeros.map((n) => (
        <span
          key={n}
          className="inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage-soft px-2.5 py-1 text-sm font-semibold tabular-nums text-sage-deeper"
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  erroValidacao,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  erroValidacao?: string | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-[family-name:var(--font-quicksand)] font-semibold text-mauve">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 rounded-xl border bg-white px-3 text-ink outline-none transition focus:ring-2 ${
          erroValidacao
            ? "border-rose/60 focus:border-rose focus:ring-rose/20"
            : "border-rose-deep/15 focus:border-sage focus:ring-sage/30"
        }`}
        aria-invalid={erroValidacao ? true : undefined}
        {...rest}
      />
      {erroValidacao && (
        <span className="text-xs text-rose-deep">{erroValidacao}</span>
      )}
    </label>
  );
}

/** Barrinha que enche até 100% uma única vez — selo de "deu certo!". */
function BarraComemoracao() {
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLargura(100), 80);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-sage-soft"
      aria-hidden
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-sage to-sage-deep transition-[width] duration-700 ease-out"
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}

function Estado({
  emoji,
  titulo,
  texto,
  children,
  corTitulo = "text-mauve",
}: {
  emoji: string;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
  corTitulo?: string;
}) {
  return (
    <div className="cartao anim-surgir flex flex-col items-center gap-4 px-6 py-9 text-center">
      <span className="text-5xl" role="img" aria-hidden>
        {emoji}
      </span>
      <h1
        className={`font-[family-name:var(--font-baloo)] text-2xl font-bold ${corTitulo}`}
      >
        {titulo}
      </h1>
      <p className="max-w-sm text-ink/85">{texto}</p>
      {children}
    </div>
  );
}
