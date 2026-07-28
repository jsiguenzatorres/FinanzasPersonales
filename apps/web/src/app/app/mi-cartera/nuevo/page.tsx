import { LoanPortfolioForm } from './loan-portfolio-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewLoanPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('is_archived', false)
    .order('name');

  return (
    <div className="mx-auto max-w-lg">
      <LoanPortfolioForm accounts={accounts ?? []} error={error} />
    </div>
  );
}
