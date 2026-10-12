import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { Banknote } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { createFamilyLoanPaymentAction } from '@/lib/loans/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewLoanPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: loan }, { data: accounts }] = await Promise.all([
    supabase.from('family_loans').select('id, person_name, balance, currency').eq('id', id).single(),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
  ]);

  if (!loan) notFound();

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: loan.currency }).format(n);

  return (
    <div className="mx-auto max-w-md">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-green/10">
            <Banknote className="h-5 w-5 text-ff-green" aria-hidden="true" />
          </div>
          <CardTitle>Registrar abono</CardTitle>
          <CardDescription>
            {loan.person_name} — saldo pendiente {fmt(loan.balance)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createFamilyLoanPaymentAction} className="space-y-4">
            <input type="hidden" name="loan_id" value={loan.id} />
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto del abono</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={loan.balance}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination_account_id">Cuenta destino</Label>
              <select
                id="destination_account_id"
                name="destination_account_id"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(accounts ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              {(!accounts || accounts.length === 0) && (
                <p className="text-xs text-ff-red">No tienes cuentas activas registradas.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Modalidad recibida (opcional)</Label>
              <Input id="payment_method" name="payment_method" placeholder="Efectivo, transferencia..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid_at">Fecha</Label>
              <Input
                id="paid_at"
                name="paid_at"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" name="notes" placeholder="Notas adicionales" />
            </div>
            <SubmitButton className="w-full" disabled={!accounts || accounts.length === 0}>
              Registrar abono
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
