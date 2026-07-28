'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { loanPortfolioPaymentCreateSchema } from '@flowfinance/shared/schemas';
import type { AmortizationInstallment } from '@flowfinance/shared/utils';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Registra un abono contra la SIGUIENTE cuota pendiente de la tabla de
 * amortización — no contra un balance libre como en Préstamos Familiares
 * (MOD-13). Calcula mora si la fecha de pago es posterior a la fecha
 * programada de esa cuota (§3 de docs/modules/mod-14-mi-cartera.md).
 */
export async function createLoanPortfolioPaymentAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const parsed = loanPortfolioPaymentCreateSchema.safeParse({
    loan_id: loanId,
    amount: Number(formData.get('amount')),
    payment_date: formData.get('payment_date'),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/mi-cartera/${loanId}?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: loan } = await supabase
    .from('loan_portfolio')
    .select('amortization, currency, late_fee_rate, amount_collected, late_count, days_late_total, term_months')
    .eq('id', loanId)
    .single();

  if (!loan) {
    redirect('/app/mi-cartera?error=' + encodeURIComponent('No se encontró el préstamo.'));
  }

  const { count: paidCount } = await supabase
    .from('loan_payments')
    .select('id', { count: 'exact', head: true })
    .eq('loan_id', loanId);

  const nextInstallmentIndex = paidCount ?? 0;
  const schedule = (loan!.amortization as unknown as AmortizationInstallment[]) ?? [];
  const installment = schedule[nextInstallmentIndex];

  if (!installment) {
    redirect(`/app/mi-cartera/${loanId}?error=` + encodeURIComponent('Ya no quedan cuotas pendientes.'));
  }

  const daysLate = Math.max(
    0,
    Math.round(
      (new Date(parsed.data.payment_date).getTime() - new Date(installment!.scheduled_date).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const lateFeeRate = loan!.late_fee_rate ?? 0;
  const lateFee = daysLate > 0 && lateFeeRate > 0 ? Math.round(installment!.payment * (lateFeeRate / 100) * 100) / 100 : 0;

  const { error } = await supabase.from('loan_payments').insert({
    user_id: user.id,
    loan_id: loanId,
    installment_number: installment!.installment_number,
    scheduled_date: installment!.scheduled_date,
    payment_date: parsed.data.payment_date,
    amount: installment!.payment + lateFee,
    currency: loan!.currency,
    principal_portion: installment!.principal_portion,
    interest_portion: installment!.interest_portion,
    late_fee: lateFee,
    days_late: daysLate,
    balance_after: installment!.balance_after,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect(`/app/mi-cartera/${loanId}?error=` + encodeURIComponent(error.message));
  }

  const isLastInstallment = nextInstallmentIndex === schedule.length - 1;

  await supabase
    .from('loan_portfolio')
    .update({
      amount_collected: (loan!.amount_collected ?? 0) + installment!.payment,
      balance_pending: installment!.balance_after,
      late_count: (loan!.late_count ?? 0) + (daysLate > 0 ? 1 : 0),
      days_late_total: (loan!.days_late_total ?? 0) + daysLate,
      ...(isLastInstallment ? { status: 'paid' as const } : {}),
    })
    .eq('id', loanId);

  revalidatePath('/app/mi-cartera');
  revalidatePath(`/app/mi-cartera/${loanId}`);
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/mi-cartera/${loanId}`);
}
