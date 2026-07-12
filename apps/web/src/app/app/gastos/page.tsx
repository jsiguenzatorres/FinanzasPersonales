import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
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
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes gastos registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((sum, i) => sum + i.amount, 0);
            return (
              <div key={date}>
                <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
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
                <div className="space-y-2">
                  {items.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <Link href={`/app/gastos/${expense.id}`} className="min-w-0 flex-1">
                          <p className="truncate font-medium hover:underline">
                            {expense.merchant_name || expense.description || 'Gasto'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expense.category_id
                              ? (categoryMap.get(expense.category_id) ?? 'Categoría archivada')
                              : 'Sin categoría'}
                          </p>
                        </Link>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-ff-red">
                            -
                            {new Intl.NumberFormat('es-SV', {
                              style: 'currency',
                              currency: expense.currency,
                            }).format(expense.amount)}
                          </p>
                          <form action={deleteExpenseAction}>
                            <input type="hidden" name="transaction_id" value={expense.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Eliminar
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
