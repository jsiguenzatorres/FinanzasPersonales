import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TYPE_LABELS: Record<string, string> = {
  personal_loan: 'Préstamo personal',
  mortgage: 'Hipoteca',
  auto_loan: 'Préstamo de auto',
  student_loan: 'Préstamo estudiantil',
  other: 'Otra',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  paid: 'Pagada',
  defaulted: 'En mora',
  restructured: 'Reestructurada',
  written_off: 'Incobrable',
};

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .is('deleted_at', null)
    .order('status', { ascending: true })
    .order('payoff_priority', { ascending: true, nullsFirst: false });

  const active = (debts ?? []).filter((d) => d.status === 'active');
  const totalOwed = active.reduce((sum, d) => sum + d.current_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Deudas Propias</h1>
        <Button asChild>
          <Link href="/app/deudas/nueva">+ Nueva deuda</Link>
        </Button>
      </div>

      {message && (
        <p className="rounded-md border border-ff-green/25 bg-ff-green/10 px-4 py-3 text-sm text-ff-green">
          {message}
        </p>
      )}

      {active.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Total que debes</p>
              <p className="font-mono text-xl text-ff-red">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalOwed)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Estrategia de pago</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/app/deudas/estrategia">Ver simulador</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!debts || debts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes deudas registradas. No incluyas tarjetas de crédito aquí — esas ya se trackean
            en el módulo Tarjetas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {debts.map((debt) => {
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: debt.currency }).format(n);
            return (
              <Link key={debt.id} href={`/app/deudas/${debt.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium hover:underline">
                        {debt.name}
                        {debt.payoff_priority === 1 && debt.status === 'active' && (
                          <span className="ml-2 text-xs text-ff-yellow">próxima a atacar</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {debt.creditor} · {TYPE_LABELS[debt.type] ?? debt.type} · {debt.interest_rate_annual}%
                        anual
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{fmt(debt.current_balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABELS[debt.status] ?? debt.status} · de {fmt(debt.original_amount)}
                      </p>
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
