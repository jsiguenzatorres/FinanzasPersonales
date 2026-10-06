import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { TrendingUp, Trash2, Clock } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteIncomeAction } from '@/lib/income/actions';

const INCOME_TYPE_LABELS: Record<string, string> = {
  salary: 'Laboral',
  freelance: 'Freelance',
  rental: 'Renta',
  investment_yield: 'Rendimientos',
  loan_payment: 'Abono préstamo',
  business: 'Negocio',
  eventual: 'Eventual',
  other: 'Otro',
};

export default async function IncomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: incomes } = await supabase
    .from('income_entries')
    .select('*')
    .is('deleted_at', null)
    .order('income_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Ingresos</h1>
        <Button asChild>
          <Link href="/app/ingresos/nueva">+ Nuevo ingreso</Link>
        </Button>
      </div>

      {!incomes || incomes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-green/10">
              <TrendingUp className="h-6 w-6 text-ff-green" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">Aún no tienes ingresos registrados.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/ingresos/nueva">+ Nuevo ingreso</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {incomes.map((income, i) => {
            const initial = income.source_name.charAt(0).toUpperCase();
            return (
              <div
                key={income.id}
                className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-landing-terracotta/5 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ff-green/10 font-mono text-xs text-ff-green">
                  {initial}
                </div>
                <Link href={`/app/ingresos/${income.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium hover:underline">{income.source_name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {INCOME_TYPE_LABELS[income.type] ?? income.type} · {income.income_date}
                    {!income.is_collected && (
                      <span className="flex items-center gap-1 rounded-full bg-ff-yellow/10 px-2 py-0.5 text-ff-yellow">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Pendiente
                      </span>
                    )}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-mono text-lg text-ff-green">
                    {new Intl.NumberFormat('es-SV', {
                      style: 'currency',
                      currency: income.currency,
                    }).format(income.net_amount)}
                  </p>
                  <form action={deleteIncomeAction}>
                    <input type="hidden" name="income_id" value={income.id} />
                    <button
                      type="submit"
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-ff-red group-hover:opacity-100"
                      aria-label="Eliminar ingreso"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
