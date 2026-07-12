import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const deliveryMethodSchema = z.enum([
  'cash',
  'transfer',
  'debit',
  'credit_purchase',
  'credit_cash_advance',
  'bitcoin',
  'crypto',
]);

export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

const CARD_DELIVERY_METHODS = ['credit_purchase', 'credit_cash_advance'];

export const familyLoanCreateSchema = z
  .object({
    person_name: z.string().min(1, 'Ingresa el nombre del deudor').max(100),
    relationship: z.string().max(100).optional(),
    original_amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
    currency: currencyCodeSchema,
    delivery_date: isoDateSchema,
    delivery_method: deliveryMethodSchema,
    origin_account_id: uuidSchema.optional(),
    origin_card_id: uuidSchema.optional(),
    category: z.string().max(50).optional(),
    agreed_payment_date: isoDateSchema.optional(),
    notes: z.string().max(2000).optional(),
    // Flujo B — vínculo retroactivo a un gasto ya registrado (opcional)
    existing_transaction_id: uuidSchema.optional(),
    linked_amount: moneyAmountSchema.optional(),
  })
  .refine((data) => !CARD_DELIVERY_METHODS.includes(data.delivery_method) || !!data.origin_card_id, {
    message: 'Selecciona la tarjeta usada',
    path: ['origin_card_id'],
  })
  .refine(
    (data) => CARD_DELIVERY_METHODS.includes(data.delivery_method) || !!data.existing_transaction_id || !!data.origin_account_id,
    { message: 'Selecciona la cuenta de origen', path: ['origin_account_id'] },
  );

export type FamilyLoanCreateInput = z.infer<typeof familyLoanCreateSchema>;

export const familyLoanUpdateSchema = z.object({
  person_name: z.string().min(1, 'Ingresa el nombre del deudor').max(100),
  relationship: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  agreed_payment_date: isoDateSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export type FamilyLoanUpdateInput = z.infer<typeof familyLoanUpdateSchema>;

export const familyLoanPaymentCreateSchema = z.object({
  amount: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  payment_method: z.string().max(50).optional(),
  destination_account_id: uuidSchema,
  paid_at: isoDateSchema,
  notes: z.string().max(2000).optional(),
});

export type FamilyLoanPaymentCreateInput = z.infer<typeof familyLoanPaymentCreateSchema>;
