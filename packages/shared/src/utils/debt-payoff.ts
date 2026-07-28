export type PayoffStrategy = 'avalanche' | 'snowball';

export interface DebtPayoffInput {
  id: string;
  current_balance: number;
  /** Tasa anual en porcentaje, ej. 18 para 18%. */
  interest_rate_annual: number;
  monthly_payment: number;
}

export interface DebtPayoffResult {
  /** Orden de ataque calculado — ids en el orden que se les destina el extra. */
  order: string[];
  /**
   * null si las deudas nunca se pagan con el extra dado (los pagos mínimos no
   * cubren ni el interés de alguna deuda) — caso degenerado real, hay que
   * decírselo al usuario en vez de simular un número sin sentido.
   */
  months_to_freedom: number | null;
  total_interest_paid: number;
  payoff_month_by_debt: Record<string, number>;
}

const MAX_MONTHS = 600;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Simula mes a mes el pago de un conjunto de deudas bajo una estrategia —
 * bola de nieve (saldo más pequeño primero) o avalancha (tasa más alta
 * primero). El pago mínimo liberado de una deuda saldada se suma al monto
 * extra disponible para la siguiente (el efecto acumulativo real).
 * Ver docs/modules/mod-16-deudas-propias.md §3.
 */
export function simulateDebtPayoff(
  debts: DebtPayoffInput[],
  extraMonthly: number,
  strategy: PayoffStrategy,
): DebtPayoffResult {
  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche'
      ? b.interest_rate_annual - a.interest_rate_annual
      : a.current_balance - b.current_balance,
  );
  const order = sorted.map((d) => d.id);

  const balances = new Map(sorted.map((d) => [d.id, d.current_balance]));
  const payoffMonth: Record<string, number> = {};
  let totalInterest = 0;
  let extraPool = extraMonthly;
  let month = 0;

  while (month < MAX_MONTHS) {
    month++;
    let anyBalancePositive = false;

    for (const debt of sorted) {
      let balance = balances.get(debt.id)!;
      if (balance <= 0) continue;
      anyBalancePositive = true;

      const monthlyInterest = round2(balance * (debt.interest_rate_annual / 100 / 12));
      balance = round2(balance + monthlyInterest);
      totalInterest = round2(totalInterest + monthlyInterest);

      const payment = Math.min(debt.monthly_payment, balance);
      balance = round2(balance - payment);

      if (balance <= 0 && payoffMonth[debt.id] === undefined) {
        payoffMonth[debt.id] = month;
        extraPool = round2(extraPool + debt.monthly_payment);
      }

      balances.set(debt.id, balance);
    }

    if (!anyBalancePositive) break;

    // El extra completo va a la primera deuda de la lista que aún tenga saldo.
    const target = sorted.find((d) => balances.get(d.id)! > 0);
    if (target && extraPool > 0) {
      let balance = balances.get(target.id)!;
      const extraPayment = Math.min(extraPool, balance);
      balance = round2(balance - extraPayment);
      balances.set(target.id, balance);
      if (balance <= 0 && payoffMonth[target.id] === undefined) {
        payoffMonth[target.id] = month;
        extraPool = round2(extraPool + target.monthly_payment);
      }
    }

    // Caso degenerado: si nadie bajó de saldo en todo un año, los mínimos no
    // cubren ni el interés — no tiene sentido seguir simulando 50 años.
    if (month === 12) {
      const anyReducing = sorted.some((d) => {
        const initial = debts.find((x) => x.id === d.id)!.current_balance;
        return balances.get(d.id)! < initial || payoffMonth[d.id] !== undefined;
      });
      if (!anyReducing) {
        return { order, months_to_freedom: null, total_interest_paid: totalInterest, payoff_month_by_debt: payoffMonth };
      }
    }
  }

  const allPaidOff = sorted.every((d) => balances.get(d.id)! <= 0);

  return {
    order,
    months_to_freedom: allPaidOff ? month : null,
    total_interest_paid: totalInterest,
    payoff_month_by_debt: payoffMonth,
  };
}
