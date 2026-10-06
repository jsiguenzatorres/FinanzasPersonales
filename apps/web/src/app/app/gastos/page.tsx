import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { Receipt, Trash2 } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteExpenseAction } from '@/lib/expenses/actions';

export default async function ExpensesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, currency, merchant_name, description, transaction_date, category_id')
      .eq('kind', 'expense')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name'),
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const grouped: Record<string, NonNullable<typeof expenses>> = {};
  for (const e of expenses ?? []) {
    (grouped[e.transaction_date] ??= []).push(e);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Gastos</h1>
        <Button asChild>
          <Link href="/app/gastos/nuevo">+ Nuevo gasto</Link>
        </Button>
      </div>

      {!expenses || expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-red/10">
              <Receipt className="h-6 w-6 text-ff-red" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">Aún no tienes gastos registrados.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/gastos/nuevo">+ Nuevo gasto</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items], groupIdx) => {
            const dayTotal = items.reduce((sum, i) => sum + i.amount, 0);
            return (
              <div
                key={date}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(groupIdx * 60, 400)}ms` }}
              >
                <div className="mb-2 flex items-center justify-between px-1 text-sm text-muted-foreground">
                  <span className="capitalize">
                    {new Date(date + 'T00:00:00').toLocaleDateString('es-SV', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                  <span className="font-mono text-ff-red">
                    -
                    {new Intl.NumberFormat('es-SV', {
                      style: 'currency',
                      currency: items[0]?.currency ?? 'USD',
                    }).format(dayTotal)}
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {items.map((expense, i) => {
                    const label = expense.merchant_name || expense.description || 'Gasto';
                    const initial = label.charAt(0).toUpperCase();
                    return (
                      <div
                        key={expense.id}
                        className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 ${
                          i > 0 ? 'border-t border-border' : ''
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ff-red/10 font-mono text-xs text-ff-red">
                          {initial}
                        </div>
                        <Link href={`/app/gastos/${expense.id}`} className="min-w-0 flex-1">
                          <p className="truncate font-medium hover:underline">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {expense.category_id
                              ? (categoryMap.get(expense.category_id) ?? 'Categoría archivada')
                              : 'Sin categoría'}
                          </p>
                        </Link>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="font-mono text-ff-red">
                            -
                            {new Intl.NumberFormat('es-SV', {
                              style: 'currency',
                              currency: expense.currency,
                            }).format(expense.amount)}
                          </p>
                          <form action={deleteExpenseAction}>
                            <input type="hidden" name="transaction_id" value={expense.id} />
                            <button
                              type="submit"
                              className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all duration-150 hover:text-ff-red active:scale-90 group-hover:opacity-100"
                              aria-label="Eliminar gasto"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
