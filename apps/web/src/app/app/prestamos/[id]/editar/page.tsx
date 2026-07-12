import { notFound } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { editFamilyLoanAction } from '@/lib/loans/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const LOAN_CATEGORIES = [
  'Alimentos',
  'Reparación hogar',
  'Reparación carro',
  'Colegiatura',
  'Recibos / servicios',
  'Gastos médicos',
  'Deudas / créditos',
  'Ropa',
  'Evento / celebración',
  'Herramientas / negocio',
  'Viaje / transporte',
  'Otro',
];

export default async function EditFamilyLoanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: loan } = await supabase.from('family_loans').select('*').eq('id', id).single();

  if (!loan) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Editar préstamo</CardTitle>
          <CardDescription>
            El monto, moneda y modalidad de entrega no son editables — reflejan un movimiento real ya
            registrado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}
          <form action={editFamilyLoanAction} className="space-y-4">
            <input type="hidden" name="loan_id" value={loan.id} />
            <div className="space-y-1.5">
              <Label htmlFor="person_name">Nombre del deudor</Label>
              <Input id="person_name" name="person_name" required defaultValue={loan.person_name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="relationship">Relación</Label>
              <Input id="relationship" name="relationship" defaultValue={loan.relationship ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría de destino</Label>
              <select
                id="category"
                name="category"
                defaultValue={loan.category ?? ''}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin categoría</option>
                {LOAN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agreed_payment_date">Fecha de pago acordada</Label>
              <Input
                id="agreed_payment_date"
                name="agreed_payment_date"
                type="date"
                defaultValue={loan.agreed_payment_date ?? ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" name="notes" defaultValue={loan.notes ?? ''} />
            </div>
            <Button type="submit" className="w-full">
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
