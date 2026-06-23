"use server";

import { logout, requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { PRECO_POR_NUMERO, TOTAL_NUMEROS } from "@/lib/rifa";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<void> {
  await logout();
}

/**
 * Marca um pedido como PAGO manualmente (sem passar pelo Mercado Pago).
 *
 * Uso: testes do fluxo de Pix e resgate manual (ex.: webhook falhou, mas a
 * pessoa pagou). Replica o efeito de uma confirmação: pedido + números +
 * compradores viram 'pago'. A aba do checkout (que faz polling em
 * /api/status) detecta e comemora.
 */
export async function marcarPedidoPagoAction(formData: FormData): Promise<void> {
  await requireAuth();

  const pedidoId = formData.get("pedidoId")?.toString().trim();
  if (!pedidoId) return;

  const supabase = createServiceClient();

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, numeros")
    .eq("id", pedidoId)
    .single();
  if (error || !pedido) return;

  const numeros: number[] = Array.isArray(pedido.numeros) ? pedido.numeros : [];
  const agora = new Date().toISOString();

  await supabase
    .from("pedidos")
    .update({ status: "pago", pago_em: agora })
    .eq("id", pedidoId);

  if (numeros.length > 0) {
    await supabase
      .from("numeros")
      .update({ status: "pago" })
      .in("numero", numeros);

    await supabase
      .from("compradores")
      .update({ pago_em: agora })
      .eq("pedido_id", pedidoId);
  }

  revalidatePath("/admin");
}

/**
 * Desfaz a marcação de pago: devolve o pedido para 'aguardando' e os números
 * para 'reservado', reiniciando o relógio de 15 min. Útil para repetir testes
 * sem mexer no Supabase.
 */
export async function desmarcarPedidoPagoAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();

  const pedidoId = formData.get("pedidoId")?.toString().trim();
  if (!pedidoId) return;

  const supabase = createServiceClient();

  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select("id, numeros")
    .eq("id", pedidoId)
    .single();
  if (error || !pedido) return;

  const numeros: number[] = Array.isArray(pedido.numeros) ? pedido.numeros : [];
  const agora = new Date().toISOString();

  await supabase
    .from("pedidos")
    .update({ status: "aguardando", pago_em: null, reservado_em: agora })
    .eq("id", pedidoId);

  if (numeros.length > 0) {
    await supabase
      .from("numeros")
      .update({ status: "reservado", reservado_em: agora })
      .in("numero", numeros);

    await supabase
      .from("compradores")
      .update({ pago_em: null })
      .eq("pedido_id", pedidoId);
  }

  revalidatePath("/admin");
}

/**
 * Converte um texto livre numa lista de números válidos (1..TOTAL_NUMEROS).
 * Aceita separação por vírgula/espaço/ponto-e-vírgula e intervalos: "10-19".
 * Ex.: "10, 11, 12" • "10 11 12" • "10-19" • "1, 5-8, 23".
 */
function parseNumeros(input: string): { numeros: number[]; invalidos: string[] } {
  const limpo = input.replace(/\s*-\s*/g, "-");
  const tokens = limpo
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const set = new Set<number>();
  const invalidos: string[] = [];

  for (const tok of tokens) {
    const range = tok.match(/^(\d+)-(\d+)$/);
    if (range) {
      let a = parseInt(range[1], 10);
      let b = parseInt(range[2], 10);
      if (a > b) [a, b] = [b, a];
      const ini = Math.max(a, 1);
      const fim = Math.min(b, TOTAL_NUMEROS);
      for (let n = ini; n <= fim; n++) set.add(n);
      if (a < 1 || b > TOTAL_NUMEROS) invalidos.push(tok);
      continue;
    }

    const n = Number(tok);
    if (Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMEROS) set.add(n);
    else invalidos.push(tok);
  }

  return { numeros: [...set].sort((a, b) => a - b), invalidos };
}

/** Junta uma lista para exibição na URL de retorno, com corte de segurança. */
function listaCurta(arr: (number | string)[], max = 40): string {
  const cabeca = arr.slice(0, max).join(", ");
  return arr.length > max ? `${cabeca}…` : cabeca;
}

/**
 * Marca um ou mais números como PAGOS manualmente — para quando alguém paga o
 * Pix por fora, sem passar pelo site (ex.: comprou 10 números no particular).
 *
 * Agrupa os números num pedido "manual" já pago (espelhando o fluxo do Pix),
 * marca os `numeros` como 'pago' e registra o comprador (nome/WhatsApp são
 * opcionais). Números que já estão pagos são ignorados — nunca sobrescreve
 * quem já comprou. Como vira um pedido 'pago', o botão "Desmarcar pago" da
 * tabela de Pedidos serve de desfazer.
 */
export async function marcarNumerosPagosManualAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();

  const entrada = formData.get("numeros")?.toString() ?? "";
  const nome = formData.get("nome")?.toString().trim() || null;
  const whatsapp = formData.get("whatsapp")?.toString().trim() || null;

  const { numeros, invalidos } = parseNumeros(entrada);

  if (numeros.length === 0) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Informe ao menos um número válido (1 a 500).",
      )}`,
    );
  }

  const supabase = createServiceClient();

  // Não sobrescrever quem já pagou: separa os números já pagos para ignorar.
  const { data: atuais, error: errLeitura } = await supabase
    .from("numeros")
    .select("numero, status")
    .in("numero", numeros);
  if (errLeitura) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Falha ao ler números: " + errLeitura.message,
      )}`,
    );
  }

  const jaPagos = (atuais ?? [])
    .filter((n) => n.status === "pago")
    .map((n) => n.numero);
  const aMarcar = numeros.filter((n) => !jaPagos.includes(n));

  if (aMarcar.length === 0) {
    redirect(
      `/admin?marcados=0&japagos=${encodeURIComponent(listaCurta(jaPagos))}`,
    );
  }

  const agora = new Date().toISOString();
  const totalCentavos = aMarcar.length * PRECO_POR_NUMERO * 100;

  // 1) Pedido "manual" já pago, agrupando os números (espelha o fluxo do Pix).
  const { data: pedido, error: errPedido } = await supabase
    .from("pedidos")
    .insert({
      status: "pago",
      pix_id: "manual",
      quantidade: aMarcar.length,
      total_centavos: totalCentavos,
      numeros: aMarcar,
      reservado_em: agora,
      pago_em: agora,
    })
    .select("id")
    .single();
  if (errPedido || !pedido) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Falha ao criar o pedido manual: " + (errPedido?.message ?? "—"),
      )}`,
    );
  }

  // 2) Marca os números como pagos.
  const { error: errNum } = await supabase
    .from("numeros")
    .update({ status: "pago", reservado_em: agora })
    .in("numero", aMarcar);
  if (errNum) {
    redirect(
      `/admin?erro=${encodeURIComponent(
        "Falha ao marcar números: " + errNum.message,
      )}`,
    );
  }

  // 3) Registra o comprador por número (PII opcional), vinculado ao pedido.
  const linhas = aMarcar.map((numero) => ({
    numero,
    nome,
    whatsapp,
    pix_id: "manual",
    pago_em: agora,
    pedido_id: pedido.id,
  }));
  const { error: errComp } = await supabase
    .from("compradores")
    .upsert(linhas, { onConflict: "numero" });
  if (errComp) {
    console.error(
      "[admin] números marcados como pagos, mas falhou ao gravar compradores:",
      errComp.message,
    );
  }

  revalidatePath("/admin");
  redirect(
    `/admin?marcados=${aMarcar.length}` +
      (jaPagos.length
        ? `&japagos=${encodeURIComponent(listaCurta(jaPagos))}`
        : "") +
      (invalidos.length
        ? `&invalidos=${encodeURIComponent(listaCurta(invalidos))}`
        : ""),
  );
}

/** Lê os números (separados por vírgula) do formulário de agradecimento. */
function numerosDoForm(formData: FormData): number[] {
  return (formData.get("numeros")?.toString() ?? "")
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => Number.isInteger(n));
}

/**
 * Marca como "agradecido" os números informados — registra que o organizador
 * já mandou o obrigada no WhatsApp para aquela pessoa (envio manual).
 */
export async function marcarAgradecidoAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();

  const numeros = numerosDoForm(formData);
  if (numeros.length === 0) return;

  const supabase = createServiceClient();
  await supabase
    .from("compradores")
    .update({ agradecido_em: new Date().toISOString() })
    .in("numero", numeros);

  revalidatePath("/admin/agradecer");
}

/** Desfaz a marcação de "agradecido" para os números informados. */
export async function desmarcarAgradecidoAction(
  formData: FormData,
): Promise<void> {
  await requireAuth();

  const numeros = numerosDoForm(formData);
  if (numeros.length === 0) return;

  const supabase = createServiceClient();
  await supabase
    .from("compradores")
    .update({ agradecido_em: null })
    .in("numero", numeros);

  revalidatePath("/admin/agradecer");
}

