import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { PRECO_POR_NUMERO } from "@/lib/rifa";
import {
  logoutAction,
  marcarPedidoPagoAction,
  desmarcarPedidoPagoAction,
  marcarNumerosPagosManualAction,
} from "./actions";

interface CompradorJoin {
  numero: number;
  status: string;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  pix_id: string | null;
  pago_em: string | null;
}

/** Formato bruto retornado pelo Supabase para cada linha da query. */
interface RawNumeroRow {
  numero: number;
  status: string;
  compradores:
    | { nome: string | null; whatsapp: string | null; email: string | null; pix_id: string | null; pago_em: string | null }
    | { nome: string | null; whatsapp: string | null; email: string | null; pix_id: string | null; pago_em: string | null }[]
    | null;
}

/** Linha bruta de `pedidos` com o comprador embutido (1 por número). */
interface RawPedidoRow {
  id: string;
  status: string;
  quantidade: number;
  total_centavos: number;
  numeros: number[];
  reservado_em: string | null;
  pago_em: string | null;
  criado_em: string;
  compradores:
    | { nome: string | null; whatsapp: string | null }
    | { nome: string | null; whatsapp: string | null }[]
    | null;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    marcados?: string;
    japagos?: string;
    invalidos?: string;
    erro?: string;
  }>;
}) {
  await requireAuth();

  const { marcados, japagos, invalidos, erro } = await searchParams;

  const supabase = createServiceClient();
  
  // Buscar todos os números com detalhes de quem pagou ou reservou
  const { data: rawData, error } = await supabase
    .from("numeros")
    .select(`
      numero,
      status,
      compradores (
        nome,
        whatsapp,
        email,
        pix_id,
        pago_em
      )
    `)
    .order("numero", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-red-600">Erro ao buscar dados: {error.message}</div>
    );
  }

  const dados = (rawData as RawNumeroRow[] || []).map((row) => {
    // Supabase retorna array para relação 1:1 devido a referências
    const c = Array.isArray(row.compradores) ? row.compradores[0] : row.compradores;
    return {
      numero: row.numero,
      status: row.status,
      nome: c?.nome || null,
      whatsapp: c?.whatsapp || null,
      email: c?.email || null,
      pix_id: c?.pix_id || null,
      pago_em: c?.pago_em || null,
    } as CompradorJoin;
  });

  // ── Pedidos (para marcar/desmarcar pagamento manualmente) ──
  const { data: pedidosRaw, error: errPedidos } = await supabase
    .from("pedidos")
    .select(
      `id, status, quantidade, total_centavos, numeros, reservado_em, pago_em, criado_em,
       compradores ( nome, whatsapp )`,
    )
    .order("criado_em", { ascending: false })
    .limit(100);

  if (errPedidos) {
    console.error("[admin] falha ao buscar pedidos:", errPedidos.message);
  }

  const pedidos = ((pedidosRaw as RawPedidoRow[]) || []).map((p) => {
    const c = Array.isArray(p.compradores) ? p.compradores[0] : p.compradores;
    return {
      id: p.id,
      status: p.status,
      quantidade: p.quantidade,
      total: (p.total_centavos ?? 0) / 100,
      numeros: Array.isArray(p.numeros) ? p.numeros : [],
      criado_em: p.criado_em,
      nome: c?.nome ?? null,
      whatsapp: c?.whatsapp ?? null,
    };
  });

  // Estatísticas
  const livres = dados.filter(d => d.status === "livre").length;
  const reservados = dados.filter(d => d.status === "reservado").length;
  const pagos = dados.filter(d => d.status === "pago").length;
  const arrecadado = pagos * PRECO_POR_NUMERO;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Painel de Administração</h1>
            <p className="text-gray-500 mt-1">Acompanhamento e gestão da Rifa do Gatinho</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/sorteio" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm">
              🎉 Ir para o Sorteio
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600 transition px-3 py-2 rounded hover:bg-red-50"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardEstatistica titulo="Arrecadação (Pagos)" valor={`R$ ${arrecadado.toFixed(2).replace('.', ',')}`} cor="text-green-600" bg="bg-green-50" />
          <CardEstatistica titulo="Números Pagos" valor={pagos} cor="text-green-600" bg="bg-green-50" />
          <CardEstatistica titulo="Reservados (Aguardando)" valor={reservados} cor="text-orange-600" bg="bg-orange-50" />
          <CardEstatistica titulo="Livre" valor={livres} cor="text-gray-600" bg="bg-gray-100" />
        </div>

        {/* Retorno da ação de marcar pagamento manual */}
        {(erro || marcados !== undefined) && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              erro
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {erro ? (
              <p>⚠️ {erro}</p>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold">
                  {Number(marcados) > 0
                    ? `✓ ${marcados} número(s) marcados como pagos.`
                    : "Nenhum número novo marcado."}
                </p>
                {japagos && (
                  <p className="text-green-700/80">
                    Já estavam pagos (ignorados): {japagos}
                  </p>
                )}
                {invalidos && (
                  <p className="text-green-700/80">
                    Ignorados (inválidos): {invalidos}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pagamento manual: marcar números pagos por fora (Pix direto) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Marcar pagamento manual (Pix por fora)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Para quando alguém paga o Pix direto, sem passar pelo site. Informe
              os números (ex.: <code className="font-mono">10, 11, 12</code> ou{" "}
              <code className="font-mono">10-19</code>) e, se quiser, o nome/WhatsApp
              de quem pagou. Números já pagos são ignorados.
            </p>
          </div>
          <form
            action={marcarNumerosPagosManualAction}
            className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Números *
              </label>
              <input
                name="numeros"
                required
                placeholder="Ex.: 10, 11, 12 ou 10-19"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome (opcional)
              </label>
              <input
                name="nome"
                placeholder="Quem pagou"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp (opcional)
              </label>
              <input
                name="whatsapp"
                placeholder="(11) 9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                ✓ Marcar como pago
              </button>
            </div>
          </form>
        </div>

        {/* Pedidos: marcar / desmarcar pagamento (testes de Pix + resgate manual) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Pedidos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Marque um pedido como pago para testar o fluxo de Pix (ou para
              resgatar um pagamento que o webhook não confirmou). A aba do
              checkout se atualiza sozinha em alguns segundos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Criado</th>
                  <th className="p-4 font-semibold text-gray-600">Números</th>
                  <th className="p-4 font-semibold text-gray-600">Total</th>
                  <th className="p-4 font-semibold text-gray-600">Comprador</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Nenhum pedido ainda.
                    </td>
                  </tr>
                )}
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 align-top">
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(p.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-700">
                      {p.numeros
                        .map((n) => n.toString().padStart(3, "0"))
                        .join(", ")}
                      <span className="ml-1 text-gray-400">({p.quantidade})</span>
                    </td>
                    <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">
                      R$ {p.total.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="p-4 text-gray-700">
                      <div className="font-medium">{p.nome || "-"}</div>
                      <div className="text-xs text-gray-400">{p.whatsapp || ""}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${corStatusPedido(p.status)}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.status === "pago" ? (
                        <form action={desmarcarPedidoPagoAction}>
                          <input type="hidden" name="pedidoId" value={p.id} />
                          <button
                            type="submit"
                            className="text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                          >
                            ↩ Desmarcar pago
                          </button>
                        </form>
                      ) : (
                        <form action={marcarPedidoPagoAction}>
                          <input type="hidden" name="pedidoId" value={p.id} />
                          <button
                            type="submit"
                            className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition shadow-sm whitespace-nowrap"
                          >
                            ✓ Marcar como pago
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Listagem de Números (Compradores e Reservas)</h2>
            <p className="text-sm text-gray-500 mt-1">
              Mostra apenas quem reservou ou pagou.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Número</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600">Nome</th>
                  <th className="p-4 font-semibold text-gray-600">WhatsApp</th>
                  <th className="p-4 font-semibold text-gray-600">E-mail</th>
                  <th className="p-4 font-semibold text-gray-600">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.filter(d => d.status !== "livre").length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Nenhuma reserva ou pagamento ainda.
                    </td>
                  </tr>
                )}
                {dados
                  .filter(d => d.status !== "livre")
                  .map((d) => (
                    <tr key={d.numero} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-gray-700">
                        {d.numero.toString().padStart(3, "0")}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          d.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-800">{d.nome || "-"}</td>
                      <td className="p-4 text-gray-600">{d.whatsapp || "-"}</td>
                      <td className="p-4 text-gray-600">{d.email || "-"}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {d.pago_em ? new Date(d.pago_em).toLocaleString("pt-BR") : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function CardEstatistica({ titulo, valor, cor, bg }: { titulo: string, valor: string | number, cor: string, bg: string }) {
  return (
    <div className={`p-6 rounded-lg ${bg} border border-transparent flex flex-col justify-center`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{titulo}</p>
      <p className={`text-3xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}

/** Cor do selo de status do pedido. */
function corStatusPedido(status: string): string {
  switch (status) {
    case "pago":
      return "bg-green-100 text-green-700";
    case "aguardando":
      return "bg-orange-100 text-orange-700";
    case "pago_expirado":
      return "bg-red-100 text-red-700";
    default: // expirado
      return "bg-gray-100 text-gray-600";
  }
}
