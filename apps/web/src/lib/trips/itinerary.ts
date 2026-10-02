'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createFinnClient } from '@flowfinance/finn/client';
import { buildTripItineraryPrompt } from '@flowfinance/finn/prompts';
import { generateItineraryInputSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function generateTripItineraryAction(formData: FormData) {
  const tripId = formData.get('trip_id');
  if (typeof tripId !== 'string') return;

  const preferences = formData.getAll('preferences').map(String);
  const parsed = generateItineraryInputSchema.safeParse({ trip_id: tripId, preferences });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Elige al menos una preferencia.';
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent(message));
  }

  if (!process.env.GEMINI_API_KEY) {
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent('Neto no está configurado (falta GEMINI_API_KEY).'));
  }

  const supabase = await createSupabaseServerClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('destination, start_date, end_date, travelers_count, budget, budget_currency')
    .eq('id', tripId)
    .single();

  if (!trip) {
    redirect('/app/viajes?error=' + encodeURIComponent('No se encontró el viaje.'));
  }

  const client = createFinnClient({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = buildTripItineraryPrompt({
    destination: trip!.destination,
    startDate: trip!.start_date,
    endDate: trip!.end_date,
    travelersCount: trip!.travelers_count,
    budget: trip!.budget,
    budgetCurrency: trip!.budget_currency,
    preferences: parsed.data.preferences,
  });

  try {
    const result = await client.generateGroundedItinerary(prompt);

    await supabase
      .from('trips')
      .update({
        ai_itinerary: {
          generated_at: new Date().toISOString(),
          preferences: parsed.data.preferences,
          markdown: result.markdown,
          sources: result.sources,
        },
      })
      .eq('id', tripId);
  } catch (err) {
    console.error('[WanderFinance itinerary] error:', err);
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent('No se pudo generar el itinerario. Intenta de nuevo.'));
  }

  revalidatePath(`/app/viajes/${tripId}`);
  redirect(`/app/viajes/${tripId}`);
}
