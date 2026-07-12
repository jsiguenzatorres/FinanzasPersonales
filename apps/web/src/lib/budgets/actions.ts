'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { budgetCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createBudgetAction(formData: FormData) {
  const mode = formData.get('mode');
  const totalIncomeExpected = Number(formData.get('total_income_expected'));

  const categoryIds = formData.getAll('category_id') as string[];
  const allocatedAmounts = formData.getAll('allocated_amount') as string[];

  const categories = categoryIds
    .map((id, i) => ({ category_id: id, allocated_amount: Number(allocatedAmounts[i] || 0) }))
    .filter((c) => c.allocated_amount > 0);

  const parsed = budgetCreateSchema.safeParse({
    mode,
    total_income_expected: totalIncomeExpected,
    categories,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/presupuesto/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const totalAllocated = parsed.data.categories.reduce((sum, c) => sum + c.allocated_amount, 0);

  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      period_start: periodStart,
      period_end: periodEnd,
      mode: parsed.data.mode,
      total_income_expected: parsed.data.total_income_expected,
      total_allocated: totalAllocated,
      rollover_overspent: true,
    })
    .select('id')
    .single();

  if (budgetError || !budget) {
    redirect(
      '/app/presupuesto/nuevo?error=' +
        encodeURIComponent(budgetError?.message ?? 'Error al crear presupuesto'),
    );
  }

  const rows = parsed.data.categories.map((c) => ({
    budget_id: budget.id,
    category_id: c.category_id,
    allocated_amount: c.allocated_amount,
  }));

  const { error: catError } = await supabase.from('budget_categories').insert(rows);

  if (catError) {
    redirect('/app/presupuesto/nuevo?error=' + encodeURIComponent(catError.message));
  }

  revalidatePath('/app/presupuesto');
  revalidatePath('/app');
  redirect('/app/presupuesto');
}
