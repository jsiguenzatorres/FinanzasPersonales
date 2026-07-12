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
import { createCreditCardAction } from '@/lib/credit-cards/actions';
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

export default async function NewCreditCardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: currencies } = await supabase
    .from('currencies')
    .select('code')
    .eq('is_active', true)
    .order('code');

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Nueva tarjeta de crédito</CardTitle>
          <CardDescription>Registra tu tarjeta para trackear cargos y evitar intereses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}

          <form action={createCreditCardAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Banco</Label>
              <select
                id="bank_name"
                name="bank_name"
                required
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
              <Input id="card_name" name="card_name" required placeholder="Visa Platinum" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="card_brand">Marca</Label>
                <select
                  id="card_brand"
                  name="card_brand"
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
                <Input id="card_number_mask" name="card_number_mask" maxLength={4} placeholder="1234" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  name="currency"
                  required
                  defaultValue="USD"
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {(currencies ?? []).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
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
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="current_balance">Saldo actual (si ya tiene deuda)</Label>
              <Input
                id="current_balance"
                name="current_balance"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cut_day">Día de corte</Label>
                <Input id="cut_day" name="cut_day" type="number" min="1" max="31" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_due_day">Día de pago</Label>
                <Input id="payment_due_day" name="payment_due_day" type="number" min="1" max="31" required />
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
                  placeholder="36"
                  required
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
                  defaultValue="5"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Crear tarjeta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
