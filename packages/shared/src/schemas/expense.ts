import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const expenseCreateSchema = z
  .object({
    amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
    currency: currencyCodeSchema,
    transaction_date: isoDateSchema,
    account_id: uuidSchema.optional(),
    card_id: uuidSchema.optional(),
    category_id: uuidSchema.optional(),
    merchant_name: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
    receipt_url: z.string().max(500).optional(),
  })
  .refine((data) => !!data.account_id || !!data.card_id, {
    message: 'Selecciona una cuenta o una tarjeta de crédito',
    path: ['account_id'],
  });

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
