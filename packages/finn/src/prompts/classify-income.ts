import { z } from 'zod';

export const incomeClassificationSchema = z.object({
  type: z.enum([
    'salary',
    'freelance',
    'rental',
    'investment_yield',
    'loan_payment',
    'business',
    'eventual',
    'other',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
});

export type IncomeClassification = z.infer<typeof incomeClassificationSchema>;

/**
 * Prompt para Gemini 2.5 Flash-Lite — clasificación de ingresos.
 * Spec: docs/modules/mod-00-ingresos.md §7
 */
export function buildClassifyIncomePrompt(input: {
  source_name: string;
  notes?: string;
  amount: number;
  currency: string;
}): string {
  return `Eres un clasificador de ingresos personales para usuarios en El Salvador.

Clasifica el siguiente ingreso en EXACTAMENTE uno de estos tipos:
- salary: nómina/sueldo de empresa
- freelance: proyecto/cliente como independiente
- rental: renta de inmueble
- investment_yield: dividendos, intereses, cupones, cripto
- loan_payment: alguien me pagó un préstamo que le di
- business: ganancia de mi negocio propio
- eventual: venta de activo, premio, herencia, reembolso (no recurrente)
- other: ninguno de los anteriores

Descripción del ingreso: "${input.source_name}"
Notas adicionales: "${input.notes ?? ''}"
Monto: ${input.amount} ${input.currency}

Responde SOLO con JSON válido:
{"type": "<tipo>", "confidence": <0.0-1.0>, "reasoning": "<una frase breve>"}`;
}
