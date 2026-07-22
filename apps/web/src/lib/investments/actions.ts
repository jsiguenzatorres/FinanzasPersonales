'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { investmentCreateSchema, investmentUpdateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseInvestmentForm(formData: FormData) {
  return {
    name: formData.get('name'),
    ticker: formData.get('ticker') || undefined,
    type: formData.get('type'),
    broker: formData.get('broker') || undefined,
    currency: formData.get('currency'),
    quantity: Number(formData.get('quantity')),
    avg_cost: Number(formData.get('avg_cost')),
    current_price: formData.get('current_price') ? Number(formData.get('current_price')) : undefined,
    coingecko_id: formData.get('coingecko_id') || undefined,
    notes: formData.get('notes') || undefined,
  };
}

export async function createInvestmentAction(formData: FormData) {
  const parsed = investmentCreateSchema.safeParse(parseInvestmentForm(formData));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/inversiones/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.from('investments').insert({
    user_id: user.id,
    name: parsed.data.name,
    ticker: parsed.data.ticker ?? null,
    type: parsed.data.type,
    broker: parsed.data.broker ?? null,
    currency: parsed.data.currency,
    quantity: parsed.data.quantity,
    avg_cost: parsed.data.avg_cost,
    current_price: parsed.data.current_price ?? null,
    last_price_update_at: parsed.data.current_price ? new Date().toISOString() : null,
    metadata: parsed.data.coingecko_id ? { coingecko_id: parsed.data.coingecko_id } : null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect('/app/inversiones/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/inversiones');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/inversiones');
}

export async function editInvestmentAction(formData: FormData) {
  const investmentId = formData.get('investment_id');
  if (typeof investmentId !== 'string') return;

  const raw = {
    ...parseInvestmentForm(formData),
    is_active: formData.get('is_active') === 'on',
  };

  const parsed = investmentUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/inversiones/${investmentId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from('investments')
    .select('current_price')
    .eq('id', investmentId)
    .single();

  const priceChanged = parsed.data.current_price !== undefined && parsed.data.current_price !== existing?.current_price;

  const { error } = await supabase
    .from('investments')
    .update({
      name: parsed.data.name,
      ticker: parsed.data.ticker ?? null,
      type: parsed.data.type,
      broker: parsed.data.broker ?? null,
      currency: parsed.data.currency,
      quantity: parsed.data.quantity,
      avg_cost: parsed.data.avg_cost,
      current_price: parsed.data.current_price ?? null,
      last_price_update_at: priceChanged ? new Date().toISOString() : undefined,
      metadata: parsed.data.coingecko_id ? { coingecko_id: parsed.data.coingecko_id } : null,
      notes: parsed.data.notes ?? null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq('id', investmentId);

  if (error) {
    redirect(`/app/inversiones/${investmentId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/inversiones');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect(`/app/inversiones/${investmentId}`);
}

export async function deleteInvestmentAction(formData: FormData) {
  const investmentId = formData.get('investment_id');
  if (typeof investmentId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('investments').delete().eq('id', investmentId);

  revalidatePath('/app/inversiones');
  revalidatePath('/app/patrimonio');
  revalidatePath('/app');
  redirect('/app/inversiones');
}
