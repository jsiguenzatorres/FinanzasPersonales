import { notFound } from 'next/navigation';
import { IncomeForm } from '../../nueva/income-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditIncomePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: income }, { data: currencies }, { data: accounts }] = await Promise.all([
    supabase.from('income_entries').select('*').eq('id', id).is('deleted_at', null).single(),
    supabase.from('currencies').select('code, name').eq('is_active', true).order('code'),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
  ]);

  if (!income) notFound();

  return (
    <div className="mx-auto max-w-md">
      <IncomeForm
        currencies={currencies ?? []}
        accounts={accounts ?? []}
        error={error}
        initialValues={{
          id: income.id,
          type: income.type,
          source_name: income.source_name,
          gross_amount: String(income.gross_amount),
          net_amount: String(income.net_amount),
          currency: income.currency,
          income_date: income.income_date,
          account_id: income.account_id ?? '',
          is_collected: income.is_collected,
          expected_date: income.expected_date ?? undefined,
          notes: income.notes ?? undefined,
        }}
      />
    </div>
  );
}
