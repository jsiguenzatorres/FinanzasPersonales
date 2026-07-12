import { z } from 'zod';
import { currencyCodeSchema, moneyAmountSchema } from './common';

/**
 * Tipos de cuenta expuestos en el flujo de creación MVP.
 * credit_card/investment/virtual tienen sus propios flujos (MOD-15, Fase 2).
 */
export const accountTypeSchema = z.enum(['checking', 'savings', 'cash', 'digital_wallet', 'fx']);

export type AccountType = z.infer<typeof accountTypeSchema>;

export const accountCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(100),
  type: accountTypeSchema,
  bank_name: z.string().max(100).optional(),
  currency: currencyCodeSchema,
  initial_balance: moneyAmountSchema,
});

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
