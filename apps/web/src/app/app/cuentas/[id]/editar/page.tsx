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
import { editAccountAction } from '@/lib/accounts/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta corriente' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'digital_wallet', label: 'Billetera digital' },
  { value: 'fx', label: 'Divisas' },
];

export default async function EditAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, type, bank_name, currency, balance')
    .eq('id', id)
    .single();

  if (!account) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Editar cuenta</CardTitle>
          <CardDescription>
            Moneda ({account.currency}) y saldo no son editables aquí — el saldo se calcula
            automáticamente de tus movimientos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}
          <form action={editAccountAction} className="space-y-4">
            <input type="hidden" name="account_id" value={account.id} />
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required defaultValue={account.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={account.type}
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
              <Input id="bank_name" name="bank_name" defaultValue={account.bank_name ?? ''} />
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
