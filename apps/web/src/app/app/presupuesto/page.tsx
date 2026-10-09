import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { PieChart, Target } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteBudgetAction } from '@/lib/budgets/actions';

const STATUS_COLOR: Record<string, string> = {
  on_track: 'bg-ff-green',
  warning: 'bg-ff-yellow',
  over: 'bg-ff-red',
};

const STATUS_TINT: Record<string, string> = {
  on_track: 'bg-ff-green/10',
  warning: 'bg-ff-yellow/10',
  over: 'bg-ff-red/10',
};

const MODE_LABELS: Record<string, string> = {
  zero_based: 'Zero-Based',
  flexible: 'Flexible',
  '50_30_20': '50/30/20',
};

export default async function BudgetPage() {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .lte('period_start', today)
    .gte('period_end', today)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!budget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl">Presupuesto</h1>
          <Button asChild>
            <Link href="/app/presupuesto/nuevo">+ Crear presupuesto</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-blue/10">
              <Target className="h-6 w-6 text-ff-blue" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">No tienes un presupuesto activo para este mes.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/presupuesto/nuevo">+ Crear presupuesto</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: budgetCategories }, { data: allCategories }] = await Promise.all([
    supabase
      .from('budget_categories')
      .select('*')
      .eq('budget_id', budget.id)
      .order('allocated_amount', { ascending: false }),
    supabase.from('categories').select('id, name, icon'),
  ]);

  const categoryMap = new Map((allCategories ?? []).map((c) => [c.id, c]));
  const categories = budgetCategories ?? [];

  const totalSpent = categories.reduce((sum, c) => sum + c.spent_amount, 0);
  const executionPct = budget.total_allocated > 0 ? (totalSpent / budget.total_allocated) * 100 : 0;

  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const greenCount = categories.filter((c) => c.status === 'on_track').length;
  const yellowCount = categories.filter((c) => c.status === 'warning').length;
  const redCount = categories.filter((c) => c.status === 'over').length;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: budget.currency }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Presupuesto</h1>
          <p className="text-sm text-muted-foreground">
            Modo {MODE_LABELS[budget.mode] ?? budget.mode} · {budget.period_start} a {budget.period_end}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/presupuesto/${budget.id}/editar`}>Editar</Link>
          </Button>
          <form action={deleteBudgetAction}>
            <input type="hidden" name="budget_id" value={budget.id} />
            <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <Card className="animate-fade-in-up">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                  executionPct >= 100 ? 'bg-ff-red/10' : executionPct >= 80 ? 'bg-ff-yellow/10' : 'bg-ff-green/10'
                }`}
              >
                <PieChart
                  className={`h-5 w-5 animate-bar-breathe ${
                    executionPct >= 100 ? 'text-ff-red' : executionPct >= 80 ? 'text-ff-yellow' : 'text-ff-green'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ejecutado</p>
                <p className="font-mono text-2xl">
                  {fmt(totalSpent)}{' '}
                  <span className="text-sm text-muted-foreground">/ {fmt(budget.total_allocated)}</span>
                </p>
              </div>
            </div>
            <p
              className={`font-mono text-3xl ${
                executionPct >= 100
                  ? 'text-ff-red'
                  : executionPct >= 80
                    ? 'text-ff-yellow'
                    : 'text-ff-green'
              }`}
            >
              {executionPct.toFixed(0)}%
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-700 ${
                executionPct >= 100 ? 'bg-ff-red' : executionPct >= 80 ? 'bg-ff-yellow' : 'bg-ff-green'
              }`}
              style={{ width: `${Math.min(executionPct, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Día {dayOfMonth} de {daysInMonth} · {greenCount} verdes · {yellowCount} amarillas · {redCount}{' '}
            rojas
          </p>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Este presupuesto no tiene categorías asignadas.
        </p>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {categories.map((bc, i) => {
            const cat = categoryMap.get(bc.category_id);
            const pct = bc.allocated_amount > 0 ? (bc.spent_amount / bc.allocated_amount) * 100 : 0;
            const status = bc.status ?? 'on_track';
            return (
              <div key={bc.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${STATUS_TINT[status]}`}>
                    {cat?.icon ?? '●'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{cat?.name ?? 'Categoría'}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-700 ${STATUS_COLOR[status]}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="shrink-0 font-mono text-sm">
                    {fmt(bc.spent_amount)} / {fmt(bc.allocated_amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
