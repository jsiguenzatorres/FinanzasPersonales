import { IncomeForm } from './income-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewIncomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: currencies }, { data: accounts }, { data: goals }] = await Promise.all([
    supabase.from('currencies').select('code, name').eq('is_active', true).order('code'),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('goals')
      .select('id, name, auto_contribution_pct')
      .eq('status', 'active')
      .is('deleted_at', null)
      .not('auto_contribution_pct', 'is', null)
      .gt('auto_contribution_pct', 0),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <IncomeForm
        currencies={currencies ?? []}
        accounts={accounts ?? []}
        goals={(goals ?? []).map((g) => ({ ...g, auto_contribution_pct: g.auto_contribution_pct ?? 0 }))}
        error={error}
      />
    </div>
  );
}
