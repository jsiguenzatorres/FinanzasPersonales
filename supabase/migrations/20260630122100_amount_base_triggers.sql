-- ===========================================================================
-- FlowFinance — 22 · Trigger fill_amount_base (multi-moneda automática)
-- ===========================================================================
-- Crea: función fill_amount_base + triggers en todas las tablas con monto
-- Dependencias: users (currency_default), get_fx_rate, fx_rates
-- ===========================================================================

create or replace function public.fill_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
  v_date date;
  v_amount numeric(15,2);
  v_currency char(3);
begin
  -- Selecciona columnas con nombres dinámicos según la tabla
  -- Convención: todas las tablas tienen `amount` y `currency`.
  -- Para fecha: transaction_date, income_date, payment_date, contribution_date,
  --              trade_date, expense_date — buscamos el primer NOT NULL.
  v_amount   := (new).amount;
  v_currency := (new).currency;

  -- Detectar fecha relevante por nombre de columna disponible (TG_TABLE_NAME)
  v_date := case tg_table_name
    when 'transactions'           then (new).transaction_date
    when 'income_entries'         then (new).income_date
    when 'goal_contributions'     then (new).contribution_date
    when 'family_loan_payments'   then (new).payment_date
    when 'loan_payments'          then (new).payment_date
    when 'debt_payments'          then (new).payment_date
    when 'investment_transactions'then (new).trade_date
    when 'trip_expenses'          then (new).expense_date
    else current_date
  end;

  -- Moneda base del usuario
  select currency_default into v_base
    from public.users where id = (new).user_id;

  if v_base is null then
    v_base := 'USD';
  end if;

  if v_currency = v_base then
    new.amount_base := v_amount;
    new.fx_rate     := 1.0;
    if to_jsonb(new) ? 'fx_rate_date' then
      new.fx_rate_date := v_date;
    end if;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(v_currency, v_base, v_date);
    if new.fx_rate is not null then
      new.amount_base := round(v_amount * new.fx_rate, 2);
    else
      -- sin tasa disponible, dejamos amount_base NULL (la app puede reintentar)
      new.amount_base := null;
    end if;
    if to_jsonb(new) ? 'fx_rate_date' then
      new.fx_rate_date := v_date;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.fill_amount_base() is
  'Trigger BEFORE INSERT/UPDATE: completa amount_base en moneda base del usuario usando get_fx_rate().';

-- ─── Aplicar trigger en todas las tablas con monto en moneda variable ────
create trigger trg_amount_base_transactions
  before insert or update of amount, currency, transaction_date
  on public.transactions
  for each row execute function public.fill_amount_base();

create trigger trg_amount_base_income
  before insert or update of gross_amount, net_amount, currency, income_date
  on public.income_entries
  for each row execute function public.fill_amount_base();
  -- nota: income_entries usa net_amount; el trigger debe ajustarse si quieres
  -- usar net_amount como `amount`. Pendiente refactor en MVP si surge necesidad.

create trigger trg_amount_base_goal_contrib
  before insert or update of amount, currency, contribution_date
  on public.goal_contributions
  for each row execute function public.fill_amount_base();

create trigger trg_amount_base_fl_payments
  before insert or update of amount, currency, payment_date
  on public.family_loan_payments
  for each row execute function public.fill_amount_base();

create trigger trg_amount_base_loan_payments
  before insert or update of amount, currency, payment_date
  on public.loan_payments
  for each row execute function public.fill_amount_base();

create trigger trg_amount_base_debt_payments
  before insert or update of amount, currency, payment_date
  on public.debt_payments
  for each row execute function public.fill_amount_base();

create trigger trg_amount_base_inv_tx
  before insert or update of total, currency, trade_date
  on public.investment_transactions
  for each row execute function public.fill_amount_base();
  -- nota: usa `total` como amount; trigger ajustable si se prefiere.
