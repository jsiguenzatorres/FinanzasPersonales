import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { BadgePercent } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  defaulted: 'En mora',
  restructured: 'Reestructurado',
  written_off: 'Incobrable',
};

const STATUS_TINT: Record<string, string> = {
  active: 'bg-ff-yellow/10 text-ff-yellow',
  paid: 'bg-ff-green/10 text-ff-green',
  defaulted: 'bg-ff-red/10 text-ff-red',
  restructured: 'bg-ff-blue/10 text-ff-blue',
  written_off: 'bg-muted text-muted-foreground',
};

export default async function LoanPortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const { data: loans } = await supabase
    .from('loan_portfolio')
    .select('*')
    .is('deleted_at', null)
    .order('status', { ascending: true })
    .order('start_date', { ascending: false });

  const active = (loans ?? []).filter((l) => l.status === 'active');
  const totalPending = active.reduce((sum, l) => sum + l.balance_pending, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Mi Cartera</h1>
        <Button asChild>
          <Link href="/app/mi-cartera/nuevo">+ Nuevo préstamo</Link>
        </Button>
      </div>

      {active.length > 0 && (
        <Card className="animate-fade-in-up border-t-[3px] border-t-ff-yellow">
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">Total pendiente de cobrar</p>
            <p className="font-mono text-xl text-ff-yellow">
              {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalPending)}
            </p>
          </CardContent>
        </Card>
      )}

      {!loans || loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-yellow/10">
              <BadgePercent className="h-6 w-6 text-ff-yellow" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes préstamos con interés registrados. A diferencia de Préstamos Familiares,
              este módulo es para dinero que prestas cobrando interés.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/mi-cartera/nuevo">+ Nuevo préstamo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {loans.map((loan, i) => {
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(n);
            const tint = STATUS_TINT[loan.status] ?? STATUS_TINT.active!;
            const initial = loan.borrower_name.charAt(0).toUpperCase();
            return (
              <Link
                key={loan.id}
                href={`/app/mi-cartera/${loan.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs ${tint}`}>
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{loan.borrower_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.interest_rate_monthly}% mensual · {loan.term_months} meses
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">{fmt(loan.balance_pending)}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[loan.status] ?? loan.status} · de {fmt(loan.total_to_collect ?? 0)}
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
