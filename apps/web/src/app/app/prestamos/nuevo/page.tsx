import { LoanForm } from './loan-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewFamilyLoanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; existing_transaction_id?: string }>;
}) {
  const { error, existing_transaction_id: existingTransactionId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: accounts }, { data: currencies }, { data: cards }, existingTxResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
    supabase.from('currencies').select('code').eq('is_active', true).order('code'),
    supabase
      .from('credit_cards')
      .select('id, bank_name, card_name, currency')
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    existingTransactionId
      ? supabase
          .from('transactions')
          .select('id, amount, currency, merchant_name, description, transaction_date')
          .eq('id', existingTransactionId)
          .is('deleted_at', null)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const cardOptions = (cards ?? []).map((c) => ({
    id: c.id,
    label: `${c.bank_name} ${c.card_name}`,
    currency: c.currency,
  }));

  return (
    <div className="mx-auto max-w-md">
      <LoanForm
        accounts={accounts ?? []}
        cards={cardOptions}
        currencies={currencies ?? []}
        error={error}
        existingTransaction={existingTxResult.data ?? undefined}
      />
    </div>
  );
}
