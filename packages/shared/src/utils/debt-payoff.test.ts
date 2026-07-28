import { describe, it, expect } from 'vitest';
import { simulateDebtPayoff } from './debt-payoff';

describe('simulateDebtPayoff — avalancha (tasa más alta primero)', () => {
  it('ordena por tasa de interés descendente', () => {
    const result = simulateDebtPayoff(
      [
        { id: 'a', current_balance: 1000, interest_rate_annual: 10, monthly_payment: 100 },
        { id: 'b', current_balance: 500, interest_rate_annual: 25, monthly_payment: 50 },
        { id: 'c', current_balance: 2000, interest_rate_annual: 15, monthly_payment: 100 },
      ],
      200,
      'avalanche',
    );
    expect(result.order).toEqual(['b', 'c', 'a']);
  });

  it('todas las deudas quedan pagadas con suficiente extra mensual', () => {
    const result = simulateDebtPayoff(
      [
        { id: 'a', current_balance: 1000, interest_rate_annual: 12, monthly_payment: 100 },
        { id: 'b', current_balance: 500, interest_rate_annual: 20, monthly_payment: 50 },
      ],
      300,
      'avalanche',
    );
    expect(result.months_to_freedom).not.toBeNull();
    expect(result.payoff_month_by_debt['a']).toBeDefined();
    expect(result.payoff_month_by_debt['b']).toBeDefined();
  });
});

describe('simulateDebtPayoff — bola de nieve (saldo más pequeño primero)', () => {
  it('ordena por saldo ascendente', () => {
    const result = simulateDebtPayoff(
      [
        { id: 'a', current_balance: 3000, interest_rate_annual: 15, monthly_payment: 100 },
        { id: 'b', current_balance: 500, interest_rate_annual: 8, monthly_payment: 50 },
        { id: 'c', current_balance: 1500, interest_rate_annual: 20, monthly_payment: 80 },
      ],
      200,
      'snowball',
    );
    expect(result.order).toEqual(['b', 'c', 'a']);
  });

  it('la deuda más pequeña se paga primero, no la de mayor tasa', () => {
    const result = simulateDebtPayoff(
      [
        { id: 'small-low-rate', current_balance: 200, interest_rate_annual: 5, monthly_payment: 50 },
        { id: 'big-high-rate', current_balance: 5000, interest_rate_annual: 25, monthly_payment: 150 },
      ],
      300,
      'snowball',
    );
    expect(result.payoff_month_by_debt['small-low-rate']).toBeLessThan(
      result.payoff_month_by_debt['big-high-rate']!,
    );
  });
});

describe('simulateDebtPayoff — comparación avalancha vs. bola de nieve', () => {
  it('avalancha paga igual o menos interés total que bola de nieve para el mismo escenario', () => {
    const debts = [
      { id: 'a', current_balance: 2000, interest_rate_annual: 8, monthly_payment: 60 },
      { id: 'b', current_balance: 1000, interest_rate_annual: 24, monthly_payment: 40 },
      { id: 'c', current_balance: 3000, interest_rate_annual: 15, monthly_payment: 90 },
    ];
    const avalanche = simulateDebtPayoff(debts, 250, 'avalanche');
    const snowball = simulateDebtPayoff(debts, 250, 'snowball');

    expect(avalanche.total_interest_paid).toBeLessThanOrEqual(snowball.total_interest_paid);
  });
});

describe('simulateDebtPayoff — caso degenerado', () => {
  it('devuelve months_to_freedom null si el pago mínimo no cubre ni el interés', () => {
    const result = simulateDebtPayoff(
      [{ id: 'a', current_balance: 10000, interest_rate_annual: 36, monthly_payment: 10 }],
      0,
      'avalanche',
    );
    expect(result.months_to_freedom).toBeNull();
  });
});
