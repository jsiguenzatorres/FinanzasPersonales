import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import {
  Landmark,
  PiggyBank,
  Banknote,
  CreditCard,
  TrendingUp,
  Smartphone,
  ArrowLeftRight,
  Layers,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveAccountAction, deleteAccountAction } from '@/lib/accounts/actions';
import { AnimatedNumber } from '@/components/animated-number';

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

const ACCOUNT_TYPE_META: Record<string, { icon: typeof Landmark; tint: string; iconColor: string }> = {
  checking: { icon: Landmark, tint: 'bg-ff-blue/10', iconColor: 'text-ff-blue' },
  savings: { icon: PiggyBank, tint: 'bg-ff-green/10', iconColor: 'text-ff-green' },
  cash: { icon: Banknote, tint: 'bg-ff-green/10', iconColor: 'text-ff-green' },
  credit_card: { icon: CreditCard, tint: 'bg-ff-red/10', iconColor: 'text-ff-red' },
  investment: { icon: TrendingUp, tint: 'bg-ff-purple/10', iconColor: 'text-ff-purple' },
  digital_wallet: { icon: Smartphone, tint: 'bg-ff-blue/10', iconColor: 'text-ff-blue' },
  fx: { icon: ArrowLeftRight, tint: 'bg-ff-orange/10', iconColor: 'text-ff-orange' },
  virtual: { icon: Layers, tint: 'bg-ff-purple/10', iconColor: 'text-ff-purple' },
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {!accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full animate-empty-breathe bg-ff-blue/10">
              <Wallet className="h-6 w-6 text-ff-blue" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes cuentas. Crea la primera para empezar a registrar tus finanzas.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/cuentas/nueva">+ Nueva cuenta</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, i) => {
            const meta = ACCOUNT_TYPE_META[account.type] ?? ACCOUNT_TYPE_META.checking!;
            const Icon = meta.icon;
            const isNegative = account.balance < 0;
            return (
              <Card
                key={account.id}
                className="animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-landing-terracotta/50"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${meta.tint}`}
                    >
                      <Icon className={`h-5 w-5 ${meta.iconColor}`} aria-hidden="true" />
                      {(account.type === 'savings' || account.type === 'cash') && (
                        <span className="animate-coin-drop absolute top-0.5 h-1.5 w-1.5 rounded-full bg-landing-gold" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{account.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                        {account.bank_name ? ` · ${account.bank_name}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className={`font-mono text-xl ${isNegative ? 'text-ff-red' : 'text-ff-green'}`}>
                    <AnimatedNumber value={account.balance} format={{ kind: 'currency', currency: account.currency }} />
                  </p>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/cuentas/${account.id}/editar`}>Editar</Link>
                    </Button>
                    <form action={archiveAccountAction}>
                      <input type="hidden" name="account_id" value={account.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Archivar
                      </Button>
                    </form>
                    <form action={deleteAccountAction}>
                      <input type="hidden" name="account_id" value={account.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
