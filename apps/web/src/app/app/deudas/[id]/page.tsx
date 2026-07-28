import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent, Input, Label } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteDebtAction, createDebtPaymentAction } from '@/lib/debts/actions';

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

export default async function DebtDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: debt } = await supabase.from('debts').select('*').eq('id', id).single();
  if (!debt) notFound();

  const { data: payments } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', id)
    .order('payment_date', { ascending: false });

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: debt.currency }).format(n);
  const today = new Date().toISOString().slice(0, 10);
  const paidOff = debt.original_amount - debt.current_balance;
  const paidPct = debt.original_amount > 0 ? (paidOff / debt.original_amount) * 100 : 0;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/deudas" className="text-sm text-muted-foreground hover:underline">
        ← Deudas
      </Link>

      {error && (
        <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {debt.creditor} · {TYPE_LABELS[debt.type] ?? debt.type} · {debt.interest_rate_annual}% anual
            </p>
            <p className="font-mono text-2xl text-ff-red">{fmt(debt.current_balance)}</p>
            <p className="text-xs text-muted-foreground">
              de {fmt(debt.original_amount)} · {STATUS_LABELS[debt.status] ?? debt.status}
              {debt.payoff_priority === 1 && debt.status === 'active' && (
                <span className="ml-1 text-ff-yellow">· próxima a atacar</span>
              )}
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-ff-green" style={{ width: `${Math.min(paidPct, 100)}%` }} />
          </div>
          <p className="text-right text-xs text-muted-foreground">{paidPct.toFixed(0)}% pagado</p>

          {debt.next_payment_date && (
            <p className="text-sm text-muted-foreground">
              Próximo pago: {debt.next_payment_date}
              {debt.next_payment_amount && ` · ${fmt(debt.next_payment_amount)}`}
            </p>
          )}
          {debt.notes && <p className="text-sm text-muted-foreground">{debt.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/deudas/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteDebtAction}>
              <input type="hidden" name="debt_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {debt.status === 'active' && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="text-sm font-medium">Registrar abono</p>
            <p className="text-xs text-muted-foreground">
              El interés se estima automáticamente sobre el saldo actual — no necesitas calcularlo tú.
            </p>
            <form action={createDebtPaymentAction} className="grid grid-cols-2 gap-3">
              <input type="hidden" name="debt_id" value={id} />
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={debt.monthly_payment ?? undefined}
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

      {payments && payments.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-sm font-medium">Historial de abonos</p>
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.payment_date}
                  {p.is_extra && <span className="text-ff-green"> · extra</span>}
                </span>
                <span className="font-mono text-ff-green">{fmt(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/deudas">Volver</Link>
      </Button>
    </div>
  );
}
