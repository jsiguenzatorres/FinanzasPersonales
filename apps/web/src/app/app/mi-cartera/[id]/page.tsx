import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent, Input, Label } from '@flowfinance/ui';
import { BadgePercent, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteLoanPortfolioAction } from '@/lib/loan-portfolio/actions';
import { createLoanPortfolioPaymentAction } from '@/lib/loan-portfolio/payments';
import type { AmortizationInstallment } from '@flowfinance/shared/utils';
import { ConfettiBurst } from '@/components/confetti-burst';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  defaulted: 'En mora',
  restructured: 'Reestructurado',
  written_off: 'Incobrable',
};

export default async function LoanPortfolioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; celebrate?: string }>;
}) {
  const { id } = await params;
  const { error, celebrate } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: loan } = await supabase.from('loan_portfolio').select('*').eq('id', id).single();
  if (!loan) notFound();

  const { data: payments } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', id)
    .order('installment_number', { ascending: true });

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(n);
  const schedule = (loan.amortization as unknown as AmortizationInstallment[]) ?? [];
  const paidCount = payments?.length ?? 0;
  const nextInstallment = schedule[paidCount];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ConfettiBurst active={celebrate === '1'} />

      <Link href="/app/mi-cartera" className="text-sm text-muted-foreground hover:underline">
        ← Mi Cartera
      </Link>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <Card className="animate-fade-in-up">
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ff-yellow/10">
              <BadgePercent className="h-5 w-5 text-ff-yellow" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {loan.borrower_name} · {loan.interest_rate_monthly}% mensual{' '}
                {loan.interest_type === 'compound' ? 'compuesto' : 'simple'} · {loan.term_months} meses
              </p>
              <p className="font-mono text-2xl text-ff-yellow">{fmt(loan.balance_pending)}</p>
              <p className="text-xs text-muted-foreground">
                de {fmt(loan.total_to_collect ?? 0)} totales · {STATUS_LABELS[loan.status] ?? loan.status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Capital: {fmt(loan.principal)}</p>
            <p>Interés total: {fmt(loan.total_interest ?? 0)}</p>
            <p>Cuota mensual: {fmt(loan.monthly_payment ?? 0)}</p>
            <p>Cuotas pagadas: {paidCount}/{loan.term_months}</p>
            {loan.late_count > 0 && <p className="text-ff-red">Cuotas con mora: {loan.late_count}</p>}
          </div>

          {loan.notes && <p className="text-sm text-muted-foreground">{loan.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/mi-cartera/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteLoanPortfolioAction}>
              <input type="hidden" name="loan_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {nextInstallment && loan.status === 'active' && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="text-sm font-medium">
              Registrar abono — cuota #{nextInstallment.installment_number} (vence{' '}
              {nextInstallment.scheduled_date}, {fmt(nextInstallment.payment)})
            </p>
            <form action={createLoanPortfolioPaymentAction} className="grid grid-cols-2 gap-3">
              <input type="hidden" name="loan_id" value={id} />
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={nextInstallment.payment}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_date">Fecha</Label>
                <Input id="payment_date" name="payment_date" type="date" required defaultValue={today} />
              </div>
              <Button type="submit" size="sm" className="col-span-2">
                Registrar abono
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-5">
          <p className="mb-3 text-sm font-medium">Tabla de amortización</p>
          <div className="max-h-96 space-y-1 overflow-y-auto text-xs">
            <div className="grid grid-cols-5 gap-2 border-b border-border pb-1 font-medium text-muted-foreground">
              <span>#</span>
              <span>Fecha</span>
              <span>Capital</span>
              <span>Interés</span>
              <span>Estado</span>
            </div>
            {schedule.map((inst, i) => (
              <div
                key={inst.installment_number}
                className={`grid grid-cols-5 gap-2 py-1 ${i < paidCount ? 'text-muted-foreground' : ''}`}
              >
                <span>{inst.installment_number}</span>
                <span>{inst.scheduled_date}</span>
                <span className="font-mono">{fmt(inst.principal_portion)}</span>
                <span className="font-mono">{fmt(inst.interest_portion)}</span>
                <span className={i < paidCount ? 'text-ff-green' : ''}>{i < paidCount ? 'Pagada' : 'Pendiente'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {payments && payments.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-sm font-medium">Historial de abonos</p>
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Cuota #{p.installment_number} · {p.payment_date}
                  {p.days_late! > 0 && <span className="text-ff-red"> · {p.days_late} días de mora</span>}
                </span>
                <span className="font-mono text-ff-green">{fmt(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/mi-cartera">Volver</Link>
      </Button>
    </div>
  );
}
