'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { creditCardCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createCreditCardAction(formData: FormData) {
  const raw = {
    bank_name: formData.get('bank_name'),
    card_name: formData.get('card_name'),
    card_brand: formData.get('card_brand') || undefined,
    card_number_mask: formData.get('card_number_mask') || undefined,
    currency: formData.get('currency'),
    credit_limit: Number(formData.get('credit_limit')),
    current_balance: Number(formData.get('current_balance') || 0),
    cut_day: Number(formData.get('cut_day')),
    payment_due_day: Number(formData.get('payment_due_day')),
    interest_rate_annual_pct: Number(formData.get('interest_rate_annual_pct')),
    min_payment_pct: Number(formData.get('min_payment_pct') || 5),
  };

  const parsed = creditCardCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/tarjetas/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('credit_cards').insert({
    user_id: user.id,
    bank_name: parsed.data.bank_name,
    card_name: parsed.data.card_name,
    card_brand: parsed.data.card_brand ?? null,
    card_number_mask: parsed.data.card_number_mask ?? null,
    currency: parsed.data.currency,
    credit_limit: parsed.data.credit_limit,
    current_balance: parsed.data.current_balance,
    cut_day: parsed.data.cut_day,
    payment_due_day: parsed.data.payment_due_day,
    interest_rate_annual: parsed.data.interest_rate_annual_pct / 100,
    min_payment_pct: parsed.data.min_payment_pct,
  });

  if (error) {
    redirect('/app/tarjetas/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/tarjetas');
  revalidatePath('/app');
  redirect('/app/tarjetas');
}

export async function archiveCreditCardAction(formData: FormData) {
  const cardId = formData.get('card_id');
  if (typeof cardId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('credit_cards').update({ status: 'archived' }).eq('id', cardId);

  revalidatePath('/app/tarjetas');
}

export async function registerPaymentAction(formData: FormData) {
  const cardId = formData.get('card_id');
  const accountId = formData.get('account_id');
  const amount = Number(formData.get('amount'));
  const paymentDate = formData.get('payment_date');

  if (
    typeof cardId !== 'string' ||
    typeof accountId !== 'string' ||
    typeof paymentDate !== 'string' ||
    !amount ||
    amount <= 0
  ) {
    redirect(`/app/tarjetas/${cardId}/pago?error=` + encodeURIComponent('Datos de pago inválidos'));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: card } = await supabase
    .from('credit_cards')
    .select('currency')
    .eq('id', cardId as string)
    .single();

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: accountId,
    card_id: cardId,
    kind: 'cc_payment',
    amount,
    currency: card?.currency ?? 'USD',
    transaction_date: paymentDate,
    description: 'Pago de tarjeta',
    capture_source: 'manual',
  });

  if (error) {
    redirect(`/app/tarjetas/${cardId}/pago?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/tarjetas');
  revalidatePath('/app/cuentas');
  revalidatePath('/app');
  redirect('/app/tarjetas');
}
