import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  defaulted: 'En mora',
  restructured: 'Reestructurado',
  written_off: 'Incobrable',
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
        <Card>
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
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes préstamos con interés registrados. A diferencia de Préstamos Familiares, este
            módulo es para dinero que prestas cobrando interés.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {loans.map((loan) => {
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(n);
            return (
              <Link key={loan.id} href={`/app/mi-cartera/${loan.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium hover:underline">{loan.borrower_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loan.interest_rate_monthly}% mensual · {loan.term_months} meses
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{fmt(loan.balance_pending)}</p>
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABELS[loan.status] ?? loan.status} · de {fmt(loan.total_to_collect ?? 0)}
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
