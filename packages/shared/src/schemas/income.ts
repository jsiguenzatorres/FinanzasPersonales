import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const incomeTypeSchema = z.enum([
  'salary',
  'freelance',
  'rental',
  'investment_yield',
  'loan_payment',
  'business',
  'eventual',
  'other',
]);

export type IncomeType = z.infer<typeof incomeTypeSchema>;

export const deductionTypeSchema = z.enum(['isss', 'afp', 'isr', 'other']);

export const deductionSchema = z.object({
  name: z.string().min(1).max(50),
  amount: moneyAmountSchema,
  type: deductionTypeSchema,
});

export type Deduction = z.infer<typeof deductionSchema>;

export const recurrenceFreqSchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'annual',
]);

export const incomeRecurrenceSchema = z.object({
  frequency: recurrenceFreqSchema,
  day_of_month: z.number().int().min(1).max(31).optional(),
  end_date: isoDateSchema.optional(),
});

/**
 * Schema de creación de ingreso — input del endpoint income-create.
 * Refleja el flujo definido en docs/modules/mod-00-ingresos.md §5.3.
 */
export const incomeCreateSchema = z
  .object({
    type: incomeTypeSchema,
    source_name: z.string().min(1).max(200),
    gross_amount: moneyAmountSchema,
    net_amount: moneyAmountSchema,
    deductions: z.array(deductionSchema).max(10).optional(),
    currency: currencyCodeSchema,
    income_date: isoDateSchema,
    account_id: uuidSchema,
    is_collected: z.boolean().default(true),
    expected_date: isoDateSchema.optional(),
    invoice_number: z.string().max(100).optional(),
    invoice_file: z.string().max(500).optional(),
    is_tax_relevant: z.boolean().default(false),
    tax_withheld: moneyAmountSchema.optional(),
    is_recurring: z.boolean().default(false),
    recurrence: incomeRecurrenceSchema.optional(),
    goal_allocation: z.record(uuidSchema, moneyAmountSchema).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
  })
  .refine((data) => data.net_amount <= data.gross_amount, {
    message: 'net_amount no puede exceder gross_amount',
    path: ['net_amount'],
  })
  .refine(
    (data) => {
      if (data.deductions && data.deductions.length > 0) {
        const sum = data.deductions.reduce((acc, d) => acc + d.amount, 0);
        const diff = Math.abs(sum - (data.gross_amount - data.net_amount));
        return diff < 0.01;
      }
      return true;
    },
    {
      message: 'Suma de deductions debe ser igual a (gross - net) ±0.01',
      path: ['deductions'],
    },
  )
  .refine((data) => data.is_collected || !!data.expected_date, {
    message: 'expected_date es requerido cuando is_collected = false',
    path: ['expected_date'],
  })
  .refine(
    (data) => {
      if (!data.goal_allocation) return true;
      const sum = Object.values(data.goal_allocation).reduce((a, b) => a + b, 0);
      return sum <= data.net_amount;
    },
    {
      message: 'La suma de goal_allocation no puede exceder net_amount',
      path: ['goal_allocation'],
    },
  )
  .refine(
    (data) => !data.is_tax_relevant || !!data.invoice_number,
    {
      message: 'is_tax_relevant=true requiere invoice_number',
      path: ['invoice_number'],
    },
  );

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;
