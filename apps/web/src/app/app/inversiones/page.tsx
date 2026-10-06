import Link from 'next/link';
import { Card, CardContent, Button } from '@flowfinance/ui';
import { ChartCandlestick } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

export default async function InvestmentsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: investments } = await supabase
    .from('investments')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const totalValue = (investments ?? []).reduce((sum, i) => sum + (i.current_value ?? 0), 0);
  const totalInvested = (investments ?? []).reduce((sum, i) => sum + (i.total_invested ?? 0), 0);
  const totalPnl = totalValue - totalInvested;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Inversiones</h1>
        <Button asChild>
          <Link href="/app/inversiones/nueva">+ Agregar</Link>
        </Button>
      </div>

      {investments && investments.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="animate-fade-in-up border-t-[3px] border-t-ff-green">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-mono text-xl text-ff-green">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalValue)}
              </p>
            </CardContent>
          </Card>
          <Card
            className={`animate-fade-in-up border-t-[3px] ${totalPnl >= 0 ? 'border-t-ff-green' : 'border-t-ff-red'}`}
            style={{ animationDelay: '40ms' }}
          >
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Ganancia/pérdida no realizada</p>
              <p className={`font-mono text-xl ${totalPnl >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
                {totalPnl >= 0 ? '+' : ''}
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalPnl)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!investments || investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-purple/10">
              <ChartCandlestick className="h-6 w-6 text-ff-purple" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes inversiones registradas. Agrega acciones, ETFs, cripto, o cualquier otro
              activo que estés siguiendo.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/inversiones/nueva">+ Agregar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {investments.map((inv, i) => {
            const pnl = (inv.current_value ?? 0) - (inv.total_invested ?? 0);
            return (
              <Link
                key={inv.id}
                href={`/app/inversiones/${inv.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 active:bg-landing-terracotta/10 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    pnl >= 0 ? 'bg-ff-green/10' : 'bg-ff-red/10'
                  }`}
                >
                  <ChartCandlestick className={`h-4 w-4 ${pnl >= 0 ? 'text-ff-green' : 'text-ff-red'}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {inv.name} {inv.ticker && <span className="text-xs text-muted-foreground">({inv.ticker})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[inv.type] ?? inv.type} · {inv.quantity} unidades
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">
                    {new Intl.NumberFormat('es-SV', { style: 'currency', currency: inv.currency }).format(
                      inv.current_value ?? 0,
                    )}
                  </p>
                  <p className={`text-xs ${pnl >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
                    {pnl >= 0 ? '+' : ''}
                    {new Intl.NumberFormat('es-SV', { style: 'currency', currency: inv.currency }).format(pnl)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
