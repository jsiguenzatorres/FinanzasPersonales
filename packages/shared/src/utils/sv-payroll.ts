import { roundMoney } from './money';

/**
 * Cálculo de deducciones de planilla en El Salvador (empleado).
 * Tasas vigentes 2025-2026 según DGII / ISSS / Superintendencia de Pensiones.
 * IMPORTANTE: validar al desplegar — pueden cambiar por reforma fiscal.
 *
 * Salida en USD.
 *
 * Spec: docs/modules/mod-00-ingresos.md §4.2
 */

const ISSS_RATE = 0.03; // 3% empleado
const ISSS_CAP_MONTHLY_USD = 1_000; // techo mensual cotizable
const AFP_RATE = 0.0725; // 7.25% empleado
const AFP_CAP_MONTHLY_USD = 7_471.92; // techo mensual cotizable

interface IsrBracket {
  min: number;
  max: number; // Infinity para el último
  rate: number;
  fixed: number; // monto fijo a sumar antes del % sobre exceso
}

/**
 * Tabla ISR mensual para personas naturales asalariadas (USD).
 * Fuente: art. 37 Ley de Impuesto sobre la Renta, vigente.
 */
const ISR_BRACKETS_MONTHLY: IsrBracket[] = [
  { min: 0, max: 472, rate: 0, fixed: 0 },
  { min: 472.01, max: 895.24, rate: 0.1, fixed: 17.67 },
  { min: 895.25, max: 2_038.1, rate: 0.2, fixed: 60.0 },
  { min: 2_038.11, max: Infinity, rate: 0.3, fixed: 288.57 },
];

export interface SvPayrollResult {
  isss: number;
  afp: number;
  isr: number;
  taxableBase: number;
  totalDeductions: number;
  netAmount: number;
}

export function calculateSvPayrollDeductions(grossMonthly: number): SvPayrollResult {
  // ISSS: 3% sobre min(salario, tope)
  const isssBase = Math.min(grossMonthly, ISSS_CAP_MONTHLY_USD);
  const isss = roundMoney(isssBase * ISSS_RATE);

  // AFP: 7.25% sobre min(salario, tope)
  const afpBase = Math.min(grossMonthly, AFP_CAP_MONTHLY_USD);
  const afp = roundMoney(afpBase * AFP_RATE);

  // ISR sobre (salario - ISSS - AFP)
  const taxableBase = roundMoney(grossMonthly - isss - afp);
  const isr = calculateIsr(taxableBase);

  const totalDeductions = roundMoney(isss + afp + isr);
  const netAmount = roundMoney(grossMonthly - totalDeductions);

  return { isss, afp, isr, taxableBase, totalDeductions, netAmount };
}

function calculateIsr(taxableBase: number): number {
  if (taxableBase <= 0) return 0;
  const bracket = ISR_BRACKETS_MONTHLY.find(
    (b) => taxableBase >= b.min && taxableBase <= b.max,
  );
  if (!bracket || bracket.rate === 0) return 0;

  const lowerBound = bracket.min - 0.01; // umbral inferior real
  const excess = taxableBase - lowerBound;
  return roundMoney(bracket.fixed + excess * bracket.rate);
}
