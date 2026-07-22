'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '@flowfinance/shared/schemas';
import { advanceByFrequency } from '@flowfinance/shared/utils';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseSubscriptionForm(formData: FormData) {
  return {
    service_name: formData.get('service_name'),
    plan: formData.get('plan') || undefined,
    amount: Number(formData.get('amount')),
    currency: formData.get('currency'),
    frequency: formData.get('frequency'),
    next_charge_date: formData.get('next_charge_date'),
    start_date: formData.get('start_date'),
    category_id: formData.get('category_id') || undefined,
    card_id: formData.get('card_id') || undefined,
    account_id: formData.get('account_id') || undefined,
    cancel_url: formData.get('cancel_url') || undefined,
    free_trial_until: formData.get('free_trial_until') || undefined,
    notes: formData.get('notes') || undefined,
  };
}

export async function createSubscriptionAction(formData: FormData) {
  const parsed = subscriptionCreateSchema.safeParse(parseSubscriptionForm(formData));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/suscripciones/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    service_name: parsed.data.service_name,
    plan: parsed.data.plan ?? null,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    frequency: parsed.data.frequency,
    next_charge_date: parsed.data.next_charge_date,
    start_date: parsed.data.start_date,
    category_id: parsed.data.category_id ?? null,
    card_id: parsed.data.card_id ?? null,
    account_id: parsed.data.account_id ?? null,
    cancel_url: parsed.data.cancel_url ?? null,
    free_trial_until: parsed.data.free_trial_until ?? null,
    notes: parsed.data.notes ?? null,
    detected_automatically: formData.get('detected_automatically') === 'true',
  });

  if (error) {
    redirect('/app/suscripciones/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/suscripciones');
  revalidatePath('/app');
  redirect('/app/suscripciones');
}

export async function editSubscriptionAction(formData: FormData) {
  const subId = formData.get('subscription_id');
  if (typeof subId !== 'string') return;

  const raw = {
    ...parseSubscriptionForm(formData),
    usage_score: formData.get('usage_score') ? Number(formData.get('usage_score')) : undefined,
    is_active: formData.get('is_active') === 'on',
  };

  const parsed = subscriptionUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/suscripciones/${subId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('subscriptions')
    .update({
      service_name: parsed.data.service_name,
      plan: parsed.data.plan ?? null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      frequency: parsed.data.frequency,
      next_charge_date: parsed.data.next_charge_date,
      start_date: parsed.data.start_date,
      category_id: parsed.data.category_id ?? null,
      card_id: parsed.data.card_id ?? null,
      account_id: parsed.data.account_id ?? null,
      cancel_url: parsed.data.cancel_url ?? null,
      free_trial_until: parsed.data.free_trial_until ?? null,
      notes: parsed.data.notes ?? null,
      usage_score: parsed.data.usage_score ?? null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq('id', subId);

  if (error) {
    redirect(`/app/suscripciones/${subId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/suscripciones');
  revalidatePath('/app');
  redirect(`/app/suscripciones/${subId}`);
}

export async function deleteSubscriptionAction(formData: FormData) {
  const subId = formData.get('subscription_id');
  if (typeof subId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('subscriptions').delete().eq('id', subId);

  revalidatePath('/app/suscripciones');
  revalidatePath('/app');
  redirect('/app/suscripciones');
}

/**
 * "Ya se cobró" — avanza next_charge_date según la frecuencia. No crea
 * ninguna transacción (§4 de docs/modules/mod-06-suscripciones.md — el
 * cron que generaría el cargo real no existe todavía).
 */
export async function advanceSubscriptionChargeAction(formData: FormData) {
  const subId = formData.get('subscription_id');
  if (typeof subId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('next_charge_date, frequency')
    .eq('id', subId)
    .single();

  if (sub) {
    const nextDate = advanceByFrequency(sub.next_charge_date, sub.frequency);
    await supabase.from('subscriptions').update({ next_charge_date: nextDate }).eq('id', subId);
  }

  revalidatePath('/app/suscripciones');
  revalidatePath(`/app/suscripciones/${subId}`);
  revalidatePath('/app');
  redirect(`/app/suscripciones/${subId}`);
}
