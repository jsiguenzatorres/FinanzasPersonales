import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';

function resolvePeriod(period: string): { start: string; end: string } {
  const now = new Date();

  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }

  if (period === 'last_30_days') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/**
 * Despacha y ejecuta una tool invocada por Gemini. Todas las queries usan el
 * cliente Supabase autenticado del usuario Y filtran explícitamente por
 * user_id como defensa en profundidad además de RLS.
 * Spec: docs/modules/mod-08-finn.md §5, §12.5 (seguridad crítica).
 */
export async function executeFinnTool(
  supabase: SupabaseClient<Database>,
  userId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (toolName) {
    case 'get_account_balances': {
      const { data } = await supabase
        .from('accounts')
        .select('name, type, balance, currency')
        .eq('user_id', userId)
        .eq('is_archived', false);
      return { accounts: data ?? [] };
    }

    case 'get_category_spending': {
      const categoryName = String(args.category_name ?? '');
      const period = String(args.period ?? 'current_month');
      const { start, end } = resolvePeriod(period);

      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .limit(1);

      if (!categories || categories.length === 0) {
        return { error: `No encontré la categoría "${categoryName}"` };
      }

      const categoryId = categories[0]!.id;
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .in('kind', ['expense', 'cc_charge'])
        .is('deleted_at', null)
        .gte('transaction_date', start)
        .lte('transaction_date', end);

      const spent = (txs ?? []).reduce((sum, t) => sum + t.amount, 0);
      return { category: categoryName, spent, period };
    }

    case 'get_budget_status': {
      const today = new Date().toISOString().slice(0, 10);
      const { data: budget } = await supabase
        .from('budgets')
        .select('id, mode, total_income_expected, total_allocated, period_start, period_end')
        .eq('user_id', userId)
        .lte('period_start', today)
        .gte('period_end', today)
        .maybeSingle();

      if (!budget) return { has_active_budget: false };

      const { data: cats } = await supabase
        .from('budget_categories')
        .select('spent_amount, status')
        .eq('budget_id', budget.id);

      const totalSpent = (cats ?? []).reduce((sum, c) => sum + c.spent_amount, 0);

      return {
        has_active_budget: true,
        mode: budget.mode,
        total_allocated: budget.total_allocated,
        total_spent: totalSpent,
        execution_pct:
          budget.total_allocated > 0 ? Math.round((totalSpent / budget.total_allocated) * 100) : 0,
        categories_over: (cats ?? []).filter((c) => c.status === 'over').length,
        categories_warning: (cats ?? []).filter((c) => c.status === 'warning').length,
      };
    }

    case 'get_recent_transactions': {
      const limit = Math.min(Number(args.limit ?? 10) || 10, 30);
      const { data } = await supabase
        .from('transactions')
        .select('amount, currency, merchant_name, description, transaction_date, kind')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false })
        .limit(limit);
      return { transactions: data ?? [] };
    }

    case 'get_net_worth': {
      const { data } = await supabase.from('v_net_worth_current').select('*').eq('user_id', userId).single();
      return (
        data ?? {
          total_assets: 0,
          total_liabilities: 0,
          net_worth: 0,
        }
      );
    }

    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}
