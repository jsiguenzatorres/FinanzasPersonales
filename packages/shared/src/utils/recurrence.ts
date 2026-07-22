import type { RecurrenceFreq } from '../schemas/income';

/** Suma un periodo de `frequency` a una fecha ISO (YYYY-MM-DD), sin librerías de fechas. */
export function advanceByFrequency(isoDate: string, frequency: RecurrenceFreq): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  switch (frequency) {
    case 'daily':
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case 'weekly':
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case 'biweekly':
      date.setUTCDate(date.getUTCDate() + 14);
      break;
    case 'monthly':
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case 'bimonthly':
      date.setUTCMonth(date.getUTCMonth() + 2);
      break;
    case 'quarterly':
      date.setUTCMonth(date.getUTCMonth() + 3);
      break;
    case 'semiannual':
      date.setUTCMonth(date.getUTCMonth() + 6);
      break;
    case 'annual':
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }

  return date.toISOString().slice(0, 10);
}
