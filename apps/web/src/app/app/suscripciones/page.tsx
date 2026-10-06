import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { Repeat, Sparkles } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SubscriptionScanner } from '@/components/subscriptions/scanner';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

/** Normaliza cada suscripción a su equivalente mensual, para el total. */
const MONTHLY_FACTOR: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  bimonthly: 0.5,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  annual: 1 / 12,
};

export default async function SubscriptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('is_active', { ascending: false })
    .order('next_charge_date', { ascending: true });

  const active = (subscriptions ?? []).filter((s) => s.is_active);
  const monthlyTotal = active.reduce((sum, s) => sum + s.amount * (MONTHLY_FACTOR[s.frequency] ?? 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Suscripciones</h1>
        <Button asChild>
          <Link href="/app/suscripciones/nueva">+ Agregar</Link>
        </Button>
      </div>

      {active.length > 0 && (
        <Card className="animate-fade-in-up border-t-[3px] border-t-ff-red">
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">Total mensual aproximado</p>
            <p className="font-mono text-xl text-ff-red">
              {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(monthlyTotal)}
            </p>
          </CardContent>
        </Card>
      )}

      <SubscriptionScanner />

      {!subscriptions || subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-red/10">
              <Repeat className="h-6 w-6 text-ff-red" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes suscripciones registradas. Agrega una a mano o usa &quot;Analizar mis
              gastos&quot; para que Neto busque cargos recurrentes en tu historial.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {subscriptions.map((sub, i) => (
            <Link
              key={sub.id}
              href={`/app/suscripciones/${sub.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 ${
                i > 0 ? 'border-t border-border' : ''
              } ${!sub.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ff-red/10">
                <Repeat className="h-4 w-4 text-ff-red" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {sub.service_name}
                  {sub.detected_automatically && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-ff-green/10 px-2 py-0.5 text-xs text-ff-green">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      detectada
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {FREQ_LABELS[sub.frequency] ?? sub.frequency} · próximo cobro {sub.next_charge_date}
                </p>
              </div>
              <p className="shrink-0 font-mono text-sm">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: sub.currency }).format(sub.amount)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
