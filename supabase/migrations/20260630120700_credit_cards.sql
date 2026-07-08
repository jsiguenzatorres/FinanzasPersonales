-- ===========================================================================
-- FlowFinance — 08 · Tarjetas de crédito y estados de cuenta (MOD-15)
-- ===========================================================================
-- Crea: credit_cards, cc_statements
-- Dependencias: users, accounts
-- ===========================================================================

create table public.credit_cards (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  bank_name                   text not null,
  card_name                   text not null,
  card_brand                  text,
  card_number_mask            text,
  card_holder                 text,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  credit_limit                numeric(15,2) not null,
  current_balance             numeric(15,2) not null default 0,
  available_credit            numeric(15,2) generated always as (credit_limit - current_balance) stored,
  utilization_pct             numeric(5,2) generated always as (
                                case when credit_limit > 0
                                  then round(current_balance / credit_limit * 100, 2)
                                  else 0 end
                              ) stored,
  cut_day                     smallint not null check (cut_day between 1 and 31),
  payment_due_day             smallint not null check (payment_due_day between 1 and 31),
  interest_rate_annual        numeric(7,4) not null default 0,
  interest_rate_monthly       numeric(7,4) generated always as (round(interest_rate_annual / 12, 4)) stored,
  annual_fee                  numeric(15,2) default 0,
  annual_fee_month            smallint check (annual_fee_month between 1 and 12),
  min_payment_pct             numeric(5,2) default 5.00,
  rewards_program             text,
  rewards_balance             numeric(15,2) default 0,
  status                      account_status not null default 'active',
  color                       text,
  icon                        text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_cc_user on public.credit_cards(user_id) where status = 'active';

create trigger trg_cc_updated_at
  before update on public.credit_cards
  for each row execute function public.set_updated_at();

alter table public.credit_cards enable row level security;

create policy "cc_owner" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── cc_statements ─────────────────────────────────────────────────────────
create table public.cc_statements (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  card_id                 uuid not null references public.credit_cards(id) on delete cascade,
  cut_date                date not null,
  due_date                date not null,
  previous_balance        numeric(15,2) not null default 0,
  charges                 numeric(15,2) not null default 0,
  payments                numeric(15,2) not null default 0,
  interest_charged        numeric(15,2) not null default 0,
  fees_charged            numeric(15,2) not null default 0,
  new_balance             numeric(15,2) not null default 0,
  minimum_payment         numeric(15,2) not null default 0,
  payment_no_interest     numeric(15,2) not null default 0,
  is_paid                 boolean not null default false,
  paid_at                 timestamptz,
  amount_paid             numeric(15,2) default 0,
  statement_pdf_url       text,
  ocr_data                jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (card_id, cut_date)
);

create index idx_cc_stmt_card on public.cc_statements(card_id, cut_date desc);
create index idx_cc_stmt_due  on public.cc_statements(user_id, due_date) where is_paid = false;

create trigger trg_cc_stmt_updated_at
  before update on public.cc_statements
  for each row execute function public.set_updated_at();

alter table public.cc_statements enable row level security;

create policy "cc_stmt_owner" on public.cc_statements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
