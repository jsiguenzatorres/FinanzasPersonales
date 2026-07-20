import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const TYPE_LABELS: Record<string, string> = {
  emergency_fund: 'Fondo de emergencia',
  savings: 'Ahorro',
  debt_payoff: 'Pago de deuda',
  purchase: 'Compra grande',
  travel: 'Viaje',
  education: 'Educación',
  retirement: 'Retiro',
  other: 'Otra',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  abandoned: 'Abandonada',
};

export default async function GoalsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .is('deleted_at', null)
    .order('status', { ascending: true })
    .order('priority', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Metas financieras</h1>
        <Button asChild>
          <Link href="/app/metas/nueva">+ Nueva meta</Link>
        </Button>
      </div>

      {!goals || goals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes metas. Crea la primera — fondo de emergencia, un viaje, lo que sea que estés
            ahorrando.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => {
            const pct = Math.min(goal.progress_pct ?? 0, 100);
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: goal.currency }).format(n);
            return (
              <Link key={goal.id} href={`/app/metas/${goal.id}`}>
                <Card>
                  <CardContent className="space-y-2 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium hover:underline">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[goal.type] ?? goal.type} · {STATUS_LABELS[goal.status] ?? goal.status}
                          {goal.target_date && ` · antes de ${goal.target_date}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{fmt(goal.current_amount)}</p>
                        <p className="text-xs text-muted-foreground">de {fmt(goal.target_amount)}</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${pct >= 100 ? 'bg-ff-green' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
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
