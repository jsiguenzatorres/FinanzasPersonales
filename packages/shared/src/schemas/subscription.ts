import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';
import { recurrenceFreqSchema } from './income';

export const subscriptionCreateSchema = z.object({
  service_name: z.string().min(1, 'Ingresa el nombre del servicio').max(100),
  plan: z.string().max(100).optional(),
  amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  frequency: recurrenceFreqSchema,
  next_charge_date: isoDateSchema,
  start_date: isoDateSchema,
  category_id: uuidSchema.optional(),
  card_id: uuidSchema.optional(),
  account_id: uuidSchema.optional(),
  cancel_url: z.string().max(500).optional(),
  free_trial_until: isoDateSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;

export const subscriptionUpdateSchema = subscriptionCreateSchema.extend({
  usage_score: z.number().int().min(1).max(5).optional(),
  is_active: z.boolean().optional(),
});

export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;

/** Sugerencia detectada — lo que Gemini devuelve por cada grupo candidato (§2.2 del módulo). */
export const subscriptionSuggestionSchema = z.object({
  is_subscription: z.boolean(),
  service_name: z.string().max(100),
  frequency: recurrenceFreqSchema,
  confidence: z.number().min(0).max(1),
});

export type SubscriptionSuggestion = z.infer<typeof subscriptionSuggestionSchema>;
