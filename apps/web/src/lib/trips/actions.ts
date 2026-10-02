'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { tripCreateSchema, tripUpdateSchema, tripExpenseCreateSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseTripForm(formData: FormData) {
  return {
    destination: formData.get('destination'),
    destination_country: formData.get('destination_country') || undefined,
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    travelers_count: Number(formData.get('travelers_count') || 1),
    budget: Number(formData.get('budget')),
    budget_currency: formData.get('budget_currency'),
    notes: formData.get('notes') || undefined,
  };
}

export async function createTripAction(formData: FormData) {
  const parsed = tripCreateSchema.safeParse(parseTripForm(formData));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/viajes/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      destination: parsed.data.destination,
      destination_country: parsed.data.destination_country ?? null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      travelers_count: parsed.data.travelers_count,
      budget: parsed.data.budget,
      budget_currency: parsed.data.budget_currency,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (error || !trip) {
    redirect('/app/viajes/nuevo?error=' + encodeURIComponent(error?.message ?? 'Error al guardar'));
  }

  revalidatePath('/app/viajes');
  revalidatePath('/app');
  redirect(`/app/viajes/${trip.id}`);
}

export async function editTripAction(formData: FormData) {
  const tripId = formData.get('trip_id');
  if (typeof tripId !== 'string') return;

  const raw = { ...parseTripForm(formData), status: formData.get('status') || undefined };
  const parsed = tripUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/viajes/${tripId}/editar?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('trips')
    .update({
      destination: parsed.data.destination,
      destination_country: parsed.data.destination_country ?? null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      travelers_count: parsed.data.travelers_count,
      budget: parsed.data.budget,
      budget_currency: parsed.data.budget_currency,
      notes: parsed.data.notes ?? null,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    })
    .eq('id', tripId);

  if (error) {
    redirect(`/app/viajes/${tripId}/editar?error=` + encodeURIComponent(error.message));
  }

  revalidatePath('/app/viajes');
  revalidatePath(`/app/viajes/${tripId}`);
  revalidatePath('/app');
  redirect(`/app/viajes/${tripId}`);
}

export async function deleteTripAction(formData: FormData) {
  const tripId = formData.get('trip_id');
  if (typeof tripId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('trips').delete().eq('id', tripId);

  revalidatePath('/app/viajes');
  revalidatePath('/app');
  redirect('/app/viajes');
}

export async function createTripExpenseAction(formData: FormData) {
  const tripId = formData.get('trip_id');
  if (typeof tripId !== 'string') return;

  const parsed = tripExpenseCreateSchema.safeParse({
    trip_id: tripId,
    category: formData.get('category'),
    description: formData.get('description'),
    amount_local: Number(formData.get('amount_local')),
    currency_local: formData.get('currency_local'),
    expense_date: formData.get('expense_date'),
    notes: formData.get('notes') || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase.from('trip_expenses').insert({
    user_id: user.id,
    trip_id: parsed.data.trip_id,
    category: parsed.data.category,
    description: parsed.data.description,
    amount_local: parsed.data.amount_local,
    currency_local: parsed.data.currency_local,
    expense_date: parsed.data.expense_date,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent(error.message));
  }

  // actual_spent se mantiene a mano aquí (sin trigger nuevo) — suma simple
  // de amount_local asumiendo que coincide con budget_currency, consistente
  // con que trip_expenses tampoco convierte moneda automáticamente en v1.
  const { data: expenses } = await supabase
    .from('trip_expenses')
    .select('amount_local')
    .eq('trip_id', tripId);
  const actualSpent = (expenses ?? []).reduce((sum, e) => sum + e.amount_local, 0);
  await supabase.from('trips').update({ actual_spent: actualSpent }).eq('id', tripId);

  revalidatePath(`/app/viajes/${tripId}`);
  revalidatePath('/app/viajes');
  redirect(`/app/viajes/${tripId}`);
}

export async function deleteTripExpenseAction(formData: FormData) {
  const expenseId = formData.get('expense_id');
  const tripId = formData.get('trip_id');
  if (typeof expenseId !== 'string' || typeof tripId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('trip_expenses').delete().eq('id', expenseId);

  const { data: expenses } = await supabase
    .from('trip_expenses')
    .select('amount_local')
    .eq('trip_id', tripId);
  const actualSpent = (expenses ?? []).reduce((sum, e) => sum + e.amount_local, 0);
  await supabase.from('trips').update({ actual_spent: actualSpent }).eq('id', tripId);

  revalidatePath(`/app/viajes/${tripId}`);
  revalidatePath('/app/viajes');
}
