import type { InterestType } from '../schemas/loan-portfolio';

export interface AmortizationInstallment {
  installment_number: number;
  scheduled_date: string;
  payment: number;
  principal_portion: number;
  interest_portion: number;
  balance_after: number;
}

export interface AmortizationResult {
  monthly_payment: number;
  total_to_collect: number;
  total_interest: number;
  irr: number | null;
  schedule: AmortizationInstallment[];
}

export interface AmortizationParams {
  principal: number;
  /** Tasa mensual en porcentaje, ej. 2.5 para 2.5%. */
  interest_rate_monthly: number;
  term_months: number;
  interest_type: InterestType;
  start_date: string;
  /** Día del mes de cada cuota (1-31, se ajusta al último día del mes si no existe, ej. 31 en febrero). */
  payment_day: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Fecha de la cuota N, meses después de start_date, fija en payment_day (con ajuste de fin de mes). */
function installmentDate(startDate: string, monthsAhead: number, paymentDay: number): string {
  const [year, month] = startDate.split('-').map(Number) as [number, number];
  const targetMonthIndex = month - 1 + monthsAhead;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(paymentDay, daysInTargetMonth);
  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay)).toISOString().slice(0, 10);
}

/**
 * Genera la tabla de amortización completa de un préstamo con interés —
 * MOD-14 Mi Cartera. Ver docs/modules/mod-14-mi-cartera.md §2 para las
 * fórmulas. La última cuota absorbe el residuo de redondeo acumulado para
 * que la suma cuadre exacto contra el principal.
 */
export function computeAmortization(params: AmortizationParams): AmortizationResult {
  const { principal, interest_rate_monthly, term_months, interest_type, start_date, payment_day } = params;
  const r = interest_rate_monthly / 100;

  const schedule: AmortizationInstallment[] = [];
  let monthlyPayment: number;
  let totalInterest: number;
  let irr: number | null;

  if (interest_type === 'compound') {
    monthlyPayment =
      r === 0
        ? principal / term_months
        : (principal * r * Math.pow(1 + r, term_months)) / (Math.pow(1 + r, term_months) - 1);
    monthlyPayment = round2(monthlyPayment);
    irr = interest_rate_monthly;

    let balance = principal;
    let interestAccum = 0;
    for (let i = 1; i <= term_months; i++) {
      const interestPortion = round2(balance * r);
      let principalPortion = round2(monthlyPayment - interestPortion);
      if (i === term_months) principalPortion = balance;
      balance = round2(balance - principalPortion);
      interestAccum += interestPortion;
      schedule.push({
        installment_number: i,
        scheduled_date: installmentDate(start_date, i, payment_day),
        payment: round2(principalPortion + interestPortion),
        principal_portion: principalPortion,
        interest_portion: interestPortion,
        balance_after: balance,
      });
    }
    totalInterest = round2(interestAccum);
  } else {
    totalInterest = round2(principal * r * term_months);
    monthlyPayment = round2((principal + totalInterest) / term_months);
    irr = null;

    const principalPerInstallment = round2(principal / term_months);
    const interestPerInstallment = round2(totalInterest / term_months);

    let balance = principal;
    for (let i = 1; i <= term_months; i++) {
      let principalPortion = principalPerInstallment;
      if (i === term_months) principalPortion = balance;
      balance = round2(balance - principalPortion);
      schedule.push({
        installment_number: i,
        scheduled_date: installmentDate(start_date, i, payment_day),
        payment: round2(principalPortion + interestPerInstallment),
        principal_portion: principalPortion,
        interest_portion: interestPerInstallment,
        balance_after: balance,
      });
    }
  }

  return {
    monthly_payment: monthlyPayment,
    total_to_collect: round2(principal + totalInterest),
    total_interest: totalInterest,
    irr,
    schedule,
  };
}
