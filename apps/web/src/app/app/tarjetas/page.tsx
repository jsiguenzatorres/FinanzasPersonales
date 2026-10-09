import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { CreditCard as CreditCardIcon, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { archiveCreditCardAction, deleteCreditCardAction } from '@/lib/credit-cards/actions';
import { AnimatedNumber } from '@/components/animated-number';

function utilizationColor(pct: number): string {
  if (pct < 30) return 'text-ff-green';
  if (pct < 60) return 'text-ff-yellow';
  return 'text-ff-red';
}

export default async function CreditCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {!cards || cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full animate-empty-breathe bg-ff-red/10">
              <CreditCardIcon className="h-6 w-6 text-ff-red" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">Aún no tienes tarjetas registradas.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/tarjetas/nueva">+ Nueva tarjeta</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const utilization = card.utilization_pct ?? 0;
            return (
              <Card
                key={card.id}
                className="animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-landing-terracotta/50"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ff-red/10">
                      <CreditCardIcon className="h-5 w-5 text-ff-red" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {card.bank_name} {card.card_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {card.card_brand ?? 'Tarjeta'}
                        {card.card_number_mask ? ` · ****${card.card_number_mask}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="font-mono text-xl text-ff-red">
                    <AnimatedNumber value={card.current_balance} format={{ kind: 'currency', currency: card.currency }} />
                  </p>

                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-700 ${utilization < 30 ? 'bg-ff-green' : utilization < 60 ? 'bg-ff-yellow' : 'bg-ff-red'}`}
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

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/tarjetas/${card.id}/pago`}>Registrar pago</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/tarjetas/${card.id}/editar`}>Editar</Link>
                    </Button>
                    <form action={archiveCreditCardAction}>
                      <input type="hidden" name="card_id" value={card.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Archivar
                      </Button>
                    </form>
                    <form action={deleteCreditCardAction}>
                      <input type="hidden" name="card_id" value={card.id} />
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
