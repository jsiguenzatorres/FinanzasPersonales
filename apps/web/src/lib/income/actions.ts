'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { incomeCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createIncomeAction(formData: FormData) {
  const isCollected = formData.get('is_collected') === 'on';
  const deductionsTotal = Number(formData.get('deductions_total') || 0);

  const raw = {
    type: formData.get('type'),
    source_name: formData.get('source_name'),
    gross_amount: Number(formData.get('gross_amount')),
    net_amount: Number(formData.get('net_amount')),
    currency: formData.get('currency'),
    income_date: formData.get('income_date'),
    account_id: formData.get('account_id'),
    is_collected: isCollected,
    expected_date: formData.get('expected_date') || undefined,
    notes: formData.get('notes') || undefined,
    deductions:
      deductionsTotal > 0
        ? [{ name: 'Deducciones SV (ISSS + AFP + ISR)', amount: deductionsTotal, type: 'other' as const }]
        : undefined,
  };

  const parsed = incomeCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/ingresos/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: income, error: incomeError } = await supabase
    .from('income_entries')
    .insert({
      user_id: user.id,
      account_id: parsed.data.account_id,
      type: parsed.data.type,
      source_name: parsed.data.source_name,
      gross_amount: parsed.data.gross_amount,
      net_amount: parsed.data.net_amount,
      deductions: parsed.data.deductions ?? [],
      currency: parsed.data.currency,
      income_date: parsed.data.income_date,
      is_collected: parsed.data.is_collected,
      expected_date: parsed.data.expected_date ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (incomeError || !income) {
    redirect(
      '/app/ingresos/nueva?error=' + encodeURIComponent(incomeError?.message ?? 'Error al guardar'),
    );
  }

  if (parsed.data.is_collected) {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: parsed.data.account_id,
        kind: 'income',
        amount: parsed.data.net_amount,
        currency: parsed.data.currency,
        transaction_date: parsed.data.income_date,
        description: parsed.data.source_name,
        capture_source: 'manual',
      })
      .select('id')
      .single();

    if (!txError && tx) {
      await supabase.from('income_entries').update({ transaction_id: tx.id }).eq('id', income.id);
    }
  }

  revalidatePath('/app/ingresos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app');
  redirect('/app/ingresos');
}

export async function deleteIncomeAction(formData: FormData) {
  const incomeId = formData.get('income_id');
  if (typeof incomeId !== 'string') return;

  const supabase = await createSupabaseServerClient();

  const { data: income } = await supabase
    .from('income_entries')
    .select('transaction_id')
    .eq('id', incomeId)
    .single();

  const now = new Date().toISOString();

  await supabase.from('income_entries').update({ deleted_at: now }).eq('id', incomeId);

  if (income?.transaction_id) {
    await supabase.from('transactions').update({ deleted_at: now }).eq('id', income.transaction_id);
  }

  revalidatePath('/app/ingresos');
  revalidatePath('/app/cuentas');
  revalidatePath('/app');
}
