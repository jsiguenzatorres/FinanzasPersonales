import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { takeSnapshotAction } from '@/lib/net-worth/actions';

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
        <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Patrimonio neto</p>
          <p
            className={`font-mono text-4xl ${netWorthValue >= 0 ? 'text-ff-green' : 'text-ff-red'}`}
          >
            {fmt(netWorthValue)}
          </p>
          {delta !== null && lastSnapshot && (
            <p className={`mt-2 text-sm ${delta >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
              {delta >= 0 ? '↑' : '↓'} {fmt(Math.abs(delta))} desde el último snapshot (
              {lastSnapshot.snapshot_date})
            </p>
          )}
          {!lastSnapshot && (
            <p className="mt-2 text-sm text-muted-foreground">
              Toma tu primer snapshot para empezar a ver la evolución
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Activos</p>
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

        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Pasivos</p>
            <p className="font-mono text-xl text-ff-red">{fmt(totalLiabilities)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Tarjetas de crédito: {fmt(liabilitiesBreakdown.credit_cards)}</p>
              <p>Sobregiros: {fmt(liabilitiesBreakdown.overdrafts)}</p>
              <p>Pasivos manuales: {fmt(liabilitiesBreakdown.manual)}</p>
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
