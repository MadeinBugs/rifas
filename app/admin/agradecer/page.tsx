import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import {
  paraWhatsAppInternacional,
  montarMensagemAgradecimento,
  linkWhatsApp,
} from "@/lib/whatsapp";
import { marcarAgradecidoAction, desmarcarAgradecidoAction } from "../actions";
import BotaoCopiar from "@/components/BotaoCopiar";

interface CompradorRow {
  numero: number;
  nome: string | null;
  whatsapp: string | null;
  pago_em: string | null;
  agradecido_em: string | null;
}

interface Participante {
  chave: string;
  nome: string | null;
  whatsapp: string | null;
  numeros: number[];
  agradecido: boolean;
}

export default async function AgradecerPage() {
  await requireAuth();
  const supabase = createServiceClient();

  // Só quem PAGOU (pago_em preenchido). Reservas não pagas ficam de fora.
  const { data, error } = await supabase
    .from("compradores")
    .select("numero, nome, whatsapp, pago_em, agradecido_em")
    .not("pago_em", "is", null)
    .order("numero", { ascending: true });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto text-red-600">
          Erro ao buscar participantes: {error.message}
        </div>
      </div>
    );
  }

  // Agrupa por pessoa (telefone normalizado; nome como fallback) → 1 msg/pessoa.
  const mapa = new Map<string, Participante>();
  for (const row of (data as CompradorRow[]) ?? []) {
    const intl = paraWhatsAppInternacional(row.whatsapp);
    const chave =
      intl ??
      (row.nome ? `nome:${row.nome.trim().toLowerCase()}` : `num:${row.numero}`);
    const atual = mapa.get(chave);
    if (atual) {
      atual.numeros.push(row.numero);
      atual.nome = atual.nome ?? row.nome;
      atual.whatsapp = atual.whatsapp ?? row.whatsapp;
      atual.agradecido = atual.agradecido && !!row.agradecido_em;
    } else {
      mapa.set(chave, {
        chave,
        nome: row.nome,
        whatsapp: row.whatsapp,
        numeros: [row.numero],
        agradecido: !!row.agradecido_em,
      });
    }
  }

  // Pendentes primeiro; depois por primeiro número.
  const participantes = [...mapa.values()].sort((a, b) => {
    if (a.agradecido !== b.agradecido) return a.agradecido ? 1 : -1;
    return a.numeros[0] - b.numeros[0];
  });

  const totalPessoas = participantes.length;
  const totalAgradecidos = participantes.filter((p) => p.agradecido).length;
  const totalPendentes = totalPessoas - totalAgradecidos;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Agradecer participantes
            </h1>
            <p className="text-gray-500 mt-1">
              Mande um obrigada no WhatsApp para quem já pagou. Abre a conversa
              com a mensagem pronta — é só revisar e enviar.
            </p>
          </div>
          <a
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-800 transition px-3 py-2 rounded hover:bg-gray-100 whitespace-nowrap"
          >
            ← Voltar ao painel
          </a>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardMini titulo="Participantes" valor={totalPessoas} cor="text-gray-800" bg="bg-white" />
          <CardMini titulo="A agradecer" valor={totalPendentes} cor="text-green-600" bg="bg-green-50" />
          <CardMini titulo="Já agradecidos" valor={totalAgradecidos} cor="text-gray-500" bg="bg-gray-100" />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          💡 Dica: envie aos poucos (não os 50 de uma vez) para o WhatsApp não
          achar que é spam.
        </div>

        {participantes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Ainda não há participantes pagos para agradecer.
          </div>
        ) : (
          <div className="space-y-4">
            {participantes.map((p) => {
              const mensagem = montarMensagemAgradecimento(p.nome);
              const href = linkWhatsApp(p.whatsapp, mensagem);
              const numerosStr = p.numeros.join(",");
              return (
                <div
                  key={p.chave}
                  className={`bg-white rounded-lg shadow-sm border p-5 ${
                    p.agradecido ? "border-gray-100 opacity-70" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-lg">
                          {p.nome?.trim() || "Sem nome"}
                        </span>
                        {p.agradecido && (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            ✓ Agradecido
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {p.whatsapp?.trim() || "Sem WhatsApp cadastrado"}
                        {" · "}
                        {p.numeros.length} número{p.numeros.length > 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.numeros.map((n) => (
                          <span
                            key={n}
                            className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!p.agradecido && (
                        <>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.943-5.359 11.945-11.893a11.821 11.821 0 00-3.418-8.452z" />
                              </svg>
                              Agradecer no WhatsApp
                            </a>
                          ) : (
                            <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                              WhatsApp inválido — confira manualmente
                            </span>
                          )}

                          <BotaoCopiar texto={mensagem} />
                        </>
                      )}

                      {p.agradecido ? (
                        <form action={desmarcarAgradecidoAction}>
                          <input type="hidden" name="numeros" value={numerosStr} />
                          <button
                            type="submit"
                            className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            Desmarcar
                          </button>
                        </form>
                      ) : (
                        <form action={marcarAgradecidoAction}>
                          <input type="hidden" name="numeros" value={numerosStr} />
                          <button
                            type="submit"
                            className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 transition"
                          >
                            Marcar como agradecido
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CardMini({
  titulo,
  valor,
  cor,
  bg,
}: {
  titulo: string;
  valor: number;
  cor: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg shadow-sm border border-gray-100 p-5`}>
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-3xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  );
}
