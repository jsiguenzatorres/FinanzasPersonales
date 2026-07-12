-- ===========================================================================
-- FlowFinance — 33 · Fix crítico: fill_amount_base() rompe TODO insert en
-- transactions (y otras tablas) por referenciar columnas de otras tablas
-- ===========================================================================
-- Bug real, encontrado al sembrar datos de prueba: fill_amount_base()
-- (migración 22) es una única función compartida entre transactions,
-- income_entries, goal_contributions, family_loan_payments, loan_payments,
-- debt_payments e investment_transactions. Su CASE interno hace
-- `(new).income_date`, `(new).payment_date`, `(new).contribution_date`,
-- `(new).trade_date` — Postgres valida TODAS las ramas del CASE contra el
-- tipo real de `new` en cada invocación (no hace short-circuit de tipos),
-- así que cualquier INSERT en `transactions` falla con:
--   column "income_date" not found in data type transactions
-- porque esa rama nunca debería ejecutarse pero igual se valida.
--
-- income_entries ya se había arreglado (migración 26) con una función
-- dedicada. Este fix aplica el mismo patrón a las tablas restantes: una
-- función por tabla, sin ninguna referencia cruzada a columnas ajenas.
-- ===========================================================================

-- ─── transactions ──────────────────────────────────────────────────────────
create or replace function public.fill_transaction_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.amount;
    new.fx_rate := 1.0;
    new.fx_rate_date := new.transaction_date;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.transaction_date);
    if new.fx_rate is not null then
      new.amount_base := round(new.amount * new.fx_rate, 2);
    else
      new.amount_base := null;
    end if;
    new.fx_rate_date := new.transaction_date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_transactions on public.transactions;

create trigger trg_amount_base_transactions
  before insert or update of amount, currency, transaction_date
  on public.transactions
  for each row execute function public.fill_transaction_amount_base();

-- ─── goal_contributions ────────────────────────────────────────────────────
create or replace function public.fill_goal_contribution_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.amount;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.contribution_date);
    new.amount_base := case when new.fx_rate is not null then round(new.amount * new.fx_rate, 2) else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_goal_contrib on public.goal_contributions;

create trigger trg_amount_base_goal_contrib
  before insert or update of amount, currency, contribution_date
  on public.goal_contributions
  for each row execute function public.fill_goal_contribution_amount_base();

-- ─── family_loan_payments ──────────────────────────────────────────────────
create or replace function public.fill_family_loan_payment_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.amount;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.payment_date);
    new.amount_base := case when new.fx_rate is not null then round(new.amount * new.fx_rate, 2) else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_fl_payments on public.family_loan_payments;

create trigger trg_amount_base_fl_payments
  before insert or update of amount, currency, payment_date
  on public.family_loan_payments
  for each row execute function public.fill_family_loan_payment_amount_base();

-- ─── loan_payments ─────────────────────────────────────────────────────────
create or replace function public.fill_loan_payment_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.amount;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.payment_date);
    new.amount_base := case when new.fx_rate is not null then round(new.amount * new.fx_rate, 2) else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_loan_payments on public.loan_payments;

create trigger trg_amount_base_loan_payments
  before insert or update of amount, currency, payment_date
  on public.loan_payments
  for each row execute function public.fill_loan_payment_amount_base();

-- ─── debt_payments ─────────────────────────────────────────────────────────
create or replace function public.fill_debt_payment_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.amount;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.payment_date);
    new.amount_base := case when new.fx_rate is not null then round(new.amount * new.fx_rate, 2) else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_debt_payments on public.debt_payments;

create trigger trg_amount_base_debt_payments
  before insert or update of amount, currency, payment_date
  on public.debt_payments
  for each row execute function public.fill_debt_payment_amount_base();

-- ─── investment_transactions (usa `total` como monto) ─────────────────────
create or replace function public.fill_investment_tx_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.total;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.trade_date);
    new.amount_base := case when new.fx_rate is not null then round(new.total * new.fx_rate, 2) else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_amount_base_inv_tx on public.investment_transactions;

create trigger trg_amount_base_inv_tx
  before insert or update of total, currency, trade_date
  on public.investment_transactions
  for each row execute function public.fill_investment_tx_amount_base();

-- ─── limpieza: la función genérica ya no tiene triggers apuntándole ───────
drop function if exists public.fill_amount_base();
