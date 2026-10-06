import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { TrendingDown, Flame, CheckCircle2 } from 'lucide-react';
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
        <p className="flex items-center gap-2 rounded-xl border border-ff-green/25 bg-ff-green/10 px-4 py-3 text-sm text-ff-green">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}

      {active.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="animate-fade-in-up border-t-[3px] border-t-ff-red">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total que debes</p>
              <p className="font-mono text-xl text-ff-red">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalOwed)}
              </p>
            </CardContent>
          </Card>
          <Card className="animate-fade-in-up border-t-[3px] border-t-ff-orange" style={{ animationDelay: '40ms' }}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs text-muted-foreground">Estrategia de pago</p>
                <p className="text-sm">Bola de nieve o avalancha</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/deudas/estrategia">Ver simulador</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!debts || debts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-red/10">
              <TrendingDown className="h-6 w-6 text-ff-red" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes deudas registradas. No incluyas tarjetas de crédito aquí — esas ya se
              trackean en el módulo Tarjetas.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/deudas/nueva">+ Nueva deuda</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {debts.map((debt, i) => {
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: debt.currency }).format(n);
            const isNext = debt.payoff_priority === 1 && debt.status === 'active';
            return (
              <Link
                key={debt.id}
                href={`/app/deudas/${debt.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 active:bg-landing-terracotta/10 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isNext ? 'bg-ff-orange/10' : 'bg-ff-red/10'
                  }`}
                >
                  {isNext ? (
                    <Flame className="h-4 w-4 text-ff-orange" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-ff-red" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {debt.name}
                    {isNext && (
                      <span className="ml-2 rounded-full bg-ff-orange/10 px-2 py-0.5 text-xs text-ff-orange">
                        próxima a atacar
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {debt.creditor} · {TYPE_LABELS[debt.type] ?? debt.type} · {debt.interest_rate_annual}%
                    anual
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">{fmt(debt.current_balance)}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[debt.status] ?? debt.status} · de {fmt(debt.original_amount)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
