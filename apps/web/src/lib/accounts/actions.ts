'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { accountCreateSchema, accountUpdateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createAccountAction(formData: FormData) {
  const parsed = accountCreateSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    bank_name: formData.get('bank_name') || undefined,
    currency: formData.get('currency'),
    initial_balance: Number(formData.get('initial_balance')),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/cuentas/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: parsed.data.name,
    type: parsed.data.type,
    bank_name: parsed.data.bank_name ?? null,
    currency: parsed.data.currency,
    balance: parsed.data.initial_balance,
    initial_balance: parsed.data.initial_balance,
  });

  if (error) {
    redirect('/app/cuentas/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/cuentas');
  redirect('/app/cuentas');
}

export async function editAccountAction(formData: FormData) {
  const accountId = formData.get('account_id');
  if (typeof accountId !== 'string') return;

  const parsed = accountUpdateSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    bank_name: formData.get('bank_name') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/cuentas/${accountId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('accounts')
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      bank_name: parsed.data.bank_name ?? null,
    })
    .eq('id', accountId);

  if (error) {
    redirect(`/app/cuentas/${accountId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/cuentas');
  redirect('/app/cuentas');
}

export async function archiveAccountAction(formData: FormData) {
  const accountId = formData.get('account_id');
  if (typeof accountId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('accounts').update({ is_archived: true }).eq('id', accountId);

  revalidatePath('/app/cuentas');
}

/**
 * Intenta un borrado real. `transactions.account_id` tiene ON DELETE RESTRICT,
 * así que si la cuenta tiene movimientos, Postgres rechaza el delete
 * (código 23503) — en ese caso sugerimos archivar en vez de forzar nada.
 */
export async function deleteAccountAction(formData: FormData) {
  const accountId = formData.get('account_id');
  if (typeof accountId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('accounts').delete().eq('id', accountId);

  if (error) {
    const message =
      error.code === '23503'
        ? 'Esta cuenta tiene movimientos registrados y no se puede eliminar. Archívala para conservar el historial, o elimina primero sus transacciones.'
        : 'No se pudo eliminar la cuenta.';
    redirect('/app/cuentas?error=' + encodeURIComponent(message));
  }

  revalidatePath('/app/cuentas');
  redirect('/app/cuentas');
}
