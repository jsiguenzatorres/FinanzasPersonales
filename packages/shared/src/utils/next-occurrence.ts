/**
 * Próxima fecha (ISO) en que cae `dayOfMonth` a partir de `fromDate` — si ya
 * pasó este mes, salta al siguiente. Usado por MOD-20 Calendario Maestro
 * para tarjetas de crédito (payment_due_day no es una fecha, es solo el día).
 */
export function nextOccurrenceOfDayOfMonth(dayOfMonth: number, fromDate: Date = new Date()): string {
  const year = fromDate.getUTCFullYear();
  const month = fromDate.getUTCMonth();
  const today = fromDate.getUTCDate();

  const daysInCurrentMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedThisMonth = Math.min(dayOfMonth, daysInCurrentMonth);

  if (clampedThisMonth >= today) {
    return new Date(Date.UTC(year, month, clampedThisMonth)).toISOString().slice(0, 10);
  }

  const daysInNextMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const clampedNextMonth = Math.min(dayOfMonth, daysInNextMonth);
  return new Date(Date.UTC(year, month + 1, clampedNextMonth)).toISOString().slice(0, 10);
}
