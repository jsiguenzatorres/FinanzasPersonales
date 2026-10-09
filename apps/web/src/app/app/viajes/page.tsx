import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { Plane } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planeando',
  active: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const STATUS_TINT: Record<string, string> = {
  planning: 'bg-ff-blue/10 text-ff-blue',
  active: 'bg-ff-green/10 text-ff-green',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
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
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full animate-empty-breathe bg-ff-blue/10">
              <Plane className="h-6 w-6 text-ff-blue" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes viajes planeados. Agrega uno — Neto puede estimar el clima y sugerirte un
              itinerario con lugares reales según tus preferencias.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/viajes/nuevo">+ Nuevo viaje</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, i) => {
            const pct = trip.budget > 0 ? Math.min((trip.actual_spent / trip.budget) * 100, 100) : 0;
            const over = trip.budget > 0 && trip.actual_spent > trip.budget;
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: trip.budget_currency }).format(n);
            const tint = STATUS_TINT[trip.status] ?? STATUS_TINT.planning!;
            return (
              <Link key={trip.id} href={`/app/viajes/${trip.id}`}>
                <Card
                  className="animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-landing-terracotta/50 active:scale-[0.98] active:translate-y-0"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ff-blue/10">
                        <Plane className="h-5 w-5 text-ff-blue" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{trip.destination}</p>
                        <p className="text-xs text-muted-foreground">
                          {trip.start_date} → {trip.end_date}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${tint}`}>
                      {STATUS_LABELS[trip.status] ?? trip.status}
                    </span>

                    <div>
                      <p className={`font-mono text-lg ${over ? 'text-ff-red' : 'text-ff-green'}`}>
                        {fmt(trip.actual_spent)}
                      </p>
                      <p className="text-xs text-muted-foreground">de {fmt(trip.budget)}</p>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-700 ${over ? 'bg-ff-red' : 'bg-ff-green'}`}
                        style={{ width: `${pct}%` }}
                      />
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
