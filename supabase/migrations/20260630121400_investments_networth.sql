-- ===========================================================================
-- FlowFinance — 15 · Inversiones y patrimonio neto
-- ===========================================================================
-- Crea: investments, investment_transactions, manual_assets,
--       manual_liabilities, net_worth_snapshots
-- Módulos: MOD-07, MOD-17
-- Dependencias: users, accounts, transactions
-- ===========================================================================

create table public.investments (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  name                        text not null,
  ticker                      text,
  type                        investment_type not null,
  broker                      text,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  quantity                    numeric(20,8) not null default 0,
  avg_cost                    numeric(15,2) not null default 0,
  current_price               numeric(15,2),
  current_value               numeric(15,2) generated always as
                                (round(quantity * coalesce(current_price, 0), 2)) stored,
  total_invested              numeric(15,2) generated always as
                                (round(quantity * avg_cost, 2)) stored,
  unrealized_pnl              numeric(15,2),
  last_price_update_at        timestamptz,
  metadata                    jsonb,
  notes                       text,
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_inv_user on public.investments(user_id) where is_active = true;
create index idx_inv_type on public.investments(user_id, type);

create trigger trg_inv_updated_at
  before update on public.investments
  for each row execute function public.set_updated_at();

alter table public.investments enable row level security;

create policy "inv_owner" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── investment_transactions ───────────────────────────────────────────────
create table public.investment_transactions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  investment_id               uuid not null references public.investments(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  action                      text not null
    check (action in ('buy', 'sell', 'dividend', 'split', 'fee', 'transfer_in', 'transfer_out')),
  quantity                    numeric(20,8) not null,
  price                       numeric(15,2) not null,
  total                       numeric(15,2) not null,
  fees                        numeric(15,2) default 0,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  trade_date                  date not null,
  settlement_date             date,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_inv_tx_investment on public.investment_transactions(investment_id, trade_date desc);
create index idx_inv_tx_user on public.investment_transactions(user_id);

alter table public.investment_transactions enable row level security;

create policy "inv_tx_owner" on public.investment_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── manual_assets ─────────────────────────────────────────────────────────
create table public.manual_assets (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  name                        text not null,
  type                        asset_type not null,
  value                       numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  acquired_date               date,
  appreciation_rate_yr        numeric(7,4),
  notes                       text,
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_ma_user on public.manual_assets(user_id) where is_active = true;

create trigger trg_ma_updated_at
  before update on public.manual_assets
  for each row execute function public.set_updated_at();

alter table public.manual_assets enable row level security;

create policy "ma_owner" on public.manual_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── manual_liabilities ────────────────────────────────────────────────────
create table public.manual_liabilities (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  name                        text not null,
  type                        liability_type not null,
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  notes                       text,
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_ml_user on public.manual_liabilities(user_id) where is_active = true;

create trigger trg_ml_updated_at
  before update on public.manual_liabilities
  for each row execute function public.set_updated_at();

alter table public.manual_liabilities enable row level security;

create policy "ml_owner" on public.manual_liabilities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── net_worth_snapshots ───────────────────────────────────────────────────
create table public.net_worth_snapshots (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  snapshot_date               date not null,
  total_assets                numeric(15,2) not null,
  total_liabilities           numeric(15,2) not null,
  net_worth                   numeric(15,2) generated always as
                                (total_assets - total_liabilities) stored,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  assets_breakdown            jsonb not null,
  liabilities_breakdown       jsonb not null,
  delta_amount                numeric(15,2),
  delta_pct                   numeric(7,4),
  source                      text not null default 'auto',
  created_at                  timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index idx_nw_user_date on public.net_worth_snapshots(user_id, snapshot_date desc);

alter table public.net_worth_snapshots enable row level security;

create policy "nw_owner_read" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
-- inserts solo vía service_role (Edge Function programada)
