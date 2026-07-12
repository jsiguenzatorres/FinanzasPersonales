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
import { registerPaymentAction } from '@/lib/credit-cards/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function CardPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: card }, { data: accounts }] = await Promise.all([
    supabase.from('credit_cards').select('*').eq('id', id).single(),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('is_archived', false)
      .order('created_at', { ascending: true }),
  ]);

  if (!card) {
    return <p className="text-muted-foreground">Tarjeta no encontrada.</p>;
  }

  const paymentNoInterest = card.current_balance;
  const minimumPayment = Math.max(card.current_balance * ((card.min_payment_pct ?? 5) / 100), 10);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>
            Registrar pago — {card.bank_name} {card.card_name}
          </CardTitle>
          <CardDescription>
            Saldo actual:{' '}
            {new Intl.NumberFormat('es-SV', { style: 'currency', currency: card.currency }).format(
              card.current_balance,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}

          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
            <p>
              Para no generar intereses:{' '}
              <span className="font-mono text-ff-green">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: card.currency }).format(
                  paymentNoInterest,
                )}
              </span>
            </p>
            <p>
              Pago mínimo:{' '}
              <span className="font-mono text-ff-yellow">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: card.currency }).format(
                  minimumPayment,
                )}
              </span>
            </p>
          </div>

          <form action={registerPaymentAction} className="space-y-4">
            <input type="hidden" name="card_id" value={card.id} />

            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto a pagar</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={paymentNoInterest.toFixed(2)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account_id">Cuenta de origen</Label>
              <select
                id="account_id"
                name="account_id"
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
                <p className="text-xs text-ff-red">
                  No tienes cuentas activas. Crea una primero en Cuentas.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_date">Fecha de pago</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!accounts || accounts.length === 0}>
              Registrar pago
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
