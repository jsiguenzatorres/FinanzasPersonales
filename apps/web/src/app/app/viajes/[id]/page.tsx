import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent, Input, Label } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteTripAction, createTripExpenseAction, deleteTripExpenseAction } from '@/lib/trips/actions';
import { fetchTripWeatherAction } from '@/lib/trips/weather-action';
import { generateTripItineraryAction } from '@/lib/trips/itinerary';
import type { WeatherEstimate } from '@/lib/trips/weather';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planeando',
  active: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transporte',
  lodging: 'Hospedaje',
  food: 'Comida',
  activities: 'Actividades',
  shopping: 'Compras',
  fees: 'Trámites',
  insurance: 'Seguro',
  other: 'Otro',
};

const PREFERENCES = [
  { value: 'playas', label: 'Playas' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'museos_cultura', label: 'Museos y cultura' },
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'vida_nocturna', label: 'Vida nocturna' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'compras', label: 'Compras' },
  { value: 'relajacion', label: 'Relajación' },
];

/** Render muy simple de markdown — encabezados ## y listas, sin dependencia nueva. */
function renderItineraryMarkdown(markdown: string) {
  const lines = markdown.split('\n').filter((l) => l.trim());
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('##')) {
          return (
            <p key={i} className="pt-2 font-display text-base text-landing-terracotta first:pt-0">
              {trimmed.replace(/^#+\s*/, '')}
            </p>
          );
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return (
            <p key={i} className="pl-3 text-muted-foreground">
              • {trimmed.replace(/^[-*]\s*/, '')}
            </p>
          );
        }
        return (
          <p key={i} className="text-muted-foreground">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).single();
  if (!trip) notFound();

  const { data: expenses } = await supabase
    .from('trip_expenses')
    .select('*')
    .eq('trip_id', id)
    .order('expense_date', { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: trip.budget_currency }).format(n);
  const spentPct = trip.budget > 0 ? (trip.actual_spent / trip.budget) * 100 : 0;
  const today = new Date().toISOString().slice(0, 10);

  const destinationInfo = trip.destination_info as { weather?: WeatherEstimate } | null;
  const weather = destinationInfo?.weather;
  const itinerary = trip.ai_itinerary as {
    generated_at: string;
    preferences: string[];
    markdown: string;
    sources: Array<{ title: string; uri: string }>;
  } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/app/viajes" className="text-sm text-muted-foreground hover:underline">
        ← Viajes
      </Link>

      {error && (
        <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="font-display text-xl">{trip.destination}</p>
            <p className="text-sm text-muted-foreground">
              {trip.start_date} → {trip.end_date} · {trip.travelers_count} viajero
              {trip.travelers_count === 1 ? '' : 's'} · {STATUS_LABELS[trip.status] ?? trip.status}
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${spentPct > 100 ? 'bg-ff-red' : 'bg-ff-green'}`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {fmt(trip.actual_spent)} gastado de {fmt(trip.budget)} ({spentPct.toFixed(0)}%)
          </p>

          {trip.notes && <p className="text-sm text-muted-foreground">{trip.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/viajes/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteTripAction}>
              <input type="hidden" name="trip_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ── Clima ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium">Clima</p>
          {weather ? (
            <>
              <p className="text-sm text-muted-foreground">
                {weather.is_forecast ? 'Pronóstico real' : 'Promedio histórico de esta época del año'}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-mono text-lg text-ff-red">{weather.avg_high_c}°C</p>
                  <p className="text-xs text-muted-foreground">Máxima</p>
                </div>
                <div>
                  <p className="font-mono text-lg text-ff-blue">{weather.avg_low_c}°C</p>
                  <p className="text-xs text-muted-foreground">Mínima</p>
                </div>
                <div>
                  <p className="font-mono text-lg text-ff-yellow">{weather.avg_precipitation_mm}mm</p>
                  <p className="text-xs text-muted-foreground">Lluvia/día</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Aún no has consultado el clima de este viaje.</p>
          )}
          <form action={fetchTripWeatherAction}>
            <input type="hidden" name="trip_id" value={id} />
            <Button type="submit" variant="outline" size="sm">
              {weather ? 'Actualizar clima' : 'Consultar clima'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Itinerario ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium">Itinerario sugerido</p>

          {itinerary ? (
            <>
              {renderItineraryMarkdown(itinerary.markdown)}
              {itinerary.sources.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Lugares verificados en Google Maps:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-primary hover:underline"
                      >
                        {s.title} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Elige tus preferencias y Neto arma un itinerario día por día con lugares reales (datos de
              Google Maps, no inventados).
            </p>
          )}

          <form action={generateTripItineraryAction} className="space-y-3 border-t border-border pt-3">
            <input type="hidden" name="trip_id" value={id} />
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCES.map((pref) => (
                <label key={pref.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="preferences"
                    value={pref.value}
                    defaultChecked={itinerary?.preferences.includes(pref.value)}
                    className="h-4 w-4 rounded border-border"
                  />
                  {pref.label}
                </label>
              ))}
            </div>
            <Button type="submit" size="sm">
              {itinerary ? 'Regenerar itinerario' : 'Generar itinerario'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Gastos del viaje ───────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium">Registrar gasto</p>
          <form action={createTripExpenseAction} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="trip_id" value={id} />
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" required placeholder="Cena en el centro" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount_local">Monto</Label>
              <Input id="amount_local" name="amount_local" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency_local">Moneda</Label>
              <Input id="currency_local" name="currency_local" required maxLength={3} defaultValue={trip.budget_currency} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                name="category"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Fecha</Label>
              <Input id="expense_date" name="expense_date" type="date" required defaultValue={today} />
            </div>
            <Button type="submit" size="sm" className="col-span-2">
              Agregar gasto
            </Button>
          </form>

          {expenses && expenses.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p>{exp.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category} · {exp.expense_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ff-red">
                      {new Intl.NumberFormat('es-SV', { style: 'currency', currency: exp.currency_local }).format(
                        exp.amount_local,
                      )}
                    </span>
                    <form action={deleteTripExpenseAction}>
                      <input type="hidden" name="expense_id" value={exp.id} />
                      <input type="hidden" name="trip_id" value={id} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-ff-red">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/viajes">Volver</Link>
      </Button>
    </div>
  );
}
