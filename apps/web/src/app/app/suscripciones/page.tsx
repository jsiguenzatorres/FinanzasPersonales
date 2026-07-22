import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
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
        <Card>
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
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes suscripciones registradas. Agrega una a mano o usa &quot;Analizar mis
            gastos&quot; para que Neto busque cargos recurrentes en tu historial.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <Link key={sub.id} href={`/app/suscripciones/${sub.id}`}>
              <Card className={!sub.is_active ? 'opacity-50' : ''}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium hover:underline">
                      {sub.service_name}
                      {sub.detected_automatically && (
                        <span className="ml-2 text-xs text-ff-green">detectada</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FREQ_LABELS[sub.frequency] ?? sub.frequency} · próximo cobro {sub.next_charge_date}
                    </p>
                  </div>
                  <p className="font-mono text-sm">
                    {new Intl.NumberFormat('es-SV', { style: 'currency', currency: sub.currency }).format(
                      sub.amount,
                    )}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
