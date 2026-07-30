import { describe, it, expect } from 'vitest';
import { nextOccurrenceOfDayOfMonth } from './next-occurrence';

describe('nextOccurrenceOfDayOfMonth', () => {
  it('devuelve el día de este mes si todavía no ha pasado', () => {
    const result = nextOccurrenceOfDayOfMonth(20, new Date(Date.UTC(2026, 6, 10)));
    expect(result).toBe('2026-07-20');
  });

  it('salta al siguiente mes si el día ya pasó', () => {
    const result = nextOccurrenceOfDayOfMonth(5, new Date(Date.UTC(2026, 6, 10)));
    expect(result).toBe('2026-08-05');
  });

  it('devuelve hoy mismo si el día coincide', () => {
    const result = nextOccurrenceOfDayOfMonth(10, new Date(Date.UTC(2026, 6, 10)));
    expect(result).toBe('2026-07-10');
  });

  it('ajusta al último día del mes cuando el día no existe (31 en febrero)', () => {
    const result = nextOccurrenceOfDayOfMonth(31, new Date(Date.UTC(2027, 1, 5)));
    expect(result).toBe('2027-02-28');
  });
});
