import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveCreditCardAction } from '@/lib/credit-cards/actions';

function utilizationColor(pct: number): string {
  if (pct < 30) return 'text-ff-green';
  if (pct < 60) return 'text-ff-yellow';
  return 'text-ff-red';
}

export default async function CreditCardsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: cards } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Tarjetas de crédito</h1>
        <Button asChild>
          <Link href="/app/tarjetas/nueva">+ Nueva tarjeta</Link>
        </Button>
      </div>

      {!cards || cards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes tarjetas registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const utilization = card.utilization_pct ?? 0;
            return (
              <Card key={card.id}>
                <CardContent className="space-y-3 py-5">
                  <div>
                    <p className="font-medium">
                      {card.bank_name} {card.card_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {card.card_brand ?? 'Tarjeta'}
                      {card.card_number_mask ? ` · ****${card.card_number_mask}` : ''}
                    </p>
                  </div>

                  <p className="font-mono text-xl text-ff-red">
                    {new Intl.NumberFormat('es-SV', {
                      style: 'currency',
                      currency: card.currency,
                    }).format(card.current_balance)}
                  </p>

                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${utilization < 30 ? 'bg-ff-green' : utilization < 60 ? 'bg-ff-yellow' : 'bg-ff-red'}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs ${utilizationColor(utilization)}`}>
                      {utilization.toFixed(1)}% utilizado · disponible{' '}
                      {new Intl.NumberFormat('es-SV', {
                        style: 'currency',
                        currency: card.currency,
                      }).format(card.available_credit ?? 0)}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Corte día {card.cut_day} · Pago día {card.payment_due_day}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/tarjetas/${card.id}/pago`}>Registrar pago</Link>
                    </Button>
                    <form action={archiveCreditCardAction}>
                      <input type="hidden" name="card_id" value={card.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Archivar
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
