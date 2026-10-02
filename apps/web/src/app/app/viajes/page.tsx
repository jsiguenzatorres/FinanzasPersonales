import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planeando',
  active: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export default async function TripsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Viajes</h1>
        <Button asChild>
          <Link href="/app/viajes/nuevo">+ Nuevo viaje</Link>
        </Button>
      </div>

      {!trips || trips.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes viajes planeados. Agrega uno — Neto puede estimar el clima y sugerirte un
            itinerario con lugares reales según tus preferencias.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => {
            const pct = trip.budget > 0 ? (trip.actual_spent / trip.budget) * 100 : 0;
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: trip.budget_currency }).format(n);
            return (
              <Link key={trip.id} href={`/app/viajes/${trip.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium hover:underline">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.start_date} → {trip.end_date} · {STATUS_LABELS[trip.status] ?? trip.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm ${pct > 100 ? 'text-ff-red' : 'text-ff-green'}`}>
                        {fmt(trip.actual_spent)}
                      </p>
                      <p className="text-xs text-muted-foreground">de {fmt(trip.budget)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
