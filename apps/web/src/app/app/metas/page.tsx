import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import {
  ShieldCheck,
  PiggyBank,
  TrendingDown,
  ShoppingBag,
  Plane,
  GraduationCap,
  Landmark,
  Target,
} from 'lucide-react';
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

const TYPE_META: Record<string, { icon: typeof Target; tint: string; iconColor: string }> = {
  emergency_fund: { icon: ShieldCheck, tint: 'bg-ff-green/10', iconColor: 'text-ff-green' },
  savings: { icon: PiggyBank, tint: 'bg-ff-green/10', iconColor: 'text-ff-green' },
  debt_payoff: { icon: TrendingDown, tint: 'bg-ff-red/10', iconColor: 'text-ff-red' },
  purchase: { icon: ShoppingBag, tint: 'bg-ff-purple/10', iconColor: 'text-ff-purple' },
  travel: { icon: Plane, tint: 'bg-ff-blue/10', iconColor: 'text-ff-blue' },
  education: { icon: GraduationCap, tint: 'bg-ff-blue/10', iconColor: 'text-ff-blue' },
  retirement: { icon: Landmark, tint: 'bg-ff-orange/10', iconColor: 'text-ff-orange' },
  other: { icon: Target, tint: 'bg-ff-green/10', iconColor: 'text-ff-green' },
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
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-green/10">
              <Target className="h-6 w-6 text-ff-green" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              Aún no tienes metas. Crea la primera — fondo de emergencia, un viaje, lo que sea que estés
              ahorrando.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/metas/nueva">+ Nueva meta</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, i) => {
            const pct = Math.min(goal.progress_pct ?? 0, 100);
            const fmt = (n: number) =>
              new Intl.NumberFormat('es-SV', { style: 'currency', currency: goal.currency }).format(n);
            const meta = TYPE_META[goal.type] ?? TYPE_META.other!;
            const Icon = meta.icon;
            return (
              <Link key={goal.id} href={`/app/metas/${goal.id}`}>
                <Card
                  className="animate-fade-in-up transition-all duration-200 hover:-translate-y-0.5 hover:border-landing-terracotta/50 active:scale-[0.98] active:translate-y-0"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <CardContent className="space-y-3 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${meta.tint} ${pct >= 90 && pct < 100 ? 'animate-target-pulse' : ''}`}
                      >
                        <Icon className={`h-5 w-5 ${meta.iconColor}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{goal.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {TYPE_LABELS[goal.type] ?? goal.type} · {STATUS_LABELS[goal.status] ?? goal.status}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-mono text-lg">{fmt(goal.current_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        de {fmt(goal.target_amount)}
                        {goal.target_date && ` · antes de ${goal.target_date}`}
                      </p>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-700 ${pct >= 100 ? 'bg-ff-green' : 'bg-primary'}`}
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
