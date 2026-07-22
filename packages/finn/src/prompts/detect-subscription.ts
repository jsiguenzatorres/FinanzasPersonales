import { z } from 'zod';

export const subscriptionDetectionSchema = z.object({
  is_subscription: z.boolean(),
  service_name: z.string().max(100),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']),
  confidence: z.number().min(0).max(1),
});

export type SubscriptionDetection = z.infer<typeof subscriptionDetectionSchema>;

/**
 * Prompt para Gemini 2.5 Flash-Lite — confirma si un grupo de cargos
 * repetidos al mismo comercio es una suscripción real (Netflix, gimnasio)
 * o solo compras recurrentes normales (el súper de la esquina).
 * Spec: docs/modules/mod-06-suscripciones.md §2.2
 */
export function buildDetectSubscriptionPrompt(input: {
  merchant_name: string;
  amounts: number[];
  dates: string[];
  currency: string;
  avg_interval_days: number;
}): string {
  return `Eres un analista financiero. Te doy un grupo de cargos repetidos al mismo comercio en la
cuenta de un usuario en El Salvador. Decide si es una SUSCRIPCIÓN real (servicio que se renueva
automáticamente: streaming, software, gimnasio, seguro, hosting, etc.) o si son compras normales
que casualmente se repiten (supermercado, gasolina, restaurante) — eso NO es una suscripción.

Comercio: "${input.merchant_name}"
Montos de los últimos cargos: ${input.amounts.join(', ')} ${input.currency}
Fechas: ${input.dates.join(', ')}
Intervalo promedio entre cargos: ${Math.round(input.avg_interval_days)} días

Responde SOLO con JSON válido:
{"is_subscription": <true|false>, "service_name": "<nombre limpio del servicio, ej. 'Netflix' no 'NETFLIX.COM 1-888'>", "frequency": "<weekly|biweekly|monthly|bimonthly|quarterly|semiannual|annual, la más cercana al intervalo>", "confidence": <0.0-1.0>}`;
}
