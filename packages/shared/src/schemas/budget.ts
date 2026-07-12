import { z } from 'zod';
import { moneyAmountSchema, uuidSchema } from './common';

export const budgetModeSchema = z.enum(['zero_based', 'flexible', '50_30_20']);

export const budgetCategoryInputSchema = z.object({
  category_id: uuidSchema,
  allocated_amount: moneyAmountSchema,
});

export const budgetCreateSchema = z.object({
  mode: budgetModeSchema,
  total_income_expected: moneyAmountSchema.refine((v) => v > 0, {
    message: 'El ingreso esperado debe ser mayor a 0',
  }),
  categories: z.array(budgetCategoryInputSchema).min(1, 'Asigna al menos una categoría'),
});

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
