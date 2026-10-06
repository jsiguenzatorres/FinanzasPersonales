import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { ChartCandlestick, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteInvestmentAction } from '@/lib/investments/actions';
import { updateCryptoPriceAction } from '@/lib/investments/coingecko';

const TYPE_LABELS: Record<string, string> = {
  stock: 'Acción',
  etf: 'ETF',
  mutual_fund: 'Fondo mutuo',
  bond: 'Bono',
  cete: 'CETE',
  crypto: 'Cripto',
  real_estate: 'Bien raíz',
  business_equity: 'Participación de negocio',
  other: 'Otra',
};

export default async function InvestmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: inv } = await supabase.from('investments').select('*').eq('id', id).single();
  if (!inv) notFound();

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: inv.currency }).format(n);
  const pnl = (inv.current_value ?? 0) - (inv.total_invested ?? 0);
  const pnlPct = (inv.total_invested ?? 0) > 0 ? (pnl / (inv.total_invested ?? 1)) * 100 : 0;
  const metadata = inv.metadata as { coingecko_id?: string } | null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/inversiones" className="text-sm text-muted-foreground hover:underline">
        ← Inversiones
      </Link>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <Card className="animate-fade-in-up">
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${pnl >= 0 ? 'bg-ff-green/10' : 'bg-ff-red/10'}`}
            >
              <ChartCandlestick className={`h-5 w-5 ${pnl >= 0 ? 'text-ff-green' : 'text-ff-red'}`} aria-hidden="true" />
            </div>
            <div>
          <p className="text-sm text-muted-foreground">
            {inv.ticker && `${inv.ticker} · `}
            {TYPE_LABELS[inv.type] ?? inv.type}
            {inv.broker && ` · ${inv.broker}`}
          </p>
          <p className="font-mono text-2xl">{fmt(inv.current_value ?? 0)}</p>
          <p className={`text-sm ${pnl >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
            {pnl >= 0 ? '+' : ''}
            {fmt(pnl)} ({pnl >= 0 ? '+' : ''}
            {pnlPct.toFixed(1)}%)
            </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Cantidad: {inv.quantity}</p>
            <p>Costo promedio: {fmt(inv.avg_cost)}</p>
            <p>Precio actual: {inv.current_price ? fmt(inv.current_price) : 'Sin actualizar'}</p>
            <p>Invertido: {fmt(inv.total_invested ?? 0)}</p>
          </div>

          {inv.last_price_update_at && (
            <p className="text-xs text-muted-foreground">
              Precio actualizado: {new Date(inv.last_price_update_at).toLocaleDateString('es-SV')}
            </p>
          )}
          {inv.notes && <p className="text-sm text-muted-foreground">{inv.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {inv.type === 'crypto' && metadata?.coingecko_id && (
              <form action={updateCryptoPriceAction}>
                <input type="hidden" name="investment_id" value={id} />
                <Button type="submit" size="sm">
                  Actualizar precio (CoinGecko)
                </Button>
              </form>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/inversiones/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteInvestmentAction}>
              <input type="hidden" name="investment_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/inversiones">Volver</Link>
      </Button>
    </div>
  );
}
