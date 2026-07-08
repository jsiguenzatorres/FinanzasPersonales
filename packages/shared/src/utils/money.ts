/**
 * Formato de dinero para visualización.
 * Default: es-SV locale, USD.
 */
export function formatMoney(
  amount: number,
  currency = 'USD',
  locale = 'es-SV',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Redondea a 2 decimales evitando errores de coma flotante.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Suma una lista de montos con seguridad de redondeo.
 */
export function sumMoney(amounts: number[]): number {
  return roundMoney(amounts.reduce((acc, n) => acc + n, 0));
}
