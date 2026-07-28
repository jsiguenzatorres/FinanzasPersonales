import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const interestTypeSchema = z.enum(['simple', 'compound']);
export type InterestType = z.infer<typeof interestTypeSchema>;

export const loanPortfolioCreateSchema = z.object({
  borrower_name: z.string().min(1, 'Ingresa el nombre del deudor').max(150),
  borrower_phone: z.string().max(30).optional(),
  borrower_email: z.string().email('Correo inválido').max(150).optional().or(z.literal('')),
  principal: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  interest_rate_monthly: z.number().positive('La tasa debe ser mayor a 0').max(100, 'Revisa la tasa — parece muy alta'),
  interest_type: interestTypeSchema,
  late_fee_rate: z.number().min(0).max(100).optional(),
  term_months: z.number().int().min(1, 'Mínimo 1 mes').max(360, 'Máximo 360 meses'),
  start_date: isoDateSchema,
  payment_day: z.number().int().min(1).max(31),
  account_id: uuidSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export type LoanPortfolioCreateInput = z.infer<typeof loanPortfolioCreateSchema>;

export const loanPortfolioUpdateSchema = z.object({
  borrower_name: z.string().min(1, 'Ingresa el nombre del deudor').max(150),
  borrower_phone: z.string().max(30).optional(),
  borrower_email: z.string().email('Correo inválido').max(150).optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  status: z.enum(['active', 'paid', 'defaulted', 'restructured', 'written_off']).optional(),
});

export type LoanPortfolioUpdateInput = z.infer<typeof loanPortfolioUpdateSchema>;

export const loanPortfolioPaymentCreateSchema = z.object({
  loan_id: uuidSchema,
  amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  payment_date: isoDateSchema,
  notes: z.string().max(2000).optional(),
});

export type LoanPortfolioPaymentCreateInput = z.infer<typeof loanPortfolioPaymentCreateSchema>;
