import { notFound } from 'next/navigation';
import { GoalForm } from '../../nueva/goal-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMySpaces } from '@/lib/collab/get-my-spaces';

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: goal }, { data: accounts }, spaces] = await Promise.all([
    supabase.from('goals').select('*').eq('id', id).single(),
    supabase.from('accounts').select('id, name').eq('is_archived', false).order('name'),
    getMySpaces(),
  ]);

  if (!goal) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <GoalForm
        accounts={accounts ?? []}
        currency={goal.currency}
        spaces={spaces}
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
          collab_space_id: goal.collab_space_id ?? undefined,
        }}
      />
    </div>
  );
}
