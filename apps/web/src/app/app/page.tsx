import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import {
  Wallet,
  CreditCard,
  HandCoins,
  Target,
  Bell,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Bot,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { computeDashboardAlerts, type DashboardAlert } from '@/lib/dashboard/alerts';
import { AnimatedNumber } from '@/components/animated-number';
import { AnimatedRing } from '@/components/animated-ring';
import { NetWorthSparkline } from '@/components/net-worth-sparkline';
import { ModuleCard } from '@/components/module-card';
import { computePersonalExpenseTotal } from '@/lib/expenses/personal-spend';

const ALERT_STYLES: Record<DashboardAlert['severity'], { bg: string; border: string; icon: string }> = {
  critical: { bg: 'bg-ff-red/10', border: 'border-ff-red/25', icon: 'text-ff-red' },
  warning: { bg: 'bg-ff-yellow/10', border: 'border-ff-yellow/25', icon: 'text-ff-yellow' },
  info: { bg: 'bg-card', border: 'border-border', icon: 'text-muted-foreground' },
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
    { data: recentSnapshots },
    { data: monthIncomes },
    totalExpenses,
    { data: liquidAccounts },
    { data: cardsDebt },
    { data: activeBudget },
    { data: activeLoans },
    { data: activeGoals },
  ] = await Promise.all([
    computeDashboardAlerts(supabase, userId),
    supabase.from('v_net_worth_current').select('net_worth').eq('user_id', userId).single(),
    supabase
      .from('net_worth_snapshots')
      .select('net_worth, snapshot_date')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(6),
    supabase
      .from('income_entries')
      .select('net_amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_collected', true)
      .gte('income_date', startStr),
    computePersonalExpenseTotal(supabase, userId, startStr),
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
    supabase.from('family_loans').select('balance').eq('user_id', userId).eq('status', 'active'),
    supabase
      .from('goals')
      .select('current_amount, target_amount')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null),
  ]);

  const totalIncome = (monthIncomes ?? []).reduce((sum, i) => sum + i.net_amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null;
  const liquidBalance = (liquidAccounts ?? []).reduce((sum, a) => sum + a.balance, 0);
  const totalCardDebt = (cardsDebt ?? []).reduce((sum, c) => sum + c.current_balance, 0);
  const sparklinePoints = (recentSnapshots ?? [])
    .map((s) => ({ date: s.snapshot_date, value: s.net_worth ?? 0 }))
    .reverse();
  const lastSnapshot = recentSnapshots?.[0];
  const netWorthDelta = lastSnapshot ? (netWorth?.net_worth ?? 0) - (lastSnapshot.net_worth ?? 0) : null;
  const totalLoansPending = (activeLoans ?? []).reduce((sum, l) => sum + l.balance, 0);
  const goalsSaved = (activeGoals ?? []).reduce((sum, g) => sum + g.current_amount, 0);
  const goalsCount = (activeGoals ?? []).length;

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
    <div className="space-y-4">
      {/* ── Encabezado ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Hola, {profile?.display_name ?? user?.email}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/app/finn"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-forest text-landing-cream transition-transform duration-150 hover:scale-105 active:scale-95"
          aria-label="Hablar con Neto"
        >
          <Bot className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* ── Qué necesita tu atención hoy ────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="animate-fade-in-up space-y-2" style={{ animationDelay: '0ms' }}>
          {alerts.map((alert, i) => {
            const style = ALERT_STYLES[alert.severity];
            return (
              <Link
                key={i}
                href={alert.actionHref}
                className={`group flex items-center justify-between rounded-xl border ${style.border} ${style.bg} px-4 py-3 transition-colors hover:bg-landing-terracotta/5 active:bg-landing-terracotta/10`}
              >
                <p className="flex items-center gap-2 text-sm">
                  <Bell className={`h-4 w-4 shrink-0 ${style.icon}`} aria-hidden="true" />
                  {alert.title}
                </p>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Héroe: patrimonio neto + anillo de presupuesto ──────────── */}
      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        <Card className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <CardContent className="py-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Patrimonio neto</p>
            <p
              className={`font-mono text-4xl ${(netWorth?.net_worth ?? 0) >= 0 ? 'text-ff-green' : 'text-ff-red'}`}
            >
              <AnimatedNumber value={netWorth?.net_worth ?? 0} format={{ kind: 'currency', currency }} />
            </p>
            {netWorthDelta !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    netWorthDelta >= 0 ? 'bg-ff-green/10 text-ff-green' : 'bg-ff-red/10 text-ff-red'
                  }`}
                >
                  {netWorthDelta >= 0 ? (
                    <ArrowUp className="h-3 w-3 animate-arrow-bounce" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  )}
                  {fmt(Math.abs(netWorthDelta))}
                </span>
                <span className="text-xs text-muted-foreground">desde el último snapshot</span>
              </div>
            )}
            <NetWorthSparkline points={sparklinePoints} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="flex h-full flex-col items-center justify-center py-6">
            {budgetExecutionPct !== null ? (
              <>
                <AnimatedRing percent={budgetExecutionPct} />
                <p className="mt-4 text-center text-xs text-muted-foreground">presupuesto ejecutado</p>
              </>
            ) : (
              <>
                <p className="text-center text-sm text-muted-foreground">Sin presupuesto activo</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/app/presupuesto/nuevo">Crear presupuesto</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Flujo del mes ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          className="animate-fade-in-up border-t-[3px] border-t-ff-green"
          style={{ animationDelay: '150ms' }}
        >
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            <p className="font-mono text-xl text-ff-green">
              <AnimatedNumber value={totalIncome} format={{ kind: 'currency', currency }} />
            </p>
          </CardContent>
        </Card>
        <Card
          className="animate-fade-in-up border-t-[3px] border-t-ff-red"
          style={{ animationDelay: '190ms' }}
        >
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Gastos del mes</p>
            <p className="font-mono text-xl text-ff-red">
              <AnimatedNumber value={totalExpenses} format={{ kind: 'currency', currency }} />
            </p>
          </CardContent>
        </Card>
        <Card
          className={`animate-fade-in-up border-t-[3px] ${
            savingsRate === null
              ? 'border-t-border'
              : savingsRate >= 20
                ? 'border-t-ff-green'
                : savingsRate >= 0
                  ? 'border-t-ff-yellow'
                  : 'border-t-ff-red'
          }`}
          style={{ animationDelay: '230ms' }}
        >
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
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
              {savingsRate === null ? '—' : <AnimatedNumber value={savingsRate} format={{ kind: 'percent' }} />}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Módulos (bento grid) ─────────────────────────────────────── */}
      <div
        className="grid animate-fade-in-up grid-cols-2 gap-3 sm:grid-cols-4"
        style={{ animationDelay: '270ms' }}
      >
        <ModuleCard
          href="/app/cuentas"
          icon={Wallet}
          tint="blue"
          label="Liquidez disponible"
          value={fmt(liquidBalance)}
          valueClass="text-ff-green"
        />
        <ModuleCard
          href="/app/tarjetas"
          icon={CreditCard}
          tint="red"
          label="Deuda en tarjetas"
          value={fmt(totalCardDebt)}
          valueClass={totalCardDebt > 0 ? 'text-ff-red' : 'text-ff-green'}
        />
        {totalLoansPending > 0 && (
          <ModuleCard
            href="/app/prestamos"
            icon={HandCoins}
            tint="yellow"
            label="Préstamos activos"
            value={fmt(totalLoansPending)}
            valueClass="text-ff-yellow"
          />
        )}
        {goalsCount > 0 && (
          <ModuleCard
            href="/app/metas"
            icon={Target}
            tint="green"
            label={`Metas activas (${goalsCount})`}
            value={`${fmt(goalsSaved)} ahorrado`}
            valueClass="text-ff-green"
          />
        )}
      </div>

      {/* ── CTA a Neto ───────────────────────────────────────────────── */}
      <Link
        href="/app/finn"
        className="animate-fade-in-up flex items-center justify-between rounded-xl bg-landing-forest px-5 py-4 transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
        style={{ animationDelay: '320ms' }}
      >
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 shrink-0 text-landing-cream" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-landing-cream">¿Dudas sobre tus finanzas?</p>
            <p className="text-xs text-landing-cream/70">
              Pregúntale a Neto — conoce tus datos reales, no respuestas genéricas.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-landing-terracotta px-4 py-2 text-xs font-medium text-landing-cream">
          Hablar con Neto
        </span>
      </Link>
    </div>
  );
}
