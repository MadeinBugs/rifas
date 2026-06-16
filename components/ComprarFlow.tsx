"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCodePix from "@/components/QRCodePix";
import { PRECO_POR_NUMERO, formatBRL } from "@/lib/rifa";
import { dispararCoracoes } from "@/lib/efeitos";
import { tocarChime, tocarPop } from "@/lib/som";

type Props = { numero: number };

type Pix = {
  orderId: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiraEmMinutos: number;
};

type Etapa = "form" | "enviando" | "pix" | "pago" | "indisponivel";

export default function ComprarFlow({ numero }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<Pix | null>(null);
  const [restante, setRestante] = useState<number>(0); // segundos

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    tocarPop();
    setEtapa("enviando");
    try {
      const resp = await fetch("/api/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, nome, whatsapp, email }),
      });
      const dados = await resp.json();
      if (!resp.ok) {
        if (resp.status === 409) {
          setEtapa("indisponivel");
          return;
        }
        setErro(dados.erro ?? "Erro ao reservar. Tente novamente.");
        setEtapa("form");
        return;
      }
      setPix(dados as Pix);
      setRestante((dados.expiraEmMinutos ?? 15) * 60);
      setEtapa("pix");
    } catch {
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

  // Polling do status enquanto o Pix está ativo.
  const checarStatus = useCallback(async () => {
    try {
      const r = await fetch(`/api/status?numero=${numero}`, {
        cache: "no-store",
      });
      const d = await r.json();
      if (d.status === "pago") setEtapa("pago");
    } catch {
      // ignora; tenta de novo no próximo tick
    }
  }, [numero]);

  // Mantém a referência da função atualizada sem reiniciar o intervalo.
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

  if (etapa === "pago") {
    return (
      <Estado
        emoji="💛"
        titulo="Pagamento confirmado!"
        texto={`O número ${numero} é seu. De coração: obrigado por estar do lado do Suspiro nessa luta. 🐾`}
      >
        <BarraComemoracao />
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
        titulo="Esse número voou!"
        texto="Alguém escolheu este número agorinha. Mas tem vários outros esperando por você."
      >
        <Link href="/" className="botao-primario mt-1">
          Escolher outro número
        </Link>
      </Estado>
    );
  }

  if (etapa === "pix" && pix) {
    const expirou = restante <= 0;
    const mm = String(Math.floor(restante / 60)).padStart(2, "0");
    const ss = String(restante % 60).padStart(2, "0");
    return (
      <div className="cartao flex flex-col items-center gap-5 px-6 py-8">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
            Pague {formatBRL(PRECO_POR_NUMERO)} no Pix
          </h1>
          <p className="mt-1 text-sm text-mauve/80">
            Número {numero} · escaneie o QR Code no app do seu banco
          </p>
        </div>

        {expirou ? (
          <div className="rounded-xl border border-blush/50 bg-peach/20 p-4 text-center text-sm text-rose-deep">
            O tempo da reserva acabou. Se você já pagou, aguarde uns segundos.
            Senão, o número foi liberado de novo. 🙏
          </div>
        ) : (
          <p className="text-sm text-mauve/80">
            Tempo restante:{" "}
            <strong className="font-[family-name:var(--font-nunito)] tabular-nums text-ink">
              {mm}:{ss}
            </strong>
          </p>
        )}

        <QRCodePix qrCodeBase64={pix.qrCodeBase64} qrCode={pix.qrCode} />

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
        <h1 className="mt-1 font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
          Reservar o número {numero}
        </h1>
        <p className="mt-1 text-mauve/85">
          Valor: <strong>{formatBRL(PRECO_POR_NUMERO)}</strong> · pagamento via
          Pix
        </p>
      </div>

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
          onChange={setWhatsapp}
          placeholder="(11) 90000-0000"
          required
          inputMode="tel"
          autoComplete="tel"
        />
        <Campo
          label="E-mail (opcional)"
          value={email}
          onChange={setEmail}
          placeholder="voce@email.com"
          inputMode="email"
          autoComplete="email"
        />

        {erro && (
          <p className="rounded-lg border border-rose/40 bg-blush/15 px-3 py-2 text-sm text-rose-deep">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={etapa === "enviando"}
          className="botao-primario mt-1 h-12 text-base"
        >
          {etapa === "enviando" ? "Gerando Pix…" : "Gerar Pix 💚"}
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

function Campo({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-[family-name:var(--font-quicksand)] font-semibold text-mauve">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-rose-deep/15 bg-white px-3 text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30"
        {...rest}
      />
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
}: {
  emoji: string;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="cartao anim-surgir flex flex-col items-center gap-4 px-6 py-9 text-center">
      <span className="text-5xl" role="img" aria-hidden>
        {emoji}
      </span>
      <h1 className="font-[family-name:var(--font-baloo)] text-2xl font-bold text-mauve">
        {titulo}
      </h1>
      <p className="max-w-sm text-ink/85">{texto}</p>
      {children}
    </div>
  );
}
