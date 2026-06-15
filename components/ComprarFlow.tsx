"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCodePix from "@/components/QRCodePix";
import { PRECO_POR_NUMERO, formatBRL } from "@/lib/rifa";

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

  const pollRef = useRef(checarStatus);
  pollRef.current = checarStatus;
  useEffect(() => {
    if (etapa !== "pix") return;
    const t = setInterval(() => pollRef.current(), 5000);
    return () => clearInterval(t);
  }, [etapa]);

  if (etapa === "pago") {
    return (
      <Estado
        emoji="🍀"
        titulo="Pagamento confirmado!"
        texto={`O número ${numero} é seu. Boa sorte — e muito obrigado por ajudar o Suspiro! 🐱`}
      >
        <Link href="/" className="botao-voltar">
          ← Voltar para a grade
        </Link>
      </Estado>
    );
  }

  if (etapa === "indisponivel") {
    return (
      <Estado
        emoji="😿"
        titulo="Número indisponível"
        texto="Este número acabou de ser escolhido por outra pessoa. Que tal escolher outro?"
      >
        <Link href="/" className="botao-voltar">
          ← Escolher outro número
        </Link>
      </Estado>
    );
  }

  if (etapa === "pix" && pix) {
    const expirou = restante <= 0;
    const mm = String(Math.floor(restante / 60)).padStart(2, "0");
    const ss = String(restante % 60).padStart(2, "0");
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Pague {formatBRL(PRECO_POR_NUMERO)} via Pix
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Número {numero} · escaneie o QR Code no app do seu banco
          </p>
        </div>

        {expirou ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            O tempo da reserva expirou. Se você já pagou, aguarde alguns
            segundos. Caso contrário, o número foi liberado.
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Tempo restante:{" "}
            <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">
              {mm}:{ss}
            </strong>
          </p>
        )}

        <QRCodePix qrCodeBase64={pix.qrCodeBase64} qrCode={pix.qrCode} />

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Aguardando confirmação do pagamento…
        </div>

        <Link href="/" className="botao-voltar">
          ← Voltar para a grade
        </Link>
      </div>
    );
  }

  // etapa 'form' | 'enviando'
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Reservar número {numero}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={etapa === "enviando"}
          className="mt-1 flex h-12 items-center justify-center rounded-full bg-emerald-600 px-5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {etapa === "enviando" ? "Gerando Pix…" : "Gerar Pix"}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-400">
        Seus dados são usados apenas para contato sobre esta ação.
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
      <span className="font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        {...rest}
      />
    </label>
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
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-5xl" role="img" aria-hidden>
        {emoji}
      </span>
      <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      <p className="max-w-sm text-zinc-600 dark:text-zinc-400">{texto}</p>
      {children}
    </div>
  );
}
