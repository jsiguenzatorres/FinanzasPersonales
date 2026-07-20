import { notFound } from 'next/navigation';
import { GoalForm } from '../../nueva/goal-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditGoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: goal }, { data: accounts }] = await Promise.all([
    supabase.from('goals').select('*').eq('id', id).single(),
    supabase.from('accounts').select('id, name').eq('is_archived', false).order('name'),
  ]);

  if (!goal) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <GoalForm
        accounts={accounts ?? []}
        currency={goal.currency}
        error={error}
        initialValues={{
          id: goal.id,
          name: goal.name,
          description: goal.description ?? '',
          target_amount: String(goal.target_amount),
          account_id: goal.account_id ?? '',
          target_date: goal.target_date ?? '',
          monthly_contribution: goal.monthly_contribution ? String(goal.monthly_contribution) : '',
          auto_contribution_pct: goal.auto_contribution_pct ? String(goal.auto_contribution_pct) : '',
          priority: goal.priority ? String(goal.priority) : '5',
          status: goal.status,
        }}
      />
    </div>
  );
}
