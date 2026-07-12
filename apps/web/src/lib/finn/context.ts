import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';

export interface FinnContextSnapshot {
  liquidity: { total_balance: number };
  budget: {
    has_active_budget: boolean;
    execution_pct?: number;
    categories_over?: number;
    categories_warning?: number;
  };
  net_worth: { total_assets: number; total_liabilities: number; net_worth: number };
  income_this_month: number;
  expenses_this_month: number;
  credit_cards: Array<{
    bank_name: string;
    card_name: string;
    utilization_pct: number;
    current_balance: number;
    credit_limit: number;
  }>;
}

/**
 * Construye el snapshot financiero que se inyecta en el system prompt de FINN
 * antes de cada llamada a Gemini. Principio no negociable: FINN nunca recibe
 * una pregunta sin este contexto (spec §1.1).
 *
 * Todas las queries filtran explícitamente por user_id como defensa en
 * profundidad, además de RLS (nunca confiar solo en una capa de seguridad).
 *
 * Cobertura MVP: solo módulos ya implementados (cuentas, presupuesto,
 * transacciones, tarjetas, patrimonio). Metas, préstamos familiares e
 * inversiones se agregan cuando existan esos módulos (Fase 2).
 */
export async function buildFinnContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FinnContextSnapshot> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startStr = startOfMonth.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: accounts },
    { data: budget },
    { data: netWorth },
    { data: incomes },
    { data: expenses },
    { data: cards },
  ] = await Promise.all([
    supabase.from('accounts').select('balance').eq('user_id', userId).eq('is_archived', false),
    supabase
      .from('budgets')
      .select('id, total_allocated')
      .eq('user_id', userId)
      .lte('period_start', today)
      .gte('period_end', today)
      .maybeSingle(),
    supabase.from('v_net_worth_current').select('*').eq('user_id', userId).single(),
    supabase
      .from('income_entries')
      .select('net_amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_collected', true)
      .gte('income_date', startStr),
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('kind', 'expense')
      .is('deleted_at', null)
      .gte('transaction_date', startStr),
    supabase
      .from('credit_cards')
      .select('bank_name, card_name, current_balance, credit_limit, utilization_pct')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  let budgetInfo: FinnContextSnapshot['budget'] = { has_active_budget: false };
  if (budget) {
    const { data: cats } = await supabase
      .from('budget_categories')
      .select('spent_amount, status')
      .eq('budget_id', budget.id);
    const spent = (cats ?? []).reduce((sum, c) => sum + c.spent_amount, 0);
    budgetInfo = {
      has_active_budget: true,
      execution_pct: budget.total_allocated > 0 ? (spent / budget.total_allocated) * 100 : 0,
      categories_over: (cats ?? []).filter((c) => c.status === 'over').length,
      categories_warning: (cats ?? []).filter((c) => c.status === 'warning').length,
    };
  }

  return {
    liquidity: { total_balance: (accounts ?? []).reduce((sum, a) => sum + a.balance, 0) },
    budget: budgetInfo,
    net_worth: {
      total_assets: netWorth?.total_assets ?? 0,
      total_liabilities: netWorth?.total_liabilities ?? 0,
      net_worth: netWorth?.net_worth ?? 0,
    },
    income_this_month: (incomes ?? []).reduce((sum, i) => sum + i.net_amount, 0),
    expenses_this_month: (expenses ?? []).reduce((sum, e) => sum + e.amount, 0),
    credit_cards: (cards ?? []).map((c) => ({
      bank_name: c.bank_name,
      card_name: c.card_name,
      utilization_pct: c.utilization_pct ?? 0,
      current_balance: c.current_balance,
      credit_limit: c.credit_limit,
    })),
  };
}
