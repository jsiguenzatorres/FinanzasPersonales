-- ===========================================================================
-- FlowFinance — 16 · Préstamos (MOD-13 familiares + MOD-14 cartera con interés)
-- ===========================================================================
-- Crea: family_loans, family_loan_payments, loan_portfolio, loan_payments
-- Dependencias: users, accounts, transactions
-- ===========================================================================

-- ─── family_loans (MOD-13: SIN interés, exclusivo LATAM) ─────────────────
create table public.family_loans (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  person_name                 text not null,
  person_phone                text,
  relationship                text,
  original_amount             numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  balance                     numeric(15,2) not null,
  loan_date                   date not null,
  agreed_return_date          date,
  payment_method              family_payment_method not null default 'cash',
  category                    text,
  status                      loan_status not null default 'active',
  trust_score                 smallint default 5 check (trust_score between 1 and 10),
  is_visible_to_lender        boolean not null default false,
  reminder_frequency_days     smallint,
  next_reminder_date          date,
  last_contact_date           date,
  notes                       text,
  contract_url                text,
  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_fl_user on public.family_loans(user_id, status) where deleted_at is null;
create index idx_fl_reminder
  on public.family_loans(next_reminder_date) where status = 'active';

create trigger trg_fl_updated_at
  before update on public.family_loans
  for each row execute function public.set_updated_at();

alter table public.family_loans enable row level security;

create policy "fl_owner" on public.family_loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── family_loan_payments ──────────────────────────────────────────────────
create table public.family_loan_payments (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  loan_id                     uuid not null references public.family_loans(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  payment_date                date not null,
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  method                      family_payment_method not null,
  description                 text,
  in_kind_details             jsonb,
  balance_after               numeric(15,2) not null,
  receipt_url                 text,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_flp_loan on public.family_loan_payments(loan_id, payment_date desc);
create index idx_flp_user on public.family_loan_payments(user_id);

alter table public.family_loan_payments enable row level security;

create policy "flp_owner" on public.family_loan_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── loan_portfolio (MOD-14: CON interés) ─────────────────────────────────
create table public.loan_portfolio (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  borrower_name               text not null,
  borrower_phone              text,
  borrower_email              text,
  principal                   numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  interest_rate_monthly       numeric(7,4) not null,
  interest_type               text not null default 'simple'
    check (interest_type in ('simple', 'compound')),
  late_fee_rate               numeric(7,4) default 0,
  term_months                 smallint not null,
  start_date                  date not null,
  payment_day                 smallint not null check (payment_day between 1 and 31),
  monthly_payment             numeric(15,2),
  total_to_collect            numeric(15,2),
  total_interest              numeric(15,2),
  irr                         numeric(7,4),
  amortization                jsonb,
  balance_pending             numeric(15,2) not null,
  amount_collected            numeric(15,2) not null default 0,
  late_count                  integer not null default 0,
  days_late_total             integer not null default 0,
  status                      loan_status not null default 'active',
  contract_url                text,
  notes                       text,
  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_lp_user on public.loan_portfolio(user_id, status) where deleted_at is null;

create trigger trg_lp_updated_at
  before update on public.loan_portfolio
  for each row execute function public.set_updated_at();

alter table public.loan_portfolio enable row level security;

create policy "lp_owner" on public.loan_portfolio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── loan_payments ─────────────────────────────────────────────────────────
create table public.loan_payments (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  loan_id                     uuid not null references public.loan_portfolio(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  installment_number          smallint,
  scheduled_date              date,
  payment_date                date not null,
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  principal_portion           numeric(15,2) not null,
  interest_portion            numeric(15,2) not null,
  late_fee                    numeric(15,2) default 0,
  days_late                   smallint default 0,
  balance_after               numeric(15,2) not null,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_lpp_loan on public.loan_payments(loan_id, payment_date desc);
create index idx_lpp_user on public.loan_payments(user_id);

alter table public.loan_payments enable row level security;

create policy "lpp_owner" on public.loan_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
