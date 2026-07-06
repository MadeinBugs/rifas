import { imagemAtualizacao } from "@/lib/og";

export { size, contentType } from "@/lib/og";

export const alt = "Atualização · Salve o Suspiro";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return imagemAtualizacao(slug, "pt");
}
