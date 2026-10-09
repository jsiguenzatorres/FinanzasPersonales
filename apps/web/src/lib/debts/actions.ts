'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { debtCreateSchema, debtUpdateSchema, debtPaymentCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseDebtForm(formData: FormData) {
  return {
    name: formData.get('name'),
    creditor: formData.get('creditor'),
    type: formData.get('type'),
    original_amount: Number(formData.get('original_amount')),
    current_balance: Number(formData.get('current_balance')),
    currency: formData.get('currency'),
    interest_rate_annual: Number(formData.get('interest_rate_annual')),
    term_months: formData.get('term_months') ? Number(formData.get('term_months')) : undefined,
    monthly_payment: formData.get('monthly_payment') ? Number(formData.get('monthly_payment')) : undefined,
    start_date: formData.get('start_date'),
    next_payment_date: formData.get('next_payment_date') || undefined,
    next_payment_amount: formData.get('next_payment_amount')
      ? Number(formData.get('next_payment_amount'))
      : undefined,
    notes: formData.get('notes') || undefined,
  };
}

export async function createDebtAction(formData: FormData) {
  const parsed = debtCreateSchema.safeParse(parseDebtForm(formData));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/deudas/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.from('debts').insert({
    user_id: user.id,
    name: parsed.data.name,
    creditor: parsed.data.creditor,
    type: parsed.data.type,
    original_amount: parsed.data.original_amount,
    current_balance: parsed.data.current_balance,
    currency: parsed.data.currency,
    interest_rate_annual: parsed.data.interest_rate_annual,
    term_months: parsed.data.term_months ?? null,
    monthly_payment: parsed.data.monthly_payment ?? null,
    start_date: parsed.data.start_date,
    next_payment_date: parsed.data.next_payment_date ?? null,
    next_payment_amount: parsed.data.next_payment_amount ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect('/app/deudas/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/deudas');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/deudas');
}

export async function editDebtAction(formData: FormData) {
  const debtId = formData.get('debt_id');
  if (typeof debtId !== 'string') return;

  const raw = { ...parseDebtForm(formData), status: formData.get('status') || undefined };
  const parsed = debtUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/deudas/${debtId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('debts')
    .update({
      name: parsed.data.name,
      creditor: parsed.data.creditor,
      type: parsed.data.type,
      original_amount: parsed.data.original_amount,
      current_balance: parsed.data.current_balance,
      currency: parsed.data.currency,
      interest_rate_annual: parsed.data.interest_rate_annual,
      term_months: parsed.data.term_months ?? null,
      monthly_payment: parsed.data.monthly_payment ?? null,
      start_date: parsed.data.start_date,
      next_payment_date: parsed.data.next_payment_date ?? null,
      next_payment_amount: parsed.data.next_payment_amount ?? null,
      notes: parsed.data.notes ?? null,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    })
    .eq('id', debtId);

  if (error) {
    redirect(`/app/deudas/${debtId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/deudas');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/deudas/${debtId}`);
}

export async function deleteDebtAction(formData: FormData) {
  const debtId = formData.get('debt_id');
  if (typeof debtId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('debts').update({ deleted_at: new Date().toISOString() }).eq('id', debtId);

  revalidatePath('/app/deudas');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/deudas');
}

/**
 * Registra un abono con estimación simple de interés/capital (§2 de
 * docs/modules/mod-16-deudas-propias.md) — sin tabla de amortización
 * pre-generada como en Mi Cartera (MOD-14).
 */
export async function createDebtPaymentAction(formData: FormData) {
  const debtId = formData.get('debt_id');
  if (typeof debtId !== 'string') return;

  const parsed = debtPaymentCreateSchema.safeParse({
    debt_id: debtId,
    amount: Number(formData.get('amount')),
    payment_date: formData.get('payment_date'),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/deudas/${debtId}?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: debt } = await supabase
    .from('debts')
    .select('current_balance, currency, interest_rate_annual, monthly_payment')
    .eq('id', debtId)
    .single();

  if (!debt) {
    redirect('/app/deudas?error=' + encodeURIComponent('No se encontró la deuda.'));
  }

  const interestPortion = Math.round(debt!.current_balance * (debt!.interest_rate_annual / 100 / 12) * 100) / 100;
  const principalPortion = Math.max(0, Math.round((parsed.data.amount - interestPortion) * 100) / 100);
  const newBalance = Math.max(0, Math.round((debt!.current_balance - principalPortion) * 100) / 100);
  const isExtra = debt!.monthly_payment != null && parsed.data.amount > debt!.monthly_payment;

  const { error } = await supabase.from('debt_payments').insert({
    user_id: user.id,
    debt_id: debtId,
    payment_date: parsed.data.payment_date,
    amount: parsed.data.amount,
    currency: debt!.currency,
    principal_portion: principalPortion,
    interest_portion: Math.min(interestPortion, parsed.data.amount),
    balance_after: newBalance,
    is_extra: isExtra,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect(`/app/deudas/${debtId}?error=` + encodeURIComponent(error.message));
  }

  await supabase
    .from('debts')
    .update({
      current_balance: newBalance,
      ...(newBalance <= 0 ? { status: 'paid' as const } : {}),
    })
    .eq('id', debtId);

  revalidatePath('/app/deudas');
  revalidatePath(`/app/deudas/${debtId}`);
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/deudas/${debtId}${newBalance <= 0 ? '?celebrate=1' : ''}`);
}
