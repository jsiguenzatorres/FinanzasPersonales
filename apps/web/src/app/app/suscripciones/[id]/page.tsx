import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteSubscriptionAction, advanceSubscriptionChargeAction } from '@/lib/subscriptions/actions';

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', id).single();
  if (!sub) notFound();

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency: sub.currency }).format(n);
  const daysUntilCharge = Math.ceil(
    (new Date(sub.next_charge_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/suscripciones" className="text-sm text-muted-foreground hover:underline">
        ← Suscripciones
      </Link>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {sub.plan ? `${sub.plan} · ` : ''}
              {FREQ_LABELS[sub.frequency] ?? sub.frequency}
              {!sub.is_active && ' · inactiva'}
            </p>
            <p className="font-mono text-2xl text-ff-red">{fmt(sub.amount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Próximo cobro: {sub.next_charge_date}</p>
            <p className={daysUntilCharge <= 3 && daysUntilCharge >= 0 ? 'text-ff-yellow' : ''}>
              {daysUntilCharge < 0
                ? 'Fecha ya pasó'
                : daysUntilCharge === 0
                  ? 'Es hoy'
                  : `En ${daysUntilCharge} días`}
            </p>
            {sub.usage_score && <p>Uso: {sub.usage_score}/5</p>}
            {sub.detected_automatically && <p className="text-ff-green">Detectada automáticamente</p>}
          </div>

          {sub.cancel_url && (
            <a
              href={sub.cancel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Cancelar suscripción →
            </a>
          )}
          {sub.notes && <p className="text-sm text-muted-foreground">{sub.notes}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <form action={advanceSubscriptionChargeAction}>
              <input type="hidden" name="subscription_id" value={id} />
              <Button type="submit" size="sm">
                Ya se cobró
              </Button>
            </form>
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/suscripciones/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteSubscriptionAction}>
              <input type="hidden" name="subscription_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/suscripciones">Volver</Link>
      </Button>
    </div>
  );
}
