import { GoalForm } from './goal-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMySpaces } from '@/lib/collab/get-my-spaces';

export default async function NewGoalPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: profile }, spaces] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name')
      .eq('is_archived', false)
      .order('name'),
    supabase.from('users').select('currency_default').eq('id', user!.id).single(),
    getMySpaces(),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <GoalForm accounts={accounts ?? []} currency={profile?.currency_default ?? 'USD'} spaces={spaces} />
    </div>
  );
}
