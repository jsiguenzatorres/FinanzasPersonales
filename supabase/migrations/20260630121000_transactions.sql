-- ===========================================================================
-- FlowFinance — 11 · Transactions (tabla universal)
-- ===========================================================================
-- Crea: transactions (MOD-04 principal, consumida por MOD-01/02/03/15/17)
-- Dependencias: users, accounts, credit_cards, categories, recurrings,
--               trips, goals, tax_records, collab_spaces
-- ===========================================================================

create table public.transactions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid not null references public.accounts(id) on delete restrict,
  card_id                     uuid references public.credit_cards(id) on delete set null,
  category_id                 uuid references public.categories(id) on delete set null,
  recurring_id                uuid references public.recurrings(id) on delete set null,
  transfer_pair_id            uuid references public.transactions(id),
  trip_id                     uuid references public.trips(id) on delete set null,
  goal_id                     uuid references public.goals(id) on delete set null,
  tax_record_id               uuid references public.tax_records(id) on delete set null,

  kind                        transaction_kind not null,
  status                      transaction_status not null default 'cleared',
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  fx_rate_date                date,

  transaction_date            date not null,
  posted_at                   timestamptz,

  merchant_name               text,
  description                 text,
  notes                       text,
  reference                   text,
  location                    jsonb,

  capture_source              capture_source not null default 'manual',
  ai_category_id              uuid references public.categories(id) on delete set null,
  ai_confidence               numeric(5,4),
  receipt_url                 text,
  receipt_ocr_data            jsonb,

  is_tax_deductible           boolean not null default false,
  money_class_override        money_class,

  is_split                    boolean not null default false,
  split_parent_id             uuid references public.transactions(id) on delete cascade,
  split_details               jsonb,

  collab_space_id             uuid references public.collab_spaces(id) on delete set null,
  paid_by_user_id             uuid references public.users(id) on delete set null,

  tags                        text[] default '{}',

  deleted_at                  timestamptz,
  deleted_by                  uuid references public.users(id) on delete set null,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint chk_tx_amount_positive check (amount > 0)
);

-- ─── Índices ───────────────────────────────────────────────────────────────
create index idx_tx_user_date
  on public.transactions(user_id, transaction_date desc) where deleted_at is null;
create index idx_tx_account
  on public.transactions(account_id, transaction_date desc) where deleted_at is null;
create index idx_tx_category
  on public.transactions(category_id, transaction_date desc) where deleted_at is null;
create index idx_tx_card
  on public.transactions(card_id, transaction_date desc)
  where card_id is not null and deleted_at is null;
create index idx_tx_trip
  on public.transactions(trip_id) where trip_id is not null;
create index idx_tx_goal
  on public.transactions(goal_id) where goal_id is not null;
create index idx_tx_recurring
  on public.transactions(recurring_id) where recurring_id is not null;
create index idx_tx_collab
  on public.transactions(collab_space_id) where collab_space_id is not null;
create index idx_tx_split_parent
  on public.transactions(split_parent_id) where split_parent_id is not null;
create index idx_tx_tags
  on public.transactions using gin(tags);
create index idx_tx_merchant_trgm
  on public.transactions using gin (merchant_name gin_trgm_ops);

create trigger trg_tx_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "tx_select" on public.transactions
  for select using (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

create policy "tx_owner_modify" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
