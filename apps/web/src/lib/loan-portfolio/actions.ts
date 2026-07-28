'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  loanPortfolioCreateSchema,
  loanPortfolioUpdateSchema,
} from '@flowfinance/shared/schemas';
import { computeAmortization } from '@flowfinance/shared/utils';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@flowfinance/shared/types';

export async function createLoanPortfolioAction(formData: FormData) {
  const raw = {
    borrower_name: formData.get('borrower_name'),
    borrower_phone: formData.get('borrower_phone') || undefined,
    borrower_email: formData.get('borrower_email') || undefined,
    principal: Number(formData.get('principal')),
    currency: formData.get('currency'),
    interest_rate_monthly: Number(formData.get('interest_rate_monthly')),
    interest_type: formData.get('interest_type'),
    late_fee_rate: formData.get('late_fee_rate') ? Number(formData.get('late_fee_rate')) : undefined,
    term_months: Number(formData.get('term_months')),
    start_date: formData.get('start_date'),
    payment_day: Number(formData.get('payment_day')),
    account_id: formData.get('account_id') || undefined,
    notes: formData.get('notes') || undefined,
  };

  const parsed = loanPortfolioCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/mi-cartera/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const amortization = computeAmortization({
    principal: parsed.data.principal,
    interest_rate_monthly: parsed.data.interest_rate_monthly,
    term_months: parsed.data.term_months,
    interest_type: parsed.data.interest_type,
    start_date: parsed.data.start_date,
    payment_day: parsed.data.payment_day,
  });

  const { error } = await supabase.from('loan_portfolio').insert({
    user_id: user.id,
    account_id: parsed.data.account_id ?? null,
    borrower_name: parsed.data.borrower_name,
    borrower_phone: parsed.data.borrower_phone ?? null,
    borrower_email: parsed.data.borrower_email || null,
    principal: parsed.data.principal,
    currency: parsed.data.currency,
    interest_rate_monthly: parsed.data.interest_rate_monthly,
    interest_type: parsed.data.interest_type,
    late_fee_rate: parsed.data.late_fee_rate ?? 0,
    term_months: parsed.data.term_months,
    start_date: parsed.data.start_date,
    payment_day: parsed.data.payment_day,
    monthly_payment: amortization.monthly_payment,
    total_to_collect: amortization.total_to_collect,
    total_interest: amortization.total_interest,
    irr: amortization.irr,
    amortization: amortization.schedule as unknown as Json,
    balance_pending: parsed.data.principal,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect('/app/mi-cartera/nuevo?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/mi-cartera');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/mi-cartera');
}

/** Solo edita metadata — no recalcula la tabla de amortización (eso es reestructurar, fuera de v1). */
export async function editLoanPortfolioAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const raw = {
    borrower_name: formData.get('borrower_name'),
    borrower_phone: formData.get('borrower_phone') || undefined,
    borrower_email: formData.get('borrower_email') || undefined,
    notes: formData.get('notes') || undefined,
    status: formData.get('status') || undefined,
  };

  const parsed = loanPortfolioUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/mi-cartera/${loanId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('loan_portfolio')
    .update({
      borrower_name: parsed.data.borrower_name,
      borrower_phone: parsed.data.borrower_phone ?? null,
      borrower_email: parsed.data.borrower_email || null,
      notes: parsed.data.notes ?? null,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    })
    .eq('id', loanId);

  if (error) {
    redirect(`/app/mi-cartera/${loanId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/mi-cartera');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/mi-cartera/${loanId}`);
}

export async function deleteLoanPortfolioAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('loan_portfolio').update({ deleted_at: new Date().toISOString() }).eq('id', loanId);

  revalidatePath('/app/mi-cartera');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/mi-cartera');
}
