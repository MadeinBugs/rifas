import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { PRECO_POR_NUMERO } from "@/lib/rifa";

interface CompradorJoin {
  numero: number;
  status: string;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  pix_id: string | null;
  pago_em: string | null;
}

export default async function AdminPage() {
  await requireAuth();

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

  const dados = (rawData || []).map((row: any) => {
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
            <div className="text-sm text-gray-500">
              Você está logado de forma segura.
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardEstatistica titulo="Arrecadação (Pagos)" valor={`R$ ${arrecadado.toFixed(2).replace('.', ',')}`} cor="text-green-600" bg="bg-green-50" />
          <CardEstatistica titulo="Números Pagos" valor={pagos} cor="text-green-600" bg="bg-green-50" />
          <CardEstatistica titulo="Reservados (Aguardando)" valor={reservados} cor="text-orange-600" bg="bg-orange-50" />
          <CardEstatistica titulo="Livre" valor={livres} cor="text-gray-600" bg="bg-gray-100" />
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
