import { requireAuth } from "@/lib/auth";
import SorteioClient from "./SorteioClient";
import Link from "next/link";

export default async function SorteioPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800">Sorteio da Rifa 🎉</h1>
          <Link href="/admin" className="botao-voltar !mb-0 text-sm">
            &larr; Voltar ao Painel
          </Link>
        </header>

        <SorteioClient />
      </div>
    </div>
  );
}
