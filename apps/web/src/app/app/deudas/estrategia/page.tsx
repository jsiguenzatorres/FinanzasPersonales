import Link from 'next/link';
import { Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StrategySimulator } from './strategy-simulator';

export default async function DebtStrategyPage() {
  const supabase = await createSupabaseServerClient();
  const { data: debts } = await supabase
    .from('debts')
    .select('id, name, current_balance, interest_rate_annual, monthly_payment, currency')
    .eq('status', 'active')
    .is('deleted_at', null);

  const withPayment = (debts ?? []).filter((d) => d.monthly_payment != null && d.monthly_payment > 0);
  const withoutPayment = (debts ?? []).filter((d) => !d.monthly_payment || d.monthly_payment <= 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/app/deudas" className="text-sm text-muted-foreground hover:underline">
          ← Deudas
        </Link>
        <h1 className="mt-2 font-display text-2xl">Estrategia de pago</h1>
        <p className="text-sm text-muted-foreground">
          Compara bola de nieve vs. avalancha con tus saldos actuales
        </p>
      </div>

      {withoutPayment.length > 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-ff-yellow">
            {withoutPayment.length === 1
              ? `"${withoutPayment[0]!.name}" no tiene pago mínimo mensual definido — no entra en el simulador hasta que lo agregues.`
              : `${withoutPayment.length} deudas no tienen pago mínimo mensual definido — no entran en el simulador hasta que lo agregues.`}
          </CardContent>
        </Card>
      )}

      {withPayment.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Necesitas al menos una deuda activa con pago mínimo mensual definido para usar el simulador.
          </CardContent>
        </Card>
      ) : (
        <StrategySimulator
          debts={withPayment.map((d) => ({
            id: d.id,
            name: d.name,
            current_balance: d.current_balance,
            interest_rate_annual: d.interest_rate_annual,
            monthly_payment: d.monthly_payment!,
            currency: d.currency,
          }))}
        />
      )}
    </div>
  );
}
