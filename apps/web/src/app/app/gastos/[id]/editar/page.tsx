import { notFound } from 'next/navigation';
import { ExpenseForm } from '../../nuevo/expense-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: expense }, { data: rawCategories }, { data: accounts }, { data: currencies }, { data: cards }] =
    await Promise.all([
      supabase.from('transactions').select('*').eq('id', id).is('deleted_at', null).single(),
      supabase
        .from('categories')
        .select('id, name, parent_id')
        .is('archived_at', null)
        .not('parent_id', 'is', null),
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
    ]);

  if (!expense) notFound();

  const parentIds = Array.from(
    new Set((rawCategories ?? []).map((c) => c.parent_id).filter((id): id is string => !!id)),
  );

  const { data: parents } =
    parentIds.length > 0
      ? await supabase.from('categories').select('id, name').in('id', parentIds)
      : { data: [] as { id: string; name: string }[] };

  const parentMap = new Map((parents ?? []).map((p) => [p.id, p.name]));

  const categories = (rawCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    groupName: (c.parent_id && parentMap.get(c.parent_id)) || 'Otros',
  }));

  const cardOptions = (cards ?? []).map((c) => ({
    id: c.id,
    label: `${c.bank_name} ${c.card_name}`,
    currency: c.currency,
  }));

  return (
    <div className="mx-auto max-w-md">
      <ExpenseForm
        categories={categories}
        accounts={accounts ?? []}
        cards={cardOptions}
        currencies={currencies ?? []}
        error={error}
        initialValues={{
          id: expense.id,
          merchant_name: expense.merchant_name ?? '',
          description: expense.description ?? '',
          amount: String(expense.amount),
          currency: expense.currency,
          transaction_date: expense.transaction_date,
          category_id: expense.category_id ?? '',
          payment_method: expense.card_id ? 'card' : 'account',
          account_id: expense.account_id ?? undefined,
          card_id: expense.card_id ?? undefined,
          receipt_url: expense.receipt_url ?? undefined,
        }}
      />
    </div>
  );
}
