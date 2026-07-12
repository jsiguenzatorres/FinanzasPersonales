import { z } from 'zod';

export const expenseClassificationSchema = z.object({
  category_name: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
});

export type ExpenseClassification = z.infer<typeof expenseClassificationSchema>;

/**
 * Prompt para Gemini 2.5 Flash-Lite — clasificación de gastos.
 * Spec: docs/modules/mod-04-gastos.md §5.4
 */
export function buildClassifyExpensePrompt(input: {
  merchant_name?: string;
  description?: string;
  amount: number;
  currency: string;
  category_names: string[];
}): string {
  return `Eres un clasificador de gastos personales para usuarios en El Salvador.

Elige EXACTAMENTE una categoría de esta lista (responde con el nombre EXACTO tal como aparece,
sin agregar ni quitar texto):
${input.category_names.map((n) => `- ${n}`).join('\n')}

Comercio: "${input.merchant_name ?? ''}"
Descripción: "${input.description ?? ''}"
Monto: ${input.amount} ${input.currency}

Responde SOLO con JSON válido:
{"category_name": "<nombre exacto de la lista>", "confidence": <0.0-1.0>, "reasoning": "<una frase breve>"}`;
}
