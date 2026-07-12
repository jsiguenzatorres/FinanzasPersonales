import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';

/**
 * Suma gastos personales reales desde `fromDate`, excluyendo la porción de
 * cada transacción vinculada a un préstamo familiar (family_loans.linked_amount,
 * o el monto completo si linked_amount es NULL) — mismo criterio que ya usa
 * update_budget_spent_for_loan_link() para el presupuesto. Sin esto, "Gastos
 * del mes" y la ejecución del presupuesto podían contradecirse: dinero
 * prestado a un familiar no es gasto propio.
 */
export async function computePersonalExpenseTotal(
  supabase: SupabaseClient<Database>,
  userId: string,
  fromDate: string,
): Promise<number> {
  const { data: expenses } = await supabase
    .from('transactions')
    .select('id, amount')
    .eq('user_id', userId)
    .eq('kind', 'expense')
    .is('deleted_at', null)
    .gte('transaction_date', fromDate);

  if (!expenses || expenses.length === 0) return 0;

  const { data: loanLinks } = await supabase
    .from('family_loans')
    .select('transaction_id, linked_amount')
    .in(
      'transaction_id',
      expenses.map((e) => e.id),
    );

  const excludedByTx = new Map((loanLinks ?? []).map((l) => [l.transaction_id, l.linked_amount]));

  return expenses.reduce((sum, e) => {
    if (excludedByTx.has(e.id)) {
      const linked = excludedByTx.get(e.id);
      return sum + (e.amount - (linked ?? e.amount));
    }
    return sum + e.amount;
  }, 0);
}
