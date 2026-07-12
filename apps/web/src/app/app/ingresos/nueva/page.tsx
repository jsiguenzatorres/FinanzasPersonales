import { IncomeForm } from './income-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewIncomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: currencies }, { data: accounts }] = await Promise.all([
    supabase.from('currencies').select('code, name').eq('is_active', true).order('code'),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <IncomeForm currencies={currencies ?? []} accounts={accounts ?? []} error={error} />
    </div>
  );
}
