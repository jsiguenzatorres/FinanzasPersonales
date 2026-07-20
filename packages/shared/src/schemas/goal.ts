import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const goalTypeSchema = z.enum([
  'emergency_fund',
  'savings',
  'debt_payoff',
  'purchase',
  'travel',
  'education',
  'retirement',
  'other',
]);

export type GoalType = z.infer<typeof goalTypeSchema>;

export const goalStatusSchema = z.enum(['active', 'paused', 'completed', 'abandoned']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const goalCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre para la meta').max(100),
  description: z.string().max(500).optional(),
  type: goalTypeSchema,
  target_amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  account_id: uuidSchema.optional(),
  target_date: isoDateSchema.optional(),
  monthly_contribution: moneyAmountSchema.optional(),
  auto_contribution_pct: z
    .number()
    .min(0, 'Debe ser entre 0 y 100')
    .max(100, 'Debe ser entre 0 y 100')
    .optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;

export const goalUpdateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre para la meta').max(100),
  description: z.string().max(500).optional(),
  target_amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  account_id: uuidSchema.optional(),
  target_date: isoDateSchema.optional(),
  monthly_contribution: moneyAmountSchema.optional(),
  auto_contribution_pct: z
    .number()
    .min(0, 'Debe ser entre 0 y 100')
    .max(100, 'Debe ser entre 0 y 100')
    .optional(),
  priority: z.number().int().min(1).max(10).optional(),
  status: goalStatusSchema.optional(),
});

export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;

export const goalContributionCreateSchema = z.object({
  goal_id: uuidSchema,
  amount: z.number().refine((v) => v !== 0, { message: 'El monto no puede ser cero' }),
  currency: currencyCodeSchema,
  contribution_date: isoDateSchema,
  notes: z.string().max(500).optional(),
});

export type GoalContributionCreateInput = z.infer<typeof goalContributionCreateSchema>;
