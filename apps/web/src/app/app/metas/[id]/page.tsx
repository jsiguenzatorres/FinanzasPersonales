import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteGoalAction } from '@/lib/goals/actions';
import { ContributionForm } from './contribution-form';

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

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  auto_income: 'Automático desde ingreso',
};

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: goal } = await supabase.from('goals').select('*').eq('id', id).single();
  if (!goal) notFound();

  const { data: contributions } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', id)
    .order('contribution_date', { ascending: false })
    .order('created_at', { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: goal.currency }).format(n);
  const pct = Math.min(goal.progress_pct ?? 0, 100);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/metas" className="text-sm text-muted-foreground hover:underline">
        ← Metas
      </Link>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABELS[goal.type] ?? goal.type} · {STATUS_LABELS[goal.status] ?? goal.status}
            </p>
            <p className="font-mono text-2xl text-ff-green">{fmt(goal.current_amount)}</p>
            <p className="text-xs text-muted-foreground">de {fmt(goal.target_amount)}</p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${pct >= 100 ? 'bg-ff-green' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">{pct.toFixed(0)}%</p>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {goal.target_date && <p>Fecha límite: {goal.target_date}</p>}
            {goal.monthly_contribution && <p>Meta mensual: {fmt(goal.monthly_contribution)}</p>}
            {goal.auto_contribution_pct != null && goal.auto_contribution_pct > 0 && (
              <p>Auto-aporte: {goal.auto_contribution_pct}% de ingresos</p>
            )}
          </div>
          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/metas/${id}/editar`}>Editar</Link>
            </Button>
            <form action={deleteGoalAction}>
              <input type="hidden" name="goal_id" value={id} />
              <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                Eliminar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {goal.status !== 'abandoned' && (
        <Card>
          <CardContent className="py-5">
            <p className="mb-3 text-sm font-medium">Registrar movimiento</p>
            <ContributionForm goalId={id} currency={goal.currency} />
          </CardContent>
        </Card>
      )}

      {contributions && contributions.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-5">
            <p className="text-sm font-medium">Historial</p>
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">{c.contribution_date}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {SOURCE_LABELS[c.source ?? 'manual'] ?? c.source}
                  </span>
                </div>
                <span className={`font-mono ${c.amount >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
                  {c.amount >= 0 ? '+' : ''}
                  {fmt(c.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/metas">Volver</Link>
      </Button>
    </div>
  );
}
