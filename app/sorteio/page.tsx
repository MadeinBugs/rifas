import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import SorteioClient from "./SorteioClient";
import { type ResultadoSorteio } from "./actions";
import Link from "next/link";

/** Lê o resultado persistido diretamente no servidor (sem passar pela action). */
async function lerResultadoInicial(): Promise<ResultadoSorteio | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sorteio")
    .select(`
      numero,
      sorteado_em,
      numeros (
        compradores ( nome )
      )
    `)
    .eq("id", 1)
    .maybeSingle();

  if (!data) return null;

  // Supabase pode retornar a relação FK como objeto ou array; tratar os dois casos
  const numerosRaw = Array.isArray(data.numeros) ? data.numeros[0] : data.numeros;
  const compradores = numerosRaw?.compradores;
  const lista = Array.isArray(compradores) ? compradores : compradores ? [compradores] : [];
  const nome = lista[0]?.nome || "Anônimo";

  return {
    numero: data.numero,
    nome,
    sorteadoEm: data.sorteado_em,
    jaSorteado: true,
  };
}

export default async function SorteioPage() {
  await requireAuth();

  const resultadoInicial = await lerResultadoInicial();

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="cartao flex items-center justify-between p-6">
          <h1 className="font-[family-name:var(--font-baloo)] text-3xl font-bold text-mauve">
            Sorteio da Rifa 🎉
          </h1>
          <Link href="/admin" className="botao-voltar">
            &larr; Voltar ao Painel
          </Link>
        </header>

        <SorteioClient resultadoInicial={resultadoInicial} />
      </div>
    </div>
  );
}
