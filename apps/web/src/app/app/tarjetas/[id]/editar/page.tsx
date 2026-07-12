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
import { editCreditCardAction } from '@/lib/credit-cards/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const SV_BANKS = [
  'BAC Credomatic',
  'Banco Agrícola',
  'Banco Cuscatlán',
  'Davivienda',
  'Banco Promerica',
  'Banco Hipotecario',
  'Banco Azul',
  'Otro',
];

const CARD_BRANDS = ['Visa', 'MasterCard', 'American Express', 'Discover'];

export default async function EditCreditCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: card } = await supabase.from('credit_cards').select('*').eq('id', id).single();

  if (!card) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Editar tarjeta</CardTitle>
          <CardDescription>
            Moneda ({card.currency}) y saldo actual no son editables aquí — el saldo se calcula de
            tus cargos y pagos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}

          <form action={editCreditCardAction} className="space-y-4">
            <input type="hidden" name="card_id" value={card.id} />

            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Banco</Label>
              <select
                id="bank_name"
                name="bank_name"
                required
                defaultValue={card.bank_name}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SV_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card_name">Nombre de la tarjeta</Label>
              <Input id="card_name" name="card_name" required defaultValue={card.card_name} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="card_brand">Marca</Label>
                <select
                  id="card_brand"
                  name="card_brand"
                  defaultValue={card.card_brand ?? ''}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CARD_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card_number_mask">Últimos 4 dígitos</Label>
                <Input
                  id="card_number_mask"
                  name="card_number_mask"
                  maxLength={4}
                  defaultValue={card.card_number_mask ?? ''}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="credit_limit">Límite de crédito</Label>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={card.credit_limit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cut_day">Día de corte</Label>
                <Input
                  id="cut_day"
                  name="cut_day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  defaultValue={card.cut_day}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_due_day">Día de pago</Label>
                <Input
                  id="payment_due_day"
                  name="payment_due_day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  defaultValue={card.payment_due_day}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="interest_rate_annual_pct">Tasa anual (%)</Label>
                <Input
                  id="interest_rate_annual_pct"
                  name="interest_rate_annual_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={card.interest_rate_annual * 100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min_payment_pct">Pago mínimo (%)</Label>
                <Input
                  id="min_payment_pct"
                  name="min_payment_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={card.min_payment_pct ?? 5}
                />
              </div>
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
