import { notFound } from 'next/navigation';
import { DebtForm } from '../../nueva/debt-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditDebtPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: debt } = await supabase.from('debts').select('*').eq('id', id).single();
  if (!debt) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <DebtForm
        error={error}
        initialValues={{
          id: debt.id,
          name: debt.name,
          creditor: debt.creditor,
          type: debt.type,
          original_amount: String(debt.original_amount),
          current_balance: String(debt.current_balance),
          currency: debt.currency,
          interest_rate_annual: String(debt.interest_rate_annual),
          term_months: debt.term_months ? String(debt.term_months) : '',
          monthly_payment: debt.monthly_payment ? String(debt.monthly_payment) : '',
          start_date: debt.start_date,
          next_payment_date: debt.next_payment_date ?? '',
          next_payment_amount: debt.next_payment_amount ? String(debt.next_payment_amount) : '',
          notes: debt.notes ?? '',
          status: debt.status,
        }}
      />
    </div>
  );
}
