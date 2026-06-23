// Utilidades de WhatsApp para o painel admin:
// - normalizar o telefone salvo para o formato internacional do wa.me;
// - montar a mensagem de agradecimento (da Bela) ao participante;
// - gerar o link "click-to-chat" com a mensagem já preenchida.
//
// Tudo funciona com o WhatsApp PESSOAL (não precisa de WhatsApp Business nem de
// API): o link abre a conversa com o texto pronto e a pessoa só toca em "enviar".

import { PREMIO } from "@/lib/rifa";

/**
 * Converte um telefone salvo (ex.: "(11) 99999-9999") para o formato que o
 * wa.me espera: só dígitos, com DDI 55 (Brasil). Retorna null se não parecer
 * um número válido — aí a UI sinaliza para conferência manual.
 */
export function paraWhatsAppInternacional(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

/** Primeiro nome para a saudação (string vazia se não houver nome). */
export function primeiroNome(nome: string | null | undefined): string {
  const limpo = (nome ?? "").trim();
  return limpo ? limpo.split(/\s+/)[0] : "";
}

/** "o número 7" | "os números 7, 23 e 41" — linguagem natural para a mensagem. */
function listarNumeros(numeros: number[]): string {
  if (numeros.length === 0) return "seus números";
  if (numeros.length === 1) return `o número ${numeros[0]}`;
  const corpo = numeros.slice(0, -1).join(", ");
  return `os números ${corpo} e ${numeros[numeros.length - 1]}`;
}

/**
 * Mensagem de agradecimento ao participante. Sem data de sorteio (o sorteio é
 * manual). Edite o texto aqui se quiser mudar o tom.
 */
export function montarMensagemAgradecimento(
  nome: string | null,
  numeros: number[],
): string {
  const primeiro = primeiroNome(nome);
  const saudacao = primeiro ? `Oiee ${primeiro}! Tudo bem?` : "Oiee! Tudo bem?";
  return [
    saudacao,
    "",
    "Aqui é a Bela, dona do Suspiro. Muito obrigada por participar da nossa rifa e ajudar no tratamento do nosso Suspirinho.",
    "",
    "Assim que a rifa fechar a gente realiza o sorteio e avisa por aqui. De coração, muito obrigada pelo carinho, faz muita diferença <3",
  ].join("\n");
}

/** Link wa.me com a mensagem pré-preenchida (null se o telefone for inválido). */
export function linkWhatsApp(
  telefone: string | null | undefined,
  mensagem: string,
): string | null {
  const intl = paraWhatsAppInternacional(telefone);
  if (!intl) return null;
  return `https://wa.me/${intl}?text=${encodeURIComponent(mensagem)}`;
}
