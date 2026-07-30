import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';
import { nextOccurrenceOfDayOfMonth } from '@flowfinance/shared/utils';

export type CalendarEventType =
  | 'income'
  | 'recurring'
  | 'card_payment'
  | 'subscription'
  | 'debt'
  | 'loan_portfolio'
  | 'family_loan'
  | 'goal_deadline';

export interface CalendarEvent {
  date: string;
  type: CalendarEventType;
  title: string;
  amount: number | null;
  currency: string;
  href: string;
}

const WINDOW_DAYS = 60;

/**
 * Junta las 8 fuentes de eventos financieros con fecha (§1.2 de
 * docs/modules/mod-20-calendario-maestro.md) en una sola lista ordenada.
 * Ninguna de estas queries es nueva lógica de negocio — solo lee lo que ya
 * existe en cada módulo y lo normaliza a una forma común.
 */
export async function getUpcomingCalendarEvents(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CalendarEvent[]> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + WINDOW_DAYS);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);

  const [
    { data: pendingIncome },
    { data: recurrings },
    { data: cards },
    { data: subscriptions },
    { data: debts },
    { data: activeLoanPortfolio },
    { data: familyLoans },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from('income_entries')
      .select('source_name, net_amount, currency, expected_date')
      .eq('user_id', userId)
      .eq('is_collected', false)
      .is('deleted_at', null)
      .not('expected_date', 'is', null)
      .lte('expected_date', windowEndStr),
    supabase
      .from('recurrings')
      .select('id, name, amount, currency, next_run_date, kind')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_run_date', windowEndStr),
    supabase
      .from('credit_cards')
      .select('id, bank_name, card_name, payment_due_day, current_balance, currency')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('id, service_name, amount, currency, next_charge_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('next_charge_date', windowEndStr),
    supabase
      .from('debts')
      .select('id, name, next_payment_date, next_payment_amount, currency')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .not('next_payment_date', 'is', null)
      .lte('next_payment_date', windowEndStr),
    supabase
      .from('loan_portfolio')
      .select('id, borrower_name, currency, amortization')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('family_loans')
      .select('id, person_name, balance, currency, agreed_payment_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('agreed_payment_date', 'is', null)
      .lte('agreed_payment_date', windowEndStr),
    supabase
      .from('goals')
      .select('id, name, target_amount, currency, target_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .not('target_date', 'is', null)
      .lte('target_date', windowEndStr),
  ]);

  const events: CalendarEvent[] = [];

  for (const inc of pendingIncome ?? []) {
    events.push({
      date: inc.expected_date!,
      type: 'income',
      title: `Ingreso esperado: ${inc.source_name}`,
      amount: inc.net_amount,
      currency: inc.currency,
      href: '/app/ingresos',
    });
  }

  for (const rec of recurrings ?? []) {
    if (rec.next_run_date > windowEndStr) continue;
    events.push({
      date: rec.next_run_date,
      type: 'recurring',
      title: rec.name,
      amount: rec.amount,
      currency: rec.currency,
      href: '/app/gastos',
    });
  }

  for (const card of cards ?? []) {
    const dueDate = nextOccurrenceOfDayOfMonth(card.payment_due_day, today);
    if (dueDate > windowEndStr || card.current_balance <= 0) continue;
    events.push({
      date: dueDate,
      type: 'card_payment',
      title: `Pago de ${card.bank_name} ${card.card_name}`,
      amount: card.current_balance,
      currency: card.currency,
      href: '/app/tarjetas',
    });
  }

  for (const sub of subscriptions ?? []) {
    events.push({
      date: sub.next_charge_date,
      type: 'subscription',
      title: sub.service_name,
      amount: sub.amount,
      currency: sub.currency,
      href: `/app/suscripciones/${sub.id}`,
    });
  }

  for (const debt of debts ?? []) {
    events.push({
      date: debt.next_payment_date!,
      type: 'debt',
      title: `Pago de ${debt.name}`,
      amount: debt.next_payment_amount,
      currency: debt.currency,
      href: `/app/deudas/${debt.id}`,
    });
  }

  for (const loan of activeLoanPortfolio ?? []) {
    const schedule = (loan.amortization as unknown as Array<{ scheduled_date: string; payment: number }>) ?? [];
    const nextInstallment = schedule.find((i) => i.scheduled_date >= todayStr);
    if (!nextInstallment || nextInstallment.scheduled_date > windowEndStr) continue;
    events.push({
      date: nextInstallment.scheduled_date,
      type: 'loan_portfolio',
      title: `Cuota de ${loan.borrower_name}`,
      amount: nextInstallment.payment,
      currency: loan.currency,
      href: `/app/mi-cartera/${loan.id}`,
    });
  }

  for (const fl of familyLoans ?? []) {
    events.push({
      date: fl.agreed_payment_date!,
      type: 'family_loan',
      title: `${fl.person_name} te debe devolver`,
      amount: fl.balance,
      currency: fl.currency,
      href: `/app/prestamos/${fl.id}`,
    });
  }

  for (const goal of goals ?? []) {
    events.push({
      date: goal.target_date!,
      type: 'goal_deadline',
      title: `Fecha límite: ${goal.name}`,
      amount: goal.target_amount,
      currency: goal.currency,
      href: `/app/metas/${goal.id}`,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
