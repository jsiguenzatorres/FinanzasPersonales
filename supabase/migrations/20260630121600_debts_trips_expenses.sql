-- ===========================================================================
-- FlowFinance — 17 · Deudas propias (MOD-16) + trip_expenses (MOD-18)
-- ===========================================================================
-- Crea: debts, debt_payments, trip_expenses
-- Dependencias: users, trips, transactions
-- ===========================================================================

-- ─── debts ─────────────────────────────────────────────────────────────────
create table public.debts (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  name                        text not null,
  creditor                    text not null,
  type                        liability_type not null,
  original_amount             numeric(15,2) not null,
  current_balance             numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  interest_rate_annual        numeric(7,4) not null,
  term_months                 smallint,
  monthly_payment             numeric(15,2),
  start_date                  date not null,
  end_date                    date,
  next_payment_date           date,
  next_payment_amount         numeric(15,2),
  status                      loan_status not null default 'active',
  strategy                    debt_strategy default 'avalanche',
  payoff_priority             smallint,
  notes                       text,
  contract_url                text,
  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_debts_user on public.debts(user_id, status) where deleted_at is null;
create index idx_debts_payment_due
  on public.debts(user_id, next_payment_date) where status = 'active';

create trigger trg_debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

alter table public.debts enable row level security;

create policy "debts_owner" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── debt_payments ─────────────────────────────────────────────────────────
create table public.debt_payments (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  debt_id                     uuid not null references public.debts(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  payment_date                date not null,
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  principal_portion           numeric(15,2) not null,
  interest_portion            numeric(15,2) not null,
  fees_portion                numeric(15,2) default 0,
  balance_after               numeric(15,2) not null,
  is_extra                    boolean not null default false,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_dp_debt on public.debt_payments(debt_id, payment_date desc);
create index idx_dp_user on public.debt_payments(user_id);

alter table public.debt_payments enable row level security;

create policy "dp_owner" on public.debt_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── trip_expenses ─────────────────────────────────────────────────────────
create table public.trip_expenses (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  trip_id                     uuid not null references public.trips(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  category                    trip_expense_category not null,
  description                 text not null,
  amount_local                numeric(15,2) not null,
  currency_local              char(3) not null references public.currencies(code),
  amount_home                 numeric(15,2),
  currency_home               char(3) default 'USD' references public.currencies(code),
  fx_rate                     numeric(15,6),
  expense_date                date not null,
  receipt_url                 text,
  location                    jsonb,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_te_trip on public.trip_expenses(trip_id, expense_date desc);
create index idx_te_user on public.trip_expenses(user_id);

alter table public.trip_expenses enable row level security;

create policy "te_owner" on public.trip_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
