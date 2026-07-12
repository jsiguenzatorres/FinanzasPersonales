import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteBudgetAction } from '@/lib/budgets/actions';

const STATUS_COLOR: Record<string, string> = {
  on_track: 'bg-ff-green',
  warning: 'bg-ff-yellow',
  over: 'bg-ff-red',
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
          <CardContent className="py-10 text-center text-muted-foreground">
            No tienes un presupuesto activo para este mes.
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

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ejecutado</p>
              <p className="font-mono text-2xl">
                {fmt(totalSpent)}{' '}
                <span className="text-sm text-muted-foreground">/ {fmt(budget.total_allocated)}</span>
              </p>
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
              className={`h-full ${
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

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Este presupuesto no tiene categorías asignadas.
          </p>
        ) : (
          categories.map((bc) => {
            const cat = categoryMap.get(bc.category_id);
            const pct = bc.allocated_amount > 0 ? (bc.spent_amount / bc.allocated_amount) * 100 : 0;
            return (
              <Card key={bc.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {cat?.icon ?? ''} {cat?.name ?? 'Categoría'}
                    </p>
                    <p className="font-mono text-sm">
                      {fmt(bc.spent_amount)} / {fmt(bc.allocated_amount)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${STATUS_COLOR[bc.status ?? 'on_track']}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
