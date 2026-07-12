import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { computeDashboardAlerts, type DashboardAlert } from '@/lib/dashboard/alerts';

const ALERT_STYLES: Record<DashboardAlert['severity'], { border: string; bg: string; text: string; icon: string }> = {
  critical: { border: 'border-ff-red/30', bg: 'bg-ff-red/10', text: 'text-ff-red', icon: '🔴' },
  warning: { border: 'border-ff-yellow/30', bg: 'bg-ff-yellow/10', text: 'text-ff-yellow', icon: '🟡' },
  info: { border: 'border-border', bg: 'bg-card', text: 'text-muted-foreground', icon: 'ℹ️' },
};

export default async function AppHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, country, currency_default')
    .eq('id', userId)
    .single();

  const currency = profile?.currency_default ?? 'USD';
  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(n);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startStr = startOfMonth.toISOString().slice(0, 10);

  const [
    alerts,
    { data: netWorth },
    { data: lastSnapshot },
    { data: monthIncomes },
    { data: monthExpenses },
    { data: liquidAccounts },
    { data: cardsDebt },
    { data: activeBudget },
  ] = await Promise.all([
    computeDashboardAlerts(supabase, userId),
    supabase.from('v_net_worth_current').select('net_worth').eq('user_id', userId).single(),
    supabase
      .from('net_worth_snapshots')
      .select('net_worth, snapshot_date')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('income_entries')
      .select('net_amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_collected', true)
      .gte('income_date', startStr),
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('kind', 'expense')
      .is('deleted_at', null)
      .gte('transaction_date', startStr),
    supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .in('type', ['checking', 'savings', 'cash', 'digital_wallet']),
    supabase
      .from('credit_cards')
      .select('current_balance')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('budgets')
      .select('id, total_allocated')
      .eq('user_id', userId)
      .lte('period_start', new Date().toISOString().slice(0, 10))
      .gte('period_end', new Date().toISOString().slice(0, 10))
      .maybeSingle(),
  ]);

  const totalIncome = (monthIncomes ?? []).reduce((sum, i) => sum + i.net_amount, 0);
  const totalExpenses = (monthExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null;
  const liquidBalance = (liquidAccounts ?? []).reduce((sum, a) => sum + a.balance, 0);
  const totalCardDebt = (cardsDebt ?? []).reduce((sum, c) => sum + c.current_balance, 0);
  const netWorthDelta = lastSnapshot ? (netWorth?.net_worth ?? 0) - (lastSnapshot.net_worth ?? 0) : null;

  let budgetExecutionPct: number | null = null;
  if (activeBudget) {
    const { data: budgetCats } = await supabase
      .from('budget_categories')
      .select('spent_amount')
      .eq('budget_id', activeBudget.id);
    const spent = (budgetCats ?? []).reduce((sum, c) => sum + c.spent_amount, 0);
    budgetExecutionPct = activeBudget.total_allocated > 0 ? (spent / activeBudget.total_allocated) * 100 : 0;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl">Hola, {profile?.display_name ?? user?.email}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── 1. Qué necesita tu atención hoy ─────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const style = ALERT_STYLES[alert.severity];
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-md border ${style.border} ${style.bg} px-4 py-3`}
              >
                <p className="text-sm">
                  {style.icon} {alert.title}
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 2. El número más importante: patrimonio neto ────────────── */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Patrimonio neto</p>
          <p
            className={`font-mono text-4xl ${(netWorth?.net_worth ?? 0) >= 0 ? 'text-ff-green' : 'text-ff-red'}`}
          >
            {fmt(netWorth?.net_worth ?? 0)}
          </p>
          {netWorthDelta !== null && (
            <p className={`mt-1 text-xs ${netWorthDelta >= 0 ? 'text-ff-green' : 'text-ff-red'}`}>
              {netWorthDelta >= 0 ? '↑' : '↓'} {fmt(Math.abs(netWorthDelta))} desde el último snapshot
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/app/patrimonio">Ver desglose</Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── 3. Flujo del mes: ¿ganas más de lo que gastas? ──────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">Ingresos del mes</p>
            <p className="font-mono text-xl text-ff-green">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">Gastos del mes</p>
            <p className="font-mono text-xl text-ff-red">{fmt(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">Tasa de ahorro</p>
            <p
              className={`font-mono text-xl ${
                savingsRate === null
                  ? 'text-muted-foreground'
                  : savingsRate >= 20
                    ? 'text-ff-green'
                    : savingsRate >= 0
                      ? 'text-ff-yellow'
                      : 'text-ff-red'
              }`}
            >
              {savingsRate === null ? '—' : `${savingsRate.toFixed(0)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Resumen por módulo ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-medium">Liquidez disponible</p>
              <p className="font-mono text-sm text-ff-green">{fmt(liquidBalance)}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/cuentas">Ver cuentas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-medium">Presupuesto</p>
              {budgetExecutionPct === null ? (
                <p className="text-sm text-muted-foreground">Sin presupuesto activo</p>
              ) : (
                <p
                  className={`font-mono text-sm ${
                    budgetExecutionPct >= 100
                      ? 'text-ff-red'
                      : budgetExecutionPct >= 80
                        ? 'text-ff-yellow'
                        : 'text-ff-green'
                  }`}
                >
                  {budgetExecutionPct.toFixed(0)}% ejecutado
                </p>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={activeBudget ? '/app/presupuesto' : '/app/presupuesto/nuevo'}>
                {activeBudget ? 'Ver' : 'Crear'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-medium">Deuda en tarjetas</p>
              <p className={`font-mono text-sm ${totalCardDebt > 0 ? 'text-ff-red' : 'text-ff-green'}`}>
                {fmt(totalCardDebt)}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/tarjetas">Ver tarjetas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── 5. CTA a FINN ─────────────────────────────────────────────── */}
      <Card className="border-ff-green/20 bg-ff-green/5">
        <CardContent className="flex items-center justify-between py-5">
          <div>
            <p className="font-medium">🤖 ¿Dudas sobre tus finanzas?</p>
            <p className="text-sm text-muted-foreground">
              Pregúntale a FINN — conoce tus datos reales, no respuestas genéricas.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/app/finn">Hablar con FINN</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
