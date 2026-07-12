import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveAccountAction } from '@/lib/accounts/actions';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Cuenta corriente',
  savings: 'Ahorro',
  cash: 'Efectivo',
  credit_card: 'Tarjeta de crédito',
  investment: 'Inversión',
  digital_wallet: 'Billetera digital',
  fx: 'Divisas',
  virtual: 'Bolsillo virtual',
};

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Cuentas</h1>
        <Button asChild>
          <Link href="/app/cuentas/nueva">+ Nueva cuenta</Link>
        </Button>
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes cuentas. Crea la primera para empezar a registrar tus finanzas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle className="text-base">{account.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                  {account.bank_name ? ` · ${account.bank_name}` : ''}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xl text-ff-green">
                  {new Intl.NumberFormat('es-SV', {
                    style: 'currency',
                    currency: account.currency,
                  }).format(account.balance)}
                </p>
                <form action={archiveAccountAction}>
                  <input type="hidden" name="account_id" value={account.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Archivar
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
