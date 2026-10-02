'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { geocodeDestination, getWeatherEstimate } from './weather';
import type { Json } from '@flowfinance/shared/types';

export async function fetchTripWeatherAction(formData: FormData) {
  const tripId = formData.get('trip_id');
  if (typeof tripId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('destination, start_date, end_date, destination_info')
    .eq('id', tripId)
    .single();

  if (!trip) {
    redirect('/app/viajes?error=' + encodeURIComponent('No se encontró el viaje.'));
  }

  const geo = await geocodeDestination(trip!.destination);
  if (!geo) {
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent('No se pudo ubicar ese destino.'));
  }

  const weather = await getWeatherEstimate(geo!.lat, geo!.lon, trip!.start_date, trip!.end_date);
  if (!weather) {
    redirect(`/app/viajes/${tripId}?error=` + encodeURIComponent('No se pudo obtener el clima para esas fechas.'));
  }

  const existingInfo = (trip!.destination_info as Record<string, unknown> | null) ?? {};
  await supabase
    .from('trips')
    .update({ destination_info: { ...existingInfo, weather } as unknown as Json })
    .eq('id', tripId);

  revalidatePath(`/app/viajes/${tripId}`);
  redirect(`/app/viajes/${tripId}`);
}
