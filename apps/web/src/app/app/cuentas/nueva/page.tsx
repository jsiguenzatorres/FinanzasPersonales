import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { Wallet, AlertCircle } from 'lucide-react';
import { createAccountAction } from '@/lib/accounts/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SubmitButton } from '@/components/submit-button';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta corriente' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'digital_wallet', label: 'Billetera digital' },
  { value: 'fx', label: 'Divisas' },
];

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: currencies } = await supabase
    .from('currencies')
    .select('code, name')
    .eq('is_active', true)
    .order('code');

  return (
    <div className="mx-auto max-w-md">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-blue/10">
            <Wallet className="h-5 w-5 text-ff-blue" aria-hidden="true" />
          </div>
          <CardTitle>Nueva cuenta</CardTitle>
          <CardDescription>Registra dónde guardas tu dinero</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <form action={createAccountAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required placeholder="BAC Corriente" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Banco (opcional)</Label>
              <Input id="bank_name" name="bank_name" placeholder="Banco Agrícola" />
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
                <Label htmlFor="initial_balance">Saldo actual</Label>
                <Input
                  id="initial_balance"
                  name="initial_balance"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue="0"
                />
              </div>
            </div>
            <SubmitButton className="w-full">Crear cuenta</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
