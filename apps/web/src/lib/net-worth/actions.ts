'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { manualAssetCreateSchema, manualLiabilityCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createManualAssetAction(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    type: formData.get('type'),
    value: Number(formData.get('value')),
    currency: formData.get('currency'),
    notes: formData.get('notes') || undefined,
  };

  const parsed = manualAssetCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/patrimonio/activos?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('manual_assets').insert({
    user_id: user.id,
    name: parsed.data.name,
    type: parsed.data.type,
    value: parsed.data.value,
    currency: parsed.data.currency,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect('/app/patrimonio/activos?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/patrimonio');
  revalidatePath('/app/patrimonio/activos');
  redirect('/app/patrimonio/activos');
}

export async function deleteManualAssetAction(formData: FormData) {
  const assetId = formData.get('asset_id');
  if (typeof assetId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('manual_assets').update({ is_active: false }).eq('id', assetId);

  revalidatePath('/app/patrimonio');
  revalidatePath('/app/patrimonio/activos');
}

export async function createManualLiabilityAction(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    type: formData.get('type'),
    amount: Number(formData.get('amount')),
    currency: formData.get('currency'),
    notes: formData.get('notes') || undefined,
  };

  const parsed = manualLiabilityCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/patrimonio/pasivos?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('manual_liabilities').insert({
    user_id: user.id,
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect('/app/patrimonio/pasivos?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/patrimonio');
  revalidatePath('/app/patrimonio/pasivos');
  redirect('/app/patrimonio/pasivos');
}

export async function deleteManualLiabilityAction(formData: FormData) {
  const liabilityId = formData.get('liability_id');
  if (typeof liabilityId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('manual_liabilities').update({ is_active: false }).eq('id', liabilityId);

  revalidatePath('/app/patrimonio');
  revalidatePath('/app/patrimonio/pasivos');
}

export async function takeSnapshotAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: netWorth } = await supabase.from('v_net_worth_current').select('*').single();

  if (!netWorth) {
    redirect('/app/patrimonio?error=' + encodeURIComponent('No se pudo calcular el patrimonio'));
  }

  const { error } = await supabase.from('net_worth_snapshots').upsert(
    {
      user_id: user.id,
      snapshot_date: new Date().toISOString().slice(0, 10),
      total_assets: netWorth.total_assets ?? 0,
      total_liabilities: netWorth.total_liabilities ?? 0,
      currency: netWorth.currency ?? 'USD',
      assets_breakdown: netWorth.assets_breakdown ?? {},
      liabilities_breakdown: netWorth.liabilities_breakdown ?? {},
      source: 'manual',
    },
    { onConflict: 'user_id,snapshot_date' },
  );

  if (error) {
    redirect('/app/patrimonio?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/patrimonio');
  redirect('/app/patrimonio');
}
