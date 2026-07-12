import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';

/**
 * Tools de LECTURA que FINN puede invocar (function calling).
 * La implementación real vive en la app (apps/web/src/lib/finn/tools.ts)
 * porque necesita el cliente Supabase autenticado — aquí solo van los
 * schemas que Gemini necesita para decidir cuándo y cómo invocarlas.
 *
 * Spec: docs/modules/mod-08-finn.md §5 — MVP usa 5 de las 12 tools listadas
 * (las que ya tienen datos reales: cuentas, presupuesto, transacciones,
 * patrimonio). El resto se agrega conforme existan los módulos que las
 * alimentan (metas, préstamos familiares, etc. — Fase 2).
 */
export const FINN_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_account_balances',
    description: 'Obtiene el saldo de todas las cuentas activas del usuario (no incluye tarjetas de crédito).',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_category_spending',
    description: 'Obtiene el gasto acumulado en una categoría de presupuesto para un periodo dado.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category_name: {
          type: SchemaType.STRING,
          description: 'Nombre del grupo de categoría, ej. "Alimentación", "Transporte"',
        },
        period: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['current_month', 'last_month', 'last_30_days'],
        },
      },
      required: ['category_name', 'period'],
    },
  },
  {
    name: 'get_budget_status',
    description: 'Obtiene el estado del presupuesto activo del usuario para el mes actual: % ejecutado, categorías en rojo/amarillo.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_recent_transactions',
    description: 'Obtiene las transacciones (gastos e ingresos) más recientes del usuario.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: 'Cantidad máxima de resultados, por defecto 10, máximo 30',
        },
      },
    },
  },
  {
    name: 'get_net_worth',
    description: 'Obtiene el patrimonio neto actual del usuario (activos menos pasivos) con su desglose.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_family_loans',
    description:
      'Obtiene los préstamos familiares del usuario (dinero prestado a familia/amigos, sin interés): quién debe, cuánto, desde cuándo, y si está vencido.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['active', 'paid', 'written_off', 'all'],
          description: 'Filtro de estado, por defecto "active"',
        },
      },
    },
  },
];
