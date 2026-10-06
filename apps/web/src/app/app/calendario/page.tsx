import Link from 'next/link';
import { Card, CardContent } from '@flowfinance/ui';
import {
  TrendingUp,
  RefreshCw,
  CreditCard,
  Repeat,
  TrendingDown,
  BadgePercent,
  HandCoins,
  Target,
  CalendarClock,
} from 'lucide-react';
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

const TYPE_META: Record<CalendarEventType, { icon: typeof TrendingUp; tint: string; color: string }> = {
  income: { icon: TrendingUp, tint: 'bg-ff-green/10', color: 'text-ff-green' },
  recurring: { icon: RefreshCw, tint: 'bg-muted', color: 'text-muted-foreground' },
  card_payment: { icon: CreditCard, tint: 'bg-ff-red/10', color: 'text-ff-red' },
  subscription: { icon: Repeat, tint: 'bg-ff-yellow/10', color: 'text-ff-yellow' },
  debt: { icon: TrendingDown, tint: 'bg-ff-red/10', color: 'text-ff-red' },
  loan_portfolio: { icon: BadgePercent, tint: 'bg-ff-green/10', color: 'text-ff-green' },
  family_loan: { icon: HandCoins, tint: 'bg-ff-green/10', color: 'text-ff-green' },
  goal_deadline: { icon: Target, tint: 'bg-ff-blue/10', color: 'text-ff-blue' },
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
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-blue/10">
              <CalendarClock className="h-6 w-6 text-ff-blue" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              No hay nada programado en los próximos 60 días — ingresos esperados, cobros, pagos de
              deuda y fechas límite de metas aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Array.from(byDate.entries()).map(([date, dayEvents], groupIdx) => (
            <div
              key={date}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(groupIdx * 50, 400)}ms` }}
            >
              <p className="mb-2 px-1 text-sm font-medium capitalize text-muted-foreground">
                {new Date(`${date}T00:00:00`).toLocaleDateString('es-SV', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {dayEvents.map((event, i) => {
                  const meta = TYPE_META[event.type];
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={i}
                      href={event.href}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{TYPE_LABELS[event.type]}</p>
                      </div>
                      {event.amount !== null && (
                        <p className={`shrink-0 font-mono text-sm ${meta.color}`}>
                          {new Intl.NumberFormat('es-SV', { style: 'currency', currency: event.currency }).format(
                            event.amount,
                          )}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
