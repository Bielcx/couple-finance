"use server";

import OpenAI from "openai";

const SYSTEM = `Você é um consultor financeiro pessoal conversando com um casal brasileiro que divide as contas.

Analise o resumo do mês e devolva de 3 a 5 recomendações práticas.

Regras:
- Uma recomendação por linha, começando com "- ".
- Cada linha: um título curto em negrito markdown, travessão, e a recomendação em no máximo duas frases.
- Cite números concretos do resumo (valores em reais, percentuais, categorias).
- Seja específico e acionável. Nada de conselho genérico tipo "façam um orçamento".
- Se algo estiver bem, diga — não invente problema.
- Sem preâmbulo, sem conclusão, sem cabeçalho. Só as linhas.`;

/**
 * Recebe o resumo já montado pela página (server component) e devolve as
 * recomendações. O resumo passa pelo cliente, mas são os dados do próprio
 * casal e a action não escreve nada — não é fronteira de confiança.
 */
export async function getInsights(summary: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "- **IA não configurada** — defina `OPENAI_API_KEY` no `.env.local` para ativar as recomendações.";
  }

  const client = new OpenAI();

  const response = await client.chat.completions.create({
    // ponytail: modelo via env pra trocar sem mexer no código
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: summary },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
