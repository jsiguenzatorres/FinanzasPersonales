import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { HandCoins, AlertTriangle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  written_off: 'Incobrable',
};

export default async function FamilyLoansPage() {
  const supabase = await createSupabaseServerClient();
  const { data: loans } = await supabase
    .from('family_loans')
    .select('*')
    .order('status', { ascending: true })
    .order('delivery_date', { ascending: false });

  const active = (loans ?? []).filter((l) => l.status === 'active');
  const totalPending = active.reduce((sum, l) => sum + l.balance, 0);
  const overdue = active.filter((l) => {
    if (!l.agreed_payment_date) return false;
    return new Date(l.agreed_payment_date) < new Date();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Préstamos Familiares</h1>
        <Button asChild>
          <Link href="/app/prestamos/nuevo">+ Nuevo préstamo</Link>
        </Button>
      </div>

      {active.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="animate-fade-in-up border-t-[3px] border-t-ff-yellow">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Total pendiente</p>
              <p className="font-mono text-xl text-ff-yellow">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalPending)}
              </p>
            </CardContent>
          </Card>
          <Card
            className={`animate-fade-in-up border-t-[3px] ${overdue.length > 0 ? 'border-t-ff-red' : 'border-t-ff-green'}`}
            style={{ animationDelay: '40ms' }}
          >
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Vencidos sin abonar</p>
              <p className={`font-mono text-xl ${overdue.length > 0 ? 'text-ff-red' : 'text-ff-green'}`}>
                {overdue.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loans || loans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-yellow/10">
              <HandCoins className="h-6 w-6 text-ff-yellow" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes préstamos registrados. Registra el primero cuando le prestes dinero a un
              familiar o amigo.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/prestamos/nuevo">+ Nuevo préstamo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {loans.map((loan, i) => {
            const isOverdue =
              loan.status === 'active' && loan.agreed_payment_date && new Date(loan.agreed_payment_date) < new Date();
            const initial = loan.person_name.charAt(0).toUpperCase();
            return (
              <Link
                key={loan.id}
                href={`/app/prestamos/${loan.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 active:bg-landing-terracotta/10 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    isOverdue ? 'bg-ff-red/10 text-ff-red' : 'bg-ff-yellow/10 text-ff-yellow'
                  }`}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{loan.person_name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {loan.relationship ?? 'Sin relación especificada'} · {loan.delivery_date}
                    {isOverdue && (
                      <span className="flex items-center gap-1 rounded-full bg-ff-red/10 px-2 py-0.5 text-ff-red">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        vencido
                      </span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">
                    {new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(
                      loan.balance,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[loan.status] ?? loan.status} · de{' '}
                    {new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(
                      loan.original_amount,
                    )}
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
