import { z } from 'zod';
import { currencyCodeSchema, moneyAmountSchema } from './common';

export const creditCardCreateSchema = z.object({
  bank_name: z.string().min(1, 'Selecciona un banco').max(100),
  card_name: z.string().min(1, 'Ingresa un nombre').max(100),
  card_brand: z.string().max(50).optional(),
  card_number_mask: z
    .string()
    .regex(/^\d{0,4}$/, 'Solo los últimos 4 dígitos')
    .optional(),
  currency: currencyCodeSchema,
  credit_limit: moneyAmountSchema.refine((v) => v > 0, { message: 'El límite debe ser mayor a 0' }),
  current_balance: moneyAmountSchema,
  cut_day: z.number().int().min(1).max(31),
  payment_due_day: z.number().int().min(1).max(31),
  // Capturado como porcentaje (ej. 36) y convertido a decimal (0.36) al guardar.
  interest_rate_annual_pct: z.number().min(0).max(200),
  min_payment_pct: z.number().min(0).max(100).default(5),
});

export type CreditCardCreateInput = z.infer<typeof creditCardCreateSchema>;
