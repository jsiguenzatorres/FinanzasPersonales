import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
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
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no tienes ingresos registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="flex items-center justify-between py-4">
                <Link href={`/app/ingresos/${income.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium hover:underline">{income.source_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {INCOME_TYPE_LABELS[income.type] ?? income.type} · {income.income_date}
                    {!income.is_collected && ' · Pendiente de cobro'}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg text-ff-green">
                    {new Intl.NumberFormat('es-SV', {
                      style: 'currency',
                      currency: income.currency,
                    }).format(income.net_amount)}
                  </p>
                  <form action={deleteIncomeAction}>
                    <input type="hidden" name="income_id" value={income.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
