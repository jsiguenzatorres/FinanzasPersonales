import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

/** No incluye 'credit_card' — esa deuda ya se trackea en Tarjetas (ver §1.2 de mod-16-deudas-propias.md). */
export const debtTypeSchema = z.enum(['personal_loan', 'mortgage', 'auto_loan', 'student_loan', 'other']);
export type DebtType = z.infer<typeof debtTypeSchema>;

export const debtStrategySchema = z.enum(['snowball', 'avalanche', 'custom']);
export type DebtStrategy = z.infer<typeof debtStrategySchema>;

export const debtCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(150),
  creditor: z.string().min(1, 'Ingresa el acreedor').max(150),
  type: debtTypeSchema,
  original_amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  current_balance: moneyAmountSchema.refine((v) => v > 0, { message: 'El saldo debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  interest_rate_annual: z.number().min(0).max(100, 'Revisa la tasa — parece muy alta'),
  term_months: z.number().int().min(1).max(600).optional(),
  monthly_payment: moneyAmountSchema.optional(),
  start_date: isoDateSchema,
  next_payment_date: isoDateSchema.optional(),
  next_payment_amount: moneyAmountSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export type DebtCreateInput = z.infer<typeof debtCreateSchema>;

export const debtUpdateSchema = debtCreateSchema.extend({
  status: z.enum(['active', 'paid', 'defaulted', 'restructured', 'written_off']).optional(),
});

export type DebtUpdateInput = z.infer<typeof debtUpdateSchema>;

export const debtPaymentCreateSchema = z.object({
  debt_id: uuidSchema,
  amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  payment_date: isoDateSchema,
  is_extra: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export type DebtPaymentCreateInput = z.infer<typeof debtPaymentCreateSchema>;

export const debtStrategyConfirmSchema = z.object({
  strategy: debtStrategySchema,
  order: z.array(uuidSchema).min(1),
});

export type DebtStrategyConfirmInput = z.infer<typeof debtStrategyConfirmSchema>;
