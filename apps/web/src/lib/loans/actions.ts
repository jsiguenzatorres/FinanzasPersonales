'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  familyLoanCreateSchema,
  familyLoanUpdateSchema,
  familyLoanPaymentCreateSchema,
} from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CARD_DELIVERY_METHODS = ['credit_purchase', 'credit_cash_advance'];

export async function createFamilyLoanAction(formData: FormData) {
  const existingTxId = formData.get('existing_transaction_id');

  const raw = {
    person_name: formData.get('person_name'),
    relationship: formData.get('relationship') || undefined,
    original_amount: Number(formData.get('original_amount')),
    currency: formData.get('currency'),
    delivery_date: formData.get('delivery_date'),
    delivery_method: formData.get('delivery_method'),
    origin_account_id: formData.get('origin_account_id') || undefined,
    origin_card_id: formData.get('origin_card_id') || undefined,
    category: formData.get('category') || undefined,
    agreed_payment_date: formData.get('agreed_payment_date') || undefined,
    notes: formData.get('notes') || undefined,
    existing_transaction_id: existingTxId || undefined,
    linked_amount: formData.get('linked_amount') ? Number(formData.get('linked_amount')) : undefined,
  };

  const parsed = familyLoanCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/prestamos/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let transactionId: string;
  let linkedAmount: number | null = null;

  if (parsed.data.existing_transaction_id) {
    // Flujo B: vínculo retroactivo a un gasto ya registrado.
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id, amount, user_id')
      .eq('id', parsed.data.existing_transaction_id)
      .eq('user_id', user.id)
      .single();

    if (!existingTx) {
      redirect('/app/prestamos/nuevo?error=' + encodeURIComponent('No se encontró el gasto a vincular.'));
    }

    if (parsed.data.linked_amount && parsed.data.linked_amount > existingTx.amount) {
      redirect(
        '/app/prestamos/nuevo?error=' +
          encodeURIComponent('El monto vinculado no puede superar el monto del gasto original.'),
      );
    }

    transactionId = existingTx.id;
    linkedAmount = parsed.data.linked_amount ?? null;
  } else {
    // Flujo A: préstamo nuevo — se crea la transacción real detrás.
    const isCardDelivery = CARD_DELIVERY_METHODS.includes(parsed.data.delivery_method);
    const kind = parsed.data.delivery_method === 'credit_cash_advance' ? 'cc_cash_advance' : 'cc_charge';

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: isCardDelivery ? null : parsed.data.origin_account_id,
        card_id: isCardDelivery ? parsed.data.origin_card_id : null,
        category_id: null, // sin categoría: no es gasto personal, no debe contar en presupuesto
        kind: isCardDelivery ? kind : 'transfer_out',
        amount: parsed.data.original_amount,
        currency: parsed.data.currency,
        transaction_date: parsed.data.delivery_date,
        merchant_name: parsed.data.person_name,
        description: `Préstamo familiar — ${parsed.data.person_name}`,
        capture_source: 'manual',
      })
      .select('id')
      .single();

    if (txError || !tx) {
      redirect(
        '/app/prestamos/nuevo?error=' + encodeURIComponent(txError?.message ?? 'No se pudo registrar el movimiento.'),
      );
    }

    transactionId = tx!.id;
  }

  const { error: loanError } = await supabase.from('family_loans').insert({
    user_id: user.id,
    person_name: parsed.data.person_name,
    relationship: parsed.data.relationship ?? null,
    original_amount: parsed.data.original_amount,
    balance: parsed.data.original_amount,
    currency: parsed.data.currency,
    delivery_date: parsed.data.delivery_date,
    delivery_method: parsed.data.delivery_method,
    origin_account_id: parsed.data.origin_account_id ?? null,
    origin_card_id: parsed.data.origin_card_id ?? null,
    transaction_id: transactionId,
    linked_amount: linkedAmount,
    category: parsed.data.category ?? null,
    agreed_payment_date: parsed.data.agreed_payment_date ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (loanError) {
    redirect('/app/prestamos/nuevo?error=' + encodeURIComponent(loanError.message));
  }

  revalidatePath('/app/prestamos');
  revalidatePath('/app/gastos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app/tarjetas');
  revalidatePath('/app/presupuesto');
  revalidatePath('/app');
  redirect('/app/prestamos');
}

export async function editFamilyLoanAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const parsed = familyLoanUpdateSchema.safeParse({
    person_name: formData.get('person_name'),
    relationship: formData.get('relationship') || undefined,
    category: formData.get('category') || undefined,
    agreed_payment_date: formData.get('agreed_payment_date') || undefined,
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/prestamos/${loanId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('family_loans')
    .update({
      person_name: parsed.data.person_name,
      relationship: parsed.data.relationship ?? null,
      category: parsed.data.category ?? null,
      agreed_payment_date: parsed.data.agreed_payment_date ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', loanId);

  if (error) {
    redirect(`/app/prestamos/${loanId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/prestamos');
  redirect(`/app/prestamos/${loanId}`);
}

export async function writeOffFamilyLoanAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('family_loans').update({ status: 'written_off' }).eq('id', loanId);

  revalidatePath('/app/prestamos');
  revalidatePath('/app');
}

export async function deleteFamilyLoanAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  // La transacción real detrás del préstamo NO se borra — el dinero sí se
  // movió. Solo deja de trackearse como préstamo (vuelve a contar como
  // gasto normal vía el trigger de exclusión en family_loans).
  await supabase.from('family_loans').delete().eq('id', loanId);

  revalidatePath('/app/prestamos');
  revalidatePath('/app/gastos');
  revalidatePath('/app/presupuesto');
  revalidatePath('/app');
  redirect('/app/prestamos');
}

export async function createFamilyLoanPaymentAction(formData: FormData) {
  const loanId = formData.get('loan_id');
  if (typeof loanId !== 'string') return;

  const parsed = familyLoanPaymentCreateSchema.safeParse({
    amount: Number(formData.get('amount')),
    payment_method: formData.get('payment_method') || undefined,
    destination_account_id: formData.get('destination_account_id'),
    paid_at: formData.get('paid_at'),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/prestamos/${loanId}/abono?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: loan } = await supabase
    .from('family_loans')
    .select('id, balance, currency, person_name')
    .eq('id', loanId)
    .single();

  if (!loan) {
    redirect('/app/prestamos?error=' + encodeURIComponent('Préstamo no encontrado.'));
  }

  if (parsed.data.amount > loan!.balance) {
    redirect(
      `/app/prestamos/${loanId}/abono?error=` +
        encodeURIComponent('El abono no puede superar el saldo pendiente del préstamo.'),
    );
  }

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: parsed.data.destination_account_id,
      category_id: null,
      kind: 'income',
      amount: parsed.data.amount,
      currency: loan!.currency,
      transaction_date: parsed.data.paid_at,
      description: `Abono de préstamo — ${loan!.person_name}`,
      capture_source: 'manual',
    })
    .select('id')
    .single();

  if (txError || !tx) {
    redirect(
      `/app/prestamos/${loanId}/abono?error=` +
        encodeURIComponent(txError?.message ?? 'No se pudo registrar el abono.'),
    );
  }

  const resultingBalance = loan!.balance - parsed.data.amount;

  const { error: paymentError } = await supabase.from('family_loan_payments').insert({
    user_id: user.id,
    loan_id: loanId,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method ?? null,
    destination_account_id: parsed.data.destination_account_id,
    transaction_id: tx!.id,
    resulting_balance: resultingBalance,
    notes: parsed.data.notes ?? null,
    paid_at: parsed.data.paid_at,
  });

  if (paymentError) {
    redirect(`/app/prestamos/${loanId}/abono?error=` + encodeURIComponent(paymentError.message));
  }

  await supabase
    .from('family_loans')
    .update({
      balance: resultingBalance,
      status: resultingBalance <= 0 ? 'paid' : 'active',
    })
    .eq('id', loanId);

  revalidatePath('/app/prestamos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app');
  redirect(`/app/prestamos/${loanId}`);
}

/** Vincula retroactivamente un gasto ya existente a un préstamo (nuevo o existente). */
export async function linkExpenseToLoanAction(formData: FormData) {
  const transactionId = formData.get('transaction_id');
  const loanId = formData.get('loan_id');
  const linkedAmountRaw = formData.get('linked_amount');

  if (typeof transactionId !== 'string' || typeof loanId !== 'string') return;

  const supabase = await createSupabaseServerClient();

  const { data: tx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('id', transactionId)
    .single();

  if (!tx) return;

  const linkedAmount = linkedAmountRaw ? Number(linkedAmountRaw) : null;
  if (linkedAmount !== null && linkedAmount > tx.amount) {
    redirect(
      `/app/gastos/${transactionId}?error=` +
        encodeURIComponent('El monto vinculado no puede superar el monto del gasto.'),
    );
  }

  await supabase
    .from('family_loans')
    .update({ transaction_id: transactionId, linked_amount: linkedAmount })
    .eq('id', loanId);

  revalidatePath('/app/gastos');
  revalidatePath('/app/prestamos');
  revalidatePath('/app/presupuesto');
  revalidatePath(`/app/gastos/${transactionId}`);
}
