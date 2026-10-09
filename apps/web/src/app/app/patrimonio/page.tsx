import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { LineChart, Wallet, TrendingDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { takeSnapshotAction } from '@/lib/net-worth/actions';
import { AnimatedNumber } from '@/components/animated-number';

interface AssetsBreakdown {
  cash: number;
  manual: number;
  investments: number;
  receivables: number;
}

interface LiabilitiesBreakdown {
  credit_cards: number;
  overdrafts: number;
  manual: number;
  personal_debts: number;
}

export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: netWorth } = await supabase.from('v_net_worth_current').select('*').single();

  const { data: lastSnapshot } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currency = netWorth?.currency ?? 'USD';
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(n);

  const totalAssets = netWorth?.total_assets ?? 0;
  const totalLiabilities = netWorth?.total_liabilities ?? 0;
  const netWorthValue = netWorth?.net_worth ?? 0;

  const assetsBreakdown = (netWorth?.assets_breakdown as unknown as AssetsBreakdown | null) ?? {
    cash: 0,
    manual: 0,
    investments: 0,
    receivables: 0,
  };
  const liabilitiesBreakdown = (netWorth?.liabilities_breakdown as unknown as LiabilitiesBreakdown | null) ?? {
    credit_cards: 0,
    overdrafts: 0,
    manual: 0,
    personal_debts: 0,
  };

  const delta = lastSnapshot ? netWorthValue - (lastSnapshot.net_worth ?? 0) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Patrimonio Neto</h1>
        <form action={takeSnapshotAction}>
          <Button type="submit" variant="outline" size="sm">
            Tomar snapshot ahora
          </Button>
        </form>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <Card className="animate-fade-in-up">
        <CardContent className="py-8 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-ff-green/10">
            <LineChart className={`h-5 w-5 ${netWorthValue >= 0 ? 'text-ff-green' : 'text-ff-red'}`} aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">Patrimonio neto</p>
          <p className={`font-mono text-4xl ${netWorthValue >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
            <AnimatedNumber value={netWorthValue} format={{ kind: 'currency', currency }} />
          </p>
          {delta !== null && lastSnapshot ? (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  delta >= 0 ? 'bg-ff-green/10 text-ff-green' : 'bg-ff-red/10 text-ff-red'
                }`}
              >
                {delta >= 0 ? (
                  <ArrowUp className="h-3 w-3 animate-arrow-bounce" aria-hidden="true" />
                ) : (
                  <ArrowDown className="h-3 w-3" aria-hidden="true" />
                )}
                {fmt(Math.abs(delta))}
              </span>
              <span className="text-xs text-muted-foreground">
                desde el último snapshot ({lastSnapshot.snapshot_date})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Toma tu primer snapshot para empezar a ver la evolución
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="animate-fade-in-up border-t-[3px] border-t-ff-green" style={{ animationDelay: '60ms' }}>
          <CardContent className="py-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-ff-green/10">
                <Wallet className="h-4 w-4 text-ff-green" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
            <p className="font-mono text-xl text-ff-green">{fmt(totalAssets)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Efectivo / Cuentas: {fmt(assetsBreakdown.cash)}</p>
              <p>Activos manuales: {fmt(assetsBreakdown.manual)}</p>
              {assetsBreakdown.investments > 0 && <p>Inversiones: {fmt(assetsBreakdown.investments)}</p>}
              {assetsBreakdown.receivables > 0 && (
                <p>Préstamos por cobrar: {fmt(assetsBreakdown.receivables)}</p>
              )}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/app/patrimonio/activos">Gestionar activos manuales</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up border-t-[3px] border-t-ff-red" style={{ animationDelay: '100ms' }}>
          <CardContent className="py-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-ff-red/10">
                <TrendingDown className="h-4 w-4 text-ff-red" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">Pasivos</p>
            </div>
            <p className="font-mono text-xl text-ff-red">{fmt(totalLiabilities)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Tarjetas de crédito: {fmt(liabilitiesBreakdown.credit_cards)}</p>
              <p>Sobregiros: {fmt(liabilitiesBreakdown.overdrafts)}</p>
              <p>Pasivos manuales: {fmt(liabilitiesBreakdown.manual)}</p>
              {liabilitiesBreakdown.personal_debts > 0 && (
                <p>Deudas propias: {fmt(liabilitiesBreakdown.personal_debts)}</p>
              )}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/app/patrimonio/pasivos">Gestionar pasivos manuales</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
