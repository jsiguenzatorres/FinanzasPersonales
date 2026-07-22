import Link from 'next/link';
import { Card, CardContent, Button } from '@flowfinance/ui';
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Valor total</p>
              <p className="font-mono text-xl text-ff-green">
                {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">Ganancia/pérdida no realizada</p>
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
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes inversiones registradas. Agrega acciones, ETFs, cripto, o cualquier otro activo
            que estés siguiendo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {investments.map((inv) => {
            const pnl = (inv.current_value ?? 0) - (inv.total_invested ?? 0);
            return (
              <Link key={inv.id} href={`/app/inversiones/${inv.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium hover:underline">
                        {inv.name} {inv.ticker && <span className="text-xs text-muted-foreground">({inv.ticker})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[inv.type] ?? inv.type} · {inv.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
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
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
