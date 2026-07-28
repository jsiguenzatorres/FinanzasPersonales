'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { debtStrategyConfirmSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Confirma una estrategia calculada por el simulador (§3 de
 * docs/modules/mod-16-deudas-propias.md) — escribe el mismo strategy a
 * TODAS las deudas activas (es una decisión de portafolio, no por deuda) y
 * payoff_priority según el orden calculado, para que el dashboard y Neto
 * puedan mostrar "tu próxima deuda a atacar" sin re-simular cada vez.
 */
export async function confirmDebtStrategyAction(formData: FormData) {
  const orderRaw = formData.get('order');
  const parsed = debtStrategyConfirmSchema.safeParse({
    strategy: formData.get('strategy'),
    order: typeof orderRaw === 'string' ? orderRaw.split(',') : [],
  });

  if (!parsed.success) {
    redirect('/app/deudas/estrategia?error=' + encodeURIComponent('No se pudo confirmar la estrategia.'));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  await Promise.all(
    parsed.data.order.map((debtId, index) =>
      supabase
        .from('debts')
        .update({ strategy: parsed.data.strategy, payoff_priority: index + 1 })
        .eq('id', debtId)
        .eq('user_id', user.id),
    ),
  );

  revalidatePath('/app/deudas');
  revalidatePath('/app/deudas/estrategia');
  revalidatePath('/app');
  redirect('/app/deudas?message=' + encodeURIComponent('Estrategia confirmada.'));
}
