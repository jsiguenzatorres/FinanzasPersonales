import { z } from 'zod';

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Debe ser código ISO 4217 en mayúsculas');

export const moneyAmountSchema = z
  .number()
  .nonnegative('El monto no puede ser negativo')
  .multipleOf(0.01, 'Máximo 2 decimales');

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD');

export const uuidSchema = z.string().uuid();

export const moneyClassSchema = z.enum(['need', 'want', 'savings_debt']);
