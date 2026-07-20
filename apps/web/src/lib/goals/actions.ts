'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { goalCreateSchema, goalUpdateSchema, goalContributionCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';

/**
 * Suma auto_contribution_pct de las metas activas del usuario, excluyendo
 * (opcionalmente) una meta específica — para validar "¿cabe este % sin pasar
 * de 100 entre todas?" tanto al crear como al editar.
 */
async function activeAutoContributionSum(
  supabase: SupabaseClient<Database>,
  userId: string,
  excludeGoalId?: string,
): Promise<number> {
  let query = supabase
    .from('goals')
    .select('auto_contribution_pct')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .not('auto_contribution_pct', 'is', null);

  if (excludeGoalId) query = query.neq('id', excludeGoalId);

  const { data } = await query;
  return (data ?? []).reduce((sum, g) => sum + (g.auto_contribution_pct ?? 0), 0);
}

export async function createGoalAction(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    type: formData.get('type'),
    target_amount: Number(formData.get('target_amount')),
    currency: formData.get('currency'),
    account_id: formData.get('account_id') || undefined,
    target_date: formData.get('target_date') || undefined,
    monthly_contribution: formData.get('monthly_contribution')
      ? Number(formData.get('monthly_contribution'))
      : undefined,
    auto_contribution_pct: formData.get('auto_contribution_pct')
      ? Number(formData.get('auto_contribution_pct'))
      : undefined,
    priority: formData.get('priority') ? Number(formData.get('priority')) : undefined,
  };

  const parsed = goalCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/metas/nueva?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  if (parsed.data.auto_contribution_pct) {
    const existingSum = await activeAutoContributionSum(supabase, user.id);
    if (existingSum + parsed.data.auto_contribution_pct > 100) {
      redirect(
        '/app/metas/nueva?error=' +
          encodeURIComponent(
            `Tus metas activas ya suman ${existingSum}% de aporte automático — no puedes pasar de 100% entre todas.`,
          ),
      );
    }
  }

  const { error } = await supabase.from('goals').insert({
    user_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    type: parsed.data.type,
    target_amount: parsed.data.target_amount,
    currency: parsed.data.currency,
    account_id: parsed.data.account_id ?? null,
    target_date: parsed.data.target_date ?? null,
    monthly_contribution: parsed.data.monthly_contribution ?? null,
    auto_contribution_pct: parsed.data.auto_contribution_pct ?? null,
    priority: parsed.data.priority ?? 5,
  });

  if (error) {
    redirect('/app/metas/nueva?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/app/metas');
  revalidatePath('/app');
  redirect('/app/metas');
}

export async function editGoalAction(formData: FormData) {
  const goalId = formData.get('goal_id');
  if (typeof goalId !== 'string') return;

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    target_amount: Number(formData.get('target_amount')),
    account_id: formData.get('account_id') || undefined,
    target_date: formData.get('target_date') || undefined,
    monthly_contribution: formData.get('monthly_contribution')
      ? Number(formData.get('monthly_contribution'))
      : undefined,
    auto_contribution_pct: formData.get('auto_contribution_pct')
      ? Number(formData.get('auto_contribution_pct'))
      : undefined,
    priority: formData.get('priority') ? Number(formData.get('priority')) : undefined,
    status: formData.get('status') || undefined,
  };

  const parsed = goalUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/metas/${goalId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  if (parsed.data.auto_contribution_pct && parsed.data.status !== 'paused' && parsed.data.status !== 'abandoned') {
    const existingSum = await activeAutoContributionSum(supabase, user.id, goalId);
    if (existingSum + parsed.data.auto_contribution_pct > 100) {
      redirect(
        `/app/metas/${goalId}/editar?error=` +
          encodeURIComponent(
            `Tus otras metas activas ya suman ${existingSum}% de aporte automático — no puedes pasar de 100% entre todas.`,
          ),
      );
    }
  }

  const { error } = await supabase
    .from('goals')
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      target_amount: parsed.data.target_amount,
      account_id: parsed.data.account_id ?? null,
      target_date: parsed.data.target_date ?? null,
      monthly_contribution: parsed.data.monthly_contribution ?? null,
      auto_contribution_pct: parsed.data.auto_contribution_pct ?? null,
      priority: parsed.data.priority ?? 5,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    })
    .eq('id', goalId);

  if (error) {
    redirect(`/app/metas/${goalId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/metas');
  revalidatePath('/app');
  redirect(`/app/metas/${goalId}`);
}

export async function deleteGoalAction(formData: FormData) {
  const goalId = formData.get('goal_id');
  if (typeof goalId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('goals').update({ deleted_at: new Date().toISOString() }).eq('id', goalId);

  revalidatePath('/app/metas');
  revalidatePath('/app');
  redirect('/app/metas');
}

export async function createGoalContributionAction(formData: FormData) {
  const goalId = formData.get('goal_id');
  if (typeof goalId !== 'string') return;

  const isWithdrawal = formData.get('direction') === 'withdraw';
  const rawAmount = Number(formData.get('amount'));

  const raw = {
    goal_id: goalId,
    amount: isWithdrawal ? -Math.abs(rawAmount) : Math.abs(rawAmount),
    currency: formData.get('currency'),
    contribution_date: formData.get('contribution_date'),
    notes: formData.get('notes') || undefined,
  };

  const parsed = goalContributionCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/metas/${goalId}?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.from('goal_contributions').insert({
    user_id: user.id,
    goal_id: parsed.data.goal_id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    contribution_date: parsed.data.contribution_date,
    source: 'manual',
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect(`/app/metas/${goalId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/metas');
  revalidatePath(`/app/metas/${goalId}`);
  revalidatePath('/app');
  redirect(`/app/metas/${goalId}`);
}
