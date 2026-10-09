import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { BadgePercent, AlertCircle } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { editLoanPortfolioAction } from '@/lib/loan-portfolio/actions';

export default async function EditLoanPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: loan } = await supabase.from('loan_portfolio').select('*').eq('id', id).single();
  if (!loan) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-yellow/10">
            <BadgePercent className="h-5 w-5 text-ff-yellow" aria-hidden="true" />
          </div>
          <CardTitle>Editar préstamo</CardTitle>
          <CardDescription>
            Solo datos del deudor y estado — el monto, tasa y plazo no se pueden cambiar sin reestructurar
            (fuera de v1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <form action={editLoanPortfolioAction} className="space-y-4">
            <input type="hidden" name="loan_id" value={loan.id} />

            <div className="space-y-1.5">
              <Label htmlFor="borrower_name">Nombre del deudor</Label>
              <Input id="borrower_name" name="borrower_name" required defaultValue={loan.borrower_name} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="borrower_phone">Teléfono (opcional)</Label>
                <Input id="borrower_phone" name="borrower_phone" defaultValue={loan.borrower_phone ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="borrower_email">Correo (opcional)</Label>
                <Input id="borrower_email" name="borrower_email" type="email" defaultValue={loan.borrower_email ?? ''} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={loan.status}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Activo</option>
                <option value="paid">Pagado</option>
                <option value="defaulted">En mora</option>
                <option value="restructured">Reestructurado</option>
                <option value="written_off">Incobrable</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" name="notes" defaultValue={loan.notes ?? ''} />
            </div>

            <SubmitButton className="w-full">Guardar cambios</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
