/**
 * Fuente única de verdad de precios y límites por plan de suscripción.
 * Espejo de docs/modules/mod-08-finn.md §8.1 y MD/FLOWFINANCE-SPEC.md §6 —
 * si cambian los números, cambian aquí primero y se propagan al resto del código.
 */
export type PlanTier = 'free' | 'starter' | 'pro' | 'elite';

export const PLAN_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'elite'];

export interface PlanLimits {
  /** Techo diario anti-abuso de mensajes a Neto. */
  finnMessagesPerDay: number;
  /** Techo mensual adicional (null = solo rige el techo diario). */
  finnMessagesPerMonth: number | null;
  /** Escaneos OCR de recibos por día. */
  ocrScansPerDay: number;
  /** Simulaciones de escenarios financieros por día. */
  finnSimulationsPerDay: number;
  attachments: {
    /** Cantidad total de archivos adjuntos que puede acumular el usuario. */
    maxCount: number;
    /** Bytes totales acumulados entre todos sus adjuntos. */
    maxTotalBytes: number;
  };
}

export interface PlanDefinition {
  tier: PlanTier;
  /** Nombre comercial del plan (marketing). */
  displayName: string;
  /** Nombre de la personalidad de Neto en este plan. */
  finnName: string;
  priceMonthlyUsd: number;
  /** Precio total anual, ya con el 20% de descuento aplicado. */
  priceAnnualUsd: number;
  limits: PlanLimits;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: 'free',
    displayName: 'Free',
    finnName: 'Neto Básico',
    priceMonthlyUsd: 0,
    priceAnnualUsd: 0,
    limits: {
      finnMessagesPerDay: 5,
      finnMessagesPerMonth: 15,
      ocrScansPerDay: 3,
      finnSimulationsPerDay: 0,
      attachments: { maxCount: 20, maxTotalBytes: 100 * 1024 * 1024 },
    },
  },
  starter: {
    tier: 'starter',
    displayName: 'Claridad Financiera',
    finnName: 'Tu Compañero',
    priceMonthlyUsd: 4.99,
    priceAnnualUsd: 47.9,
    limits: {
      finnMessagesPerDay: 5,
      finnMessagesPerMonth: 30,
      ocrScansPerDay: 30,
      finnSimulationsPerDay: 0,
      attachments: { maxCount: 100, maxTotalBytes: 500 * 1024 * 1024 },
    },
  },
  pro: {
    tier: 'pro',
    displayName: 'Control y Crecimiento',
    finnName: 'Tu Asesor Personal',
    priceMonthlyUsd: 11.99,
    priceAnnualUsd: 115.1,
    limits: {
      finnMessagesPerDay: 50,
      finnMessagesPerMonth: null,
      ocrScansPerDay: 300,
      finnSimulationsPerDay: 20,
      attachments: { maxCount: 500, maxTotalBytes: 2 * 1024 * 1024 * 1024 },
    },
  },
  elite: {
    tier: 'elite',
    displayName: 'Libertad Financiera',
    finnName: 'Tu Socio Estratégico',
    priceMonthlyUsd: 24.99,
    priceAnnualUsd: 239.9,
    limits: {
      finnMessagesPerDay: 100,
      finnMessagesPerMonth: null,
      ocrScansPerDay: 999_999,
      finnSimulationsPerDay: 999_999,
      attachments: { maxCount: 2000, maxTotalBytes: 10 * 1024 * 1024 * 1024 },
    },
  },
};

export function getPlanLimits(plan: string | null | undefined): PlanDefinition {
  return PLANS[plan as PlanTier] ?? PLANS.free;
}
