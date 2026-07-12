'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { accountCreateSchema } from '@flowfinance/shared/schemas';
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

export async function archiveAccountAction(formData: FormData) {
  const accountId = formData.get('account_id');
  if (typeof accountId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('accounts').update({ is_archived: true }).eq('id', accountId);

  revalidatePath('/app/cuentas');
}
