import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Total pendiente</p>
              <p className="font-mono text-xl text-ff-yellow">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalPending)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Vencidos sin abonar</p>
              <p className={`font-mono text-xl ${overdue.length > 0 ? 'text-ff-red' : 'text-ff-green'}`}>
                {overdue.length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loans || loans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes préstamos registrados. Registra el primero cuando le prestes dinero a un familiar o amigo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {loans.map((loan) => {
            const isOverdue =
              loan.status === 'active' && loan.agreed_payment_date && new Date(loan.agreed_payment_date) < new Date();
            return (
              <Link key={loan.id} href={`/app/prestamos/${loan.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium hover:underline">{loan.person_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loan.relationship ?? 'Sin relación especificada'} · {loan.delivery_date}
                        {isOverdue && <span className="text-ff-red"> · vencido</span>}
                      </p>
                    </div>
                    <div className="text-right">
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
