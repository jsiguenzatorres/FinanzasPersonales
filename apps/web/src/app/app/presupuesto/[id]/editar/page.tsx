import { notFound } from 'next/navigation';
import { BudgetForm } from '../../nuevo/budget-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: budget }, { data: budgetCategories }, { data: allCategories }] = await Promise.all([
    supabase.from('budgets').select('*').eq('id', id).single(),
    supabase.from('budget_categories').select('category_id, allocated_amount').eq('budget_id', id),
    supabase.from('categories').select('id, name, icon, parent_id').is('archived_at', null),
  ]);

  if (!budget) notFound();

  const parentCategories = (allCategories ?? []).filter((c) => !c.parent_id);
  const childToParent = new Map(
    (allCategories ?? []).filter((c) => c.parent_id).map((c) => [c.id, c.parent_id as string]),
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

  const allocations = Object.fromEntries(
    (budgetCategories ?? []).map((bc) => [bc.category_id, String(bc.allocated_amount)]),
  );

  return (
    <div className="mx-auto max-w-lg">
      <BudgetForm
        categories={categories}
        suggestedIncome={budget.total_income_expected}
        error={error}
        initialValues={{
          id: budget.id,
          mode: budget.mode,
          total_income_expected: String(budget.total_income_expected),
          allocations,
        }}
      />
    </div>
  );
}
