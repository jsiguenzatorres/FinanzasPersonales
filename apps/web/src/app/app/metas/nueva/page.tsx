import { GoalForm } from './goal-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: profile }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name')
      .eq('is_archived', false)
      .order('name'),
    supabase.from('users').select('currency_default').eq('id', user!.id).single(),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <GoalForm accounts={accounts ?? []} currency={profile?.currency_default ?? 'USD'} error={error} />
    </div>
  );
}
