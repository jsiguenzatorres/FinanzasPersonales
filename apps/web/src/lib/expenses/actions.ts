'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { expenseCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createExpenseAction(formData: FormData) {
  const paymentMethod = formData.get('payment_method');
  const accountId = formData.get('account_id');
  const cardId = formData.get('card_id');

  const raw = {
    amount: Number(formData.get('amount')),
    currency: formData.get('currency'),
    transaction_date: formData.get('transaction_date'),
    account_id: paymentMethod === 'account' ? accountId || undefined : undefined,
    card_id: paymentMethod === 'card' ? cardId || undefined : undefined,
    category_id: formData.get('category_id') || undefined,
    merchant_name: formData.get('merchant_name') || undefined,
    description: formData.get('description') || undefined,
    notes: formData.get('notes') || undefined,
    receipt_url: formData.get('receipt_url') || undefined,
  };

  const parsed = expenseCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/gastos/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const kind = parsed.data.card_id ? 'cc_charge' : 'expense';

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: parsed.data.account_id ?? null,
    card_id: parsed.data.card_id ?? null,
    category_id: parsed.data.category_id ?? null,
    kind,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    transaction_date: parsed.data.transaction_date,
    merchant_name: parsed.data.merchant_name ?? null,
    description: parsed.data.description ?? null,
    notes: parsed.data.notes ?? null,
    receipt_url: parsed.data.receipt_url ?? null,
    capture_source: parsed.data.receipt_url ? 'ocr_receipt' : 'manual',
  });

  if (error) {
    redirect('/app/gastos/nuevo?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/gastos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app/tarjetas');
  revalidatePath('/app');
  redirect('/app/gastos');
}

export async function editExpenseAction(formData: FormData) {
  const expenseId = formData.get('expense_id');
  if (typeof expenseId !== 'string') return;

  const paymentMethod = formData.get('payment_method');
  const accountId = formData.get('account_id');
  const cardId = formData.get('card_id');

  const raw = {
    amount: Number(formData.get('amount')),
    currency: formData.get('currency'),
    transaction_date: formData.get('transaction_date'),
    account_id: paymentMethod === 'account' ? accountId || undefined : undefined,
    card_id: paymentMethod === 'card' ? cardId || undefined : undefined,
    category_id: formData.get('category_id') || undefined,
    merchant_name: formData.get('merchant_name') || undefined,
    description: formData.get('description') || undefined,
    notes: formData.get('notes') || undefined,
    receipt_url: formData.get('receipt_url') || undefined,
  };

  const parsed = expenseCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/gastos/${expenseId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const kind = parsed.data.card_id ? 'cc_charge' : 'expense';

  const { error } = await supabase
    .from('transactions')
    .update({
      account_id: parsed.data.account_id ?? null,
      card_id: parsed.data.card_id ?? null,
      category_id: parsed.data.category_id ?? null,
      kind,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      transaction_date: parsed.data.transaction_date,
      merchant_name: parsed.data.merchant_name ?? null,
      description: parsed.data.description ?? null,
      notes: parsed.data.notes ?? null,
      receipt_url: parsed.data.receipt_url ?? null,
    })
    .eq('id', expenseId);

  if (error) {
    redirect(`/app/gastos/${expenseId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/gastos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app/tarjetas');
  revalidatePath('/app');
  redirect(`/app/gastos/${expenseId}`);
}

export async function deleteExpenseAction(formData: FormData) {
  const txId = formData.get('transaction_id');
  if (typeof txId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', txId);

  revalidatePath('/app/gastos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app/tarjetas');
  revalidatePath('/app');
}
