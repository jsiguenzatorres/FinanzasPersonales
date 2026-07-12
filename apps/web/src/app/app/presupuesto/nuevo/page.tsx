import { BudgetForm } from './budget-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, icon, parent_id')
    .is('archived_at', null);

  const parentCategories = (allCategories ?? []).filter((c) => !c.parent_id);
  const childToParent = new Map(
    (allCategories ?? [])
      .filter((c) => c.parent_id)
      .map((c) => [c.id, c.parent_id as string]),
  );

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: recentExpenses } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .in('kind', ['expense', 'cc_charge'])
    .is('deleted_at', null)
    .gte('transaction_date', threeMonthsAgo.toISOString().slice(0, 10));

  const spentByParent = new Map<string, number>();
  for (const tx of recentExpenses ?? []) {
    if (!tx.category_id) continue;
    const parentId = childToParent.get(tx.category_id) ?? tx.category_id;
    spentByParent.set(parentId, (spentByParent.get(parentId) ?? 0) + tx.amount);
  }

  const categories = parentCategories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    avgSpent: (spentByParent.get(c.id) ?? 0) / 3,
  }));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { data: monthIncomes } = await supabase
    .from('income_entries')
    .select('net_amount')
    .is('deleted_at', null)
    .eq('is_collected', true)
    .gte('income_date', startOfMonth.toISOString().slice(0, 10));

  const suggestedIncome = (monthIncomes ?? []).reduce((sum, i) => sum + i.net_amount, 0);

  return (
    <div className="mx-auto max-w-lg">
      <BudgetForm categories={categories} suggestedIncome={suggestedIncome} error={error} />
    </div>
  );
}
