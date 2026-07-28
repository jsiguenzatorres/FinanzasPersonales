import { describe, it, expect } from 'vitest';
import { computeAmortization } from './amortization';

describe('computeAmortization — interés compuesto (sistema francés)', () => {
  it('genera 12 cuotas que suman exacto contra el principal', () => {
    const result = computeAmortization({
      principal: 1000,
      interest_rate_monthly: 2,
      term_months: 12,
      interest_type: 'compound',
      start_date: '2026-01-15',
      payment_day: 15,
    });

    expect(result.schedule).toHaveLength(12);
    const principalSum = result.schedule.reduce((sum, i) => sum + i.principal_portion, 0);
    expect(Math.round(principalSum * 100) / 100).toBeCloseTo(1000, 2);
    expect(result.schedule[11]!.balance_after).toBe(0);
  });

  it('la cuota mensual es constante (cuota fija)', () => {
    const result = computeAmortization({
      principal: 5000,
      interest_rate_monthly: 3,
      term_months: 6,
      interest_type: 'compound',
      start_date: '2026-01-01',
      payment_day: 1,
    });

    const payments = result.schedule.map((i) => i.payment);
    // Todas las cuotas deben ser iguales salvo redondeo de centavos.
    const uniquePayments = new Set(payments.map((p) => Math.round(p)));
    expect(uniquePayments.size).toBe(1);
  });

  it('irr es igual a la tasa mensual configurada', () => {
    const result = computeAmortization({
      principal: 1000,
      interest_rate_monthly: 2.5,
      term_months: 10,
      interest_type: 'compound',
      start_date: '2026-01-01',
      payment_day: 1,
    });
    expect(result.irr).toBe(2.5);
  });

  it('el interés baja en cada cuota conforme baja el saldo', () => {
    const result = computeAmortization({
      principal: 2000,
      interest_rate_monthly: 5,
      term_months: 4,
      interest_type: 'compound',
      start_date: '2026-01-01',
      payment_day: 1,
    });
    const interestPortions = result.schedule.map((i) => i.interest_portion);
    for (let i = 1; i < interestPortions.length; i++) {
      expect(interestPortions[i]!).toBeLessThan(interestPortions[i - 1]!);
    }
  });
});

describe('computeAmortization — interés simple (lineal)', () => {
  it('el interés y el capital son constantes en cada cuota', () => {
    const result = computeAmortization({
      principal: 1200,
      interest_rate_monthly: 2,
      term_months: 12,
      interest_type: 'simple',
      start_date: '2026-01-01',
      payment_day: 1,
    });

    const interestPortions = result.schedule.slice(0, -1).map((i) => i.interest_portion);
    const uniqueInterest = new Set(interestPortions);
    expect(uniqueInterest.size).toBe(1);
  });

  it('total_interest = principal * tasa * plazo', () => {
    const result = computeAmortization({
      principal: 1000,
      interest_rate_monthly: 3,
      term_months: 6,
      interest_type: 'simple',
      start_date: '2026-01-01',
      payment_day: 1,
    });
    // 1000 * 0.03 * 6 = 180
    expect(result.total_interest).toBe(180);
  });

  it('irr queda null (sin solver numérico en v1)', () => {
    const result = computeAmortization({
      principal: 1000,
      interest_rate_monthly: 3,
      term_months: 6,
      interest_type: 'simple',
      start_date: '2026-01-01',
      payment_day: 1,
    });
    expect(result.irr).toBeNull();
  });

  it('la suma de capital cuadra exacto contra el principal', () => {
    const result = computeAmortization({
      principal: 777,
      interest_rate_monthly: 1.5,
      term_months: 7,
      interest_type: 'simple',
      start_date: '2026-01-01',
      payment_day: 1,
    });
    const principalSum = result.schedule.reduce((sum, i) => sum + i.principal_portion, 0);
    expect(Math.round(principalSum * 100) / 100).toBeCloseTo(777, 2);
    expect(result.schedule[6]!.balance_after).toBe(0);
  });
});

describe('computeAmortization — fechas de cuota', () => {
  it('ajusta al último día del mes cuando payment_day no existe (ej. 31 en febrero)', () => {
    const result = computeAmortization({
      principal: 100,
      interest_rate_monthly: 1,
      term_months: 2,
      interest_type: 'simple',
      start_date: '2026-01-31',
      payment_day: 31,
    });
    // Febrero 2027 no tiene 31 — debe caer en el último día real del mes.
    expect(result.schedule[0]!.scheduled_date).toBe('2026-02-28');
  });
});
