import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listAttachments } from '@/lib/attachments/actions';
import { AttachmentsSection } from '@/components/attachments-section';

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: expense } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!expense) notFound();

  const [{ data: category }, attachments, { data: linkedLoan }] = await Promise.all([
    expense.category_id
      ? supabase.from('categories').select('name').eq('id', expense.category_id).single()
      : Promise.resolve({ data: null as { name: string } | null }),
    listAttachments('transaction', id),
    supabase
      .from('family_loans')
      .select('id, person_name, linked_amount')
      .eq('transaction_id', id)
      .maybeSingle(),
  ]);

  const amountFmt = new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: expense.currency,
  }).format(expense.amount);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/gastos" className="text-sm text-muted-foreground hover:underline">
        ← Gastos
      </Link>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {expense.merchant_name || expense.description || 'Gasto'}
            </p>
            <p className="font-mono text-2xl text-ff-red">-{amountFmt}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Fecha: {expense.transaction_date}</p>
            <p>Categoría: {category?.name ?? 'Sin categoría'}</p>
          </div>
          {expense.description && expense.merchant_name && (
            <p className="text-sm">{expense.description}</p>
          )}
          {expense.notes && <p className="text-sm text-muted-foreground">{expense.notes}</p>}

          {linkedLoan ? (
            <p className="rounded-md border border-ff-yellow/30 bg-ff-yellow/10 px-3 py-2 text-xs text-ff-yellow">
              {linkedLoan.linked_amount
                ? `${new Intl.NumberFormat('es-SV', { style: 'currency', currency: expense.currency }).format(linkedLoan.linked_amount)} de este gasto`
                : 'Este gasto completo'}{' '}
              es un préstamo a {linkedLoan.person_name} —{' '}
              <Link href={`/app/prestamos/${linkedLoan.id}`} className="underline">
                ver préstamo
              </Link>
            </p>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/prestamos/nuevo?existing_transaction_id=${id}`}>Vincular a préstamo</Link>
            </Button>
          )}

          <Button asChild variant="outline" size="sm">
            <Link href={`/app/gastos/${id}/editar`}>Editar</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <AttachmentsSection entityType="transaction" entityId={id} initialAttachments={attachments} />
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/gastos">Volver</Link>
      </Button>
    </div>
  );
}
