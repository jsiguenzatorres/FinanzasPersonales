import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';
import { computePersonalExpenseTotal } from '@/lib/expenses/personal-spend';

export interface DashboardAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  actionLabel: string;
  actionHref: string;
}

const SEVERITY_ORDER: Record<DashboardAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Calcula alertas de salud financiera en tiempo real, sin depender de
 * `finn_insights` (esa tabla se llena vía triggers/cron que aún no existen —
 * Fase 0.7). Estas condiciones se computan directamente sobre datos ya
 * disponibles: presupuesto, tarjetas, liquidez.
 *
 * Reutilizable: esta misma lógica alimentará el "Top 5 Alertas" de MOD-08
 * FINN más adelante, sin duplicar código.
 */
export async function computeDashboardAlerts(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ─── Presupuesto ──────────────────────────────────────────────────────
  const { data: budget } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .lte('period_start', todayStr)
    .gte('period_end', todayStr)
    .maybeSingle();

  if (!budget) {
    alerts.push({
      severity: 'info',
      title: 'Aún no tienes presupuesto para este mes',
      actionLabel: 'Crear presupuesto',
      actionHref: '/app/presupuesto/nuevo',
    });
  } else {
    const { data: cats } = await supabase
      .from('budget_categories')
      .select('status')
      .eq('budget_id', budget.id);

    const over = (cats ?? []).filter((c) => c.status === 'over').length;
    const warning = (cats ?? []).filter((c) => c.status === 'warning').length;

    if (over > 0) {
      alerts.push({
        severity: 'critical',
        title: `${over} categoría${over === 1 ? '' : 's'} de presupuesto sobregirada${over === 1 ? '' : 's'}`,
        actionLabel: 'Ver presupuesto',
        actionHref: '/app/presupuesto',
      });
    }
    if (warning > 0) {
      alerts.push({
        severity: 'warning',
        title: `${warning} categoría${warning === 1 ? '' : 's'} cerca del límite`,
        actionLabel: 'Ver presupuesto',
        actionHref: '/app/presupuesto',
      });
    }
  }

  // ─── Tarjetas de crédito ──────────────────────────────────────────────
  const { data: cards } = await supabase
    .from('credit_cards')
    .select('bank_name, card_name, utilization_pct, payment_due_day, current_balance')
    .eq('user_id', userId)
    .eq('status', 'active');

  for (const card of cards ?? []) {
    const utilization = card.utilization_pct ?? 0;
    if (utilization >= 60) {
      alerts.push({
        severity: utilization >= 90 ? 'critical' : 'warning',
        title: `${card.bank_name} ${card.card_name} al ${Math.round(utilization)}% de utilización`,
        actionLabel: 'Ver tarjetas',
        actionHref: '/app/tarjetas',
      });
    }

    if (card.current_balance > 0) {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      let daysUntilDue = card.payment_due_day - today.getDate();
      if (daysUntilDue < 0) {
        daysUntilDue = daysInMonth - today.getDate() + card.payment_due_day;
      }
      if (daysUntilDue <= 3) {
        alerts.push({
          severity: daysUntilDue <= 1 ? 'critical' : 'warning',
          title: `${card.bank_name} ${card.card_name} vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}`,
          actionLabel: 'Registrar pago',
          actionHref: '/app/tarjetas',
        });
      }
    }
  }

  // ─── Préstamos familiares vencidos ─────────────────────────────────────
  const { data: overdueLoans } = await supabase
    .from('family_loans')
    .select('person_name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('agreed_payment_date', todayStr);

  if (overdueLoans && overdueLoans.length > 0) {
    alerts.push({
      severity: 'warning',
      title:
        overdueLoans.length === 1
          ? `${overdueLoans[0]!.person_name} no ha abonado su préstamo vencido`
          : `${overdueLoans.length} préstamos familiares vencidos sin abonar`,
      actionLabel: 'Ver préstamos',
      actionHref: '/app/prestamos',
    });
  }

  // ─── Liquidez vs. gasto promedio ──────────────────────────────────────
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .in('type', ['checking', 'savings', 'cash', 'digital_wallet']);

  const liquidBalance = (accounts ?? []).reduce((sum, a) => sum + a.balance, 0);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const pastExpensesTotal = await computePersonalExpenseTotal(
    supabase,
    userId,
    threeMonthsAgo.toISOString().slice(0, 10),
  );

  const avgMonthlyExpense = pastExpensesTotal / 3;

  if (avgMonthlyExpense > 0 && liquidBalance < avgMonthlyExpense * 0.5) {
    alerts.push({
      severity: 'warning',
      title: 'Tu liquidez está por debajo de medio mes de gasto promedio',
      actionLabel: 'Ver cuentas',
      actionHref: '/app/cuentas',
    });
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 5);
}
