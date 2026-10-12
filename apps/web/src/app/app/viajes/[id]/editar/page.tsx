import { notFound } from 'next/navigation';
import { TripForm } from '../../nuevo/trip-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).single();
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <TripForm
        initialValues={{
          id: trip.id,
          destination: trip.destination,
          destination_country: trip.destination_country ?? '',
          start_date: trip.start_date,
          end_date: trip.end_date,
          travelers_count: String(trip.travelers_count),
          budget: String(trip.budget),
          budget_currency: trip.budget_currency ?? 'USD',
          notes: trip.notes ?? '',
          status: trip.status,
        }}
      />
    </div>
  );
}
