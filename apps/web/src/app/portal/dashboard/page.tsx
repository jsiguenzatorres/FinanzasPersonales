import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@flowfinance/ui';
import { HandCoins, BadgePercent, CheckCircle2 } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { portalSignOutAction } from '@/lib/portal/actions';

const FAMILY_STATUS_LABELS: Record<string, string> = {
  active: 'Pendiente',
  paid: 'Pagado',
  written_off: 'Condonado',
};

const PORTFOLIO_STATUS_LABELS: Record<string, string> = {
  active: 'Pendiente',
  paid: 'Pagado',
  defaulted: 'En mora',
  restructured: 'Reestructurado',
  written_off: 'Incobrable',
};

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(amount);
}

function fmtDate(date: string | null) {
  if (!date) return '—';
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-SV', { dateStyle: 'medium' });
}

export default async function PortalDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect('/portal');
  const email = user.email;

  const [{ data: familyLoans }, { data: portfolioLoans }] = await Promise.all([
    supabase
      .from('family_loans')
      .select('id, user_id, person_name, original_amount, balance, currency, delivery_date, agreed_payment_date, status')
      .eq('person_email', email)
      .order('delivery_date', { ascending: false }),
    supabase
      .from('loan_portfolio')
      .select(
        'id, user_id, borrower_name, principal, currency, interest_rate_monthly, interest_type, term_months, start_date, payment_day, monthly_payment, total_to_collect, balance_pending, status',
      )
      .eq('borrower_email', email)
      .is('deleted_at', null)
      .order('start_date', { ascending: false }),
  ]);

  const familyLoanIds = (familyLoans ?? []).map((l) => l.id);
  const portfolioLoanIds = (portfolioLoans ?? []).map((l) => l.id);

  const [{ data: familyPayments }, { data: portfolioPayments }, { data: lenders }] = await Promise.all([
    familyLoanIds.length > 0
      ? supabase
          .from('family_loan_payments')
          .select('id, loan_id, amount, resulting_balance, paid_at')
          .in('loan_id', familyLoanIds)
          .order('paid_at', { ascending: false })
      : Promise.resolve({ data: [] as { id: string; loan_id: string; amount: number; resulting_balance: number; paid_at: string }[] }),
    portfolioLoanIds.length > 0
      ? supabase
          .from('loan_payments')
          .select('id, loan_id, amount, balance_after, payment_date, installment_number')
          .in('loan_id', portfolioLoanIds)
          .order('payment_date', { ascending: false })
      : Promise.resolve({
          data: [] as { id: string; loan_id: string; amount: number; balance_after: number; payment_date: string; installment_number: number | null }[],
        }),
    supabase
      .from('users')
      .select('id, display_name')
      .in('id', [...new Set([...(familyLoans ?? []).map((l) => l.user_id), ...(portfolioLoans ?? []).map((l) => l.user_id)])]),
  ]);

  const lenderMap = new Map((lenders ?? []).map((l) => [l.id, l.display_name]));
  const familyPaymentsByLoan = new Map<string, typeof familyPayments>();
  for (const p of familyPayments ?? []) {
    const list = familyPaymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    familyPaymentsByLoan.set(p.loan_id, list);
  }
  const portfolioPaymentsByLoan = new Map<string, typeof portfolioPayments>();
  for (const p of portfolioPayments ?? []) {
    const list = portfolioPaymentsByLoan.get(p.loan_id) ?? [];
    list.push(p);
    portfolioPaymentsByLoan.set(p.loan_id, list);
  }

  const allFamily = familyLoans ?? [];
  const allPortfolio = portfolioLoans ?? [];
  const pendingFamily = allFamily.filter((l) => l.status === 'active');
  const closedFamily = allFamily.filter((l) => l.status !== 'active');
  const pendingPortfolio = allPortfolio.filter((l) => l.status === 'active' || l.status === 'defaulted');
  const closedPortfolio = allPortfolio.filter((l) => l.status !== 'active' && l.status !== 'defaulted');

  const hasAnyLoan = allFamily.length > 0 || allPortfolio.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Tu estado de cuenta</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <form action={portalSignOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </div>

      {!hasAnyLoan && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No encontramos préstamos registrados con este correo.
          </CardContent>
        </Card>
      )}

      {pendingFamily.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Préstamos pendientes</p>
          {pendingFamily.map((loan) => (
            <Card key={loan.id} className="animate-fade-in-up">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ff-yellow/10">
                  <HandCoins className="h-5 w-5 text-ff-yellow" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">{lenderMap.get(loan.user_id) ?? 'Préstamo'}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Entregado {fmtDate(loan.delivery_date)}
                    {loan.agreed_payment_date && ` · vence ${fmtDate(loan.agreed_payment_date)}`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-xl">{fmtMoney(loan.balance, loan.currency)}</p>
                  <p className="text-xs text-muted-foreground">de {fmtMoney(loan.original_amount, loan.currency)}</p>
                </div>
                {(familyPaymentsByLoan.get(loan.id)?.length ?? 0) > 0 && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Pagos</p>
                    {familyPaymentsByLoan.get(loan.id)!.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{fmtDate(p.paid_at)}</span>
                        <span className="font-mono">{fmtMoney(p.amount, loan.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {pendingPortfolio.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Préstamos con interés pendientes</p>
          {pendingPortfolio.map((loan) => (
            <Card key={loan.id} className="animate-fade-in-up">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ff-yellow/10">
                  <BadgePercent className="h-5 w-5 text-ff-yellow" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">{lenderMap.get(loan.user_id) ?? 'Préstamo'}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {loan.interest_rate_monthly}% mensual ({loan.interest_type === 'compound' ? 'compuesto' : 'simple'}) ·{' '}
                    {loan.term_months} meses · cobro día {loan.payment_day}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-xl">{fmtMoney(loan.balance_pending, loan.currency)}</p>
                  <p className="text-xs text-muted-foreground">
                    cuota {fmtMoney(loan.monthly_payment ?? 0, loan.currency)}
                  </p>
                </div>
                {(portfolioPaymentsByLoan.get(loan.id)?.length ?? 0) > 0 && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Pagos</p>
                    {portfolioPaymentsByLoan.get(loan.id)!.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {fmtDate(p.payment_date)}
                          {p.installment_number && ` · cuota #${p.installment_number}`}
                        </span>
                        <span className="font-mono">{fmtMoney(p.amount, loan.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {(closedFamily.length > 0 || closedPortfolio.length > 0) && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Historial cerrado</p>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {[...closedFamily.map((l) => ({ ...l, kind: 'family' as const })), ...closedPortfolio.map((l) => ({ ...l, kind: 'portfolio' as const }))].map(
              (loan, i) => (
                <div key={loan.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ff-green/10">
                    <CheckCircle2 className="h-4 w-4 text-ff-green" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{lenderMap.get(loan.user_id) ?? 'Préstamo'}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.kind === 'family'
                        ? (FAMILY_STATUS_LABELS[loan.status] ?? loan.status)
                        : (PORTFOLIO_STATUS_LABELS[loan.status] ?? loan.status)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-muted-foreground">
                    {fmtMoney(loan.kind === 'family' ? loan.original_amount : loan.principal, loan.currency)}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
