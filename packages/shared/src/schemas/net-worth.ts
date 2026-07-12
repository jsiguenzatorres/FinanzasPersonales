import { z } from 'zod';
import { currencyCodeSchema, moneyAmountSchema } from './common';

export const assetTypeSchema = z.enum([
  'cash',
  'investment',
  'real_estate',
  'vehicle',
  'collectible',
  'crypto',
  'other',
]);

export const liabilityTypeSchema = z.enum([
  'credit_card',
  'personal_loan',
  'mortgage',
  'auto_loan',
  'student_loan',
  'other',
]);

export const manualAssetCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(100),
  type: assetTypeSchema,
  value: moneyAmountSchema.refine((v) => v > 0, { message: 'El valor debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  notes: z.string().max(500).optional(),
});

export type ManualAssetCreateInput = z.infer<typeof manualAssetCreateSchema>;

export const manualLiabilityCreateSchema = z.object({
  name: z.string().min(1, 'Ingresa un nombre').max(100),
  type: liabilityTypeSchema,
  amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  currency: currencyCodeSchema,
  notes: z.string().max(500).optional(),
});

export type ManualLiabilityCreateInput = z.infer<typeof manualLiabilityCreateSchema>;
