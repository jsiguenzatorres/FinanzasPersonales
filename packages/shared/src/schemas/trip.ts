import { z } from 'zod';
import { currencyCodeSchema, isoDateSchema, moneyAmountSchema, uuidSchema } from './common';

export const tripStatusSchema = z.enum(['planning', 'active', 'completed', 'cancelled']);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const tripPreferenceSchema = z.enum([
  'playas',
  'naturaleza',
  'museos_cultura',
  'gastronomia',
  'vida_nocturna',
  'aventura',
  'compras',
  'relajacion',
]);
export type TripPreference = z.infer<typeof tripPreferenceSchema>;

export const tripCreateSchema = z
  .object({
    destination: z.string().min(1, 'Ingresa el destino').max(150),
    destination_country: z.string().max(2).optional(),
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    travelers_count: z.number().int().min(1).max(50),
    budget: moneyAmountSchema.refine((v) => v > 0, { message: 'El presupuesto debe ser mayor a 0' }),
    budget_currency: currencyCodeSchema,
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'La fecha de fin no puede ser antes que la de inicio',
    path: ['end_date'],
  });

export type TripCreateInput = z.infer<typeof tripCreateSchema>;

export const tripUpdateSchema = tripCreateSchema.and(
  z.object({ status: tripStatusSchema.optional() }),
);

export type TripUpdateInput = z.infer<typeof tripUpdateSchema>;

export const tripExpenseCreateSchema = z.object({
  trip_id: uuidSchema,
  category: z.enum(['transport', 'lodging', 'food', 'activities', 'shopping', 'fees', 'insurance', 'other']),
  description: z.string().min(1, 'Ingresa una descripción').max(300),
  amount_local: moneyAmountSchema.refine((v) => v > 0, { message: 'El monto debe ser mayor a 0' }),
  currency_local: currencyCodeSchema,
  expense_date: isoDateSchema,
  notes: z.string().max(2000).optional(),
});

export type TripExpenseCreateInput = z.infer<typeof tripExpenseCreateSchema>;

export const generateItineraryInputSchema = z.object({
  trip_id: uuidSchema,
  preferences: z.array(tripPreferenceSchema).min(1, 'Elige al menos una preferencia'),
});

export type GenerateItineraryInput = z.infer<typeof generateItineraryInputSchema>;
