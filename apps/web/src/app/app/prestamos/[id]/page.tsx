import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listAttachments } from '@/lib/attachments/actions';
import { AttachmentsSection } from '@/components/attachments-section';
import { writeOffFamilyLoanAction, deleteFamilyLoanAction } from '@/lib/loans/actions';

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  debit: 'Débito',
  credit_purchase: 'Compra con tarjeta',
  credit_cash_advance: 'Retiro de efectivo con tarjeta',
  bitcoin: 'Bitcoin',
  crypto: 'Criptomoneda',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paid: 'Pagado',
  written_off: 'Incobrable',
};

export default async function FamilyLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: loan } = await supabase.from('family_loans').select('*').eq('id', id).single();
  if (!loan) notFound();

  const [{ data: payments }, attachments] = await Promise.all([
    supabase
      .from('family_loan_payments')
      .select('*')
      .eq('loan_id', id)
      .order('paid_at', { ascending: false }),
    listAttachments('family_loan', id),
  ]);

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(n);
  const isOverdue = loan.status === 'active' && loan.agreed_payment_date && new Date(loan.agreed_payment_date) < new Date();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/prestamos" className="text-sm text-muted-foreground hover:underline">
        ← Préstamos
      </Link>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {loan.person_name} {loan.relationship ? `· ${loan.relationship}` : ''}
            </p>
            <p className="font-mono text-2xl text-ff-yellow">{fmt(loan.balance)}</p>
            <p className="text-xs text-muted-foreground">de {fmt(loan.original_amount)} prestados</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Entrega: {loan.delivery_date}</p>
            <p>Modalidad: {DELIVERY_METHOD_LABELS[loan.delivery_method] ?? loan.delivery_method}</p>
            <p>Estado: {STATUS_LABELS[loan.status] ?? loan.status}</p>
            {loan.category && <p>Categoría: {loan.category}</p>}
          </div>
          {loan.agreed_payment_date && (
            <p className={`text-sm ${isOverdue ? 'text-ff-red' : 'text-muted-foreground'}`}>
              Pago acordado: {loan.agreed_payment_date}
              {isOverdue && ' — vencido'}
            </p>
          )}
          {loan.notes && <p className="text-sm text-muted-foreground">{loan.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {loan.status === 'active' && (
              <Button asChild size="sm">
                <Link href={`/app/prestamos/${id}/abono`}>Registrar abono</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/prestamos/${id}/editar`}>Editar</Link>
            </Button>
            {loan.status === 'active' && (
              <form action={writeOffFamilyLoanAction}>
                <input type="hidden" name="loan_id" value={id} />
                <Button type="submit" variant="ghost" size="sm" className="text-ff-yellow">
                  Marcar incobrable
                </Button>
              </form>
            )}
            <form action={deleteFamilyLoanAction}>
              <input type="hidden" name="loan_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {payments && payments.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-sm font-medium">Historial de abonos</p>
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{p.paid_at}</span>
                <span className="font-mono text-ff-green">{fmt(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-5">
          <AttachmentsSection entityType="family_loan" entityId={id} initialAttachments={attachments} />
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/prestamos">Volver</Link>
      </Button>
    </div>
  );
}
