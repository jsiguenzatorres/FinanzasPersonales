import Link from 'next/link';
import { Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUpcomingCalendarEvents, type CalendarEventType } from '@/lib/calendar/aggregate';

const TYPE_LABELS: Record<CalendarEventType, string> = {
  income: 'Ingreso esperado',
  recurring: 'Recurrente',
  card_payment: 'Pago de tarjeta',
  subscription: 'Suscripción',
  debt: 'Pago de deuda',
  loan_portfolio: 'Cuota de Mi Cartera',
  family_loan: 'Préstamo familiar',
  goal_deadline: 'Fecha límite de meta',
};

const TYPE_COLORS: Record<CalendarEventType, string> = {
  income: 'text-ff-green',
  recurring: 'text-muted-foreground',
  card_payment: 'text-ff-red',
  subscription: 'text-ff-yellow',
  debt: 'text-ff-red',
  loan_portfolio: 'text-ff-green',
  family_loan: 'text-ff-green',
  goal_deadline: 'text-ff-blue',
};

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const events = await getUpcomingCalendarEvents(supabase, user!.id);

  const byDate = new Map<string, typeof events>();
  for (const event of events) {
    (byDate.get(event.date) ?? byDate.set(event.date, []).get(event.date)!).push(event);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Calendario Financiero</h1>
        <p className="text-sm text-muted-foreground">Todo lo que se viene en los próximos 60 días</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay nada programado en los próximos 60 días — ingresos esperados, cobros, pagos de deuda y
            fechas límite de metas aparecerán aquí.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(byDate.entries()).map(([date, dayEvents]) => (
            <div key={date}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {new Date(`${date}T00:00:00`).toLocaleDateString('es-SV', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="space-y-2">
                {dayEvents.map((event, i) => (
                  <Link key={i} href={event.href}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm hover:underline">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{TYPE_LABELS[event.type]}</p>
                        </div>
                        {event.amount !== null && (
                          <p className={`font-mono text-sm ${TYPE_COLORS[event.type]}`}>
                            {new Intl.NumberFormat('es-SV', { style: 'currency', currency: event.currency }).format(
                              event.amount,
                            )}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
