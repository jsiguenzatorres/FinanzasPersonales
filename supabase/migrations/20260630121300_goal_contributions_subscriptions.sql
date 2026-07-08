-- ===========================================================================
-- FlowFinance — 14 · Goal contributions + subscriptions
-- ===========================================================================
-- Crea: goal_contributions (MOD-05), subscriptions (MOD-06)
-- Dependencias: users, goals, transactions, income_entries, recurrings,
--               categories, credit_cards, accounts
-- ===========================================================================

-- ─── goal_contributions ────────────────────────────────────────────────────
create table public.goal_contributions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  goal_id                     uuid not null references public.goals(id) on delete cascade,
  transaction_id              uuid references public.transactions(id) on delete set null,
  income_entry_id             uuid references public.income_entries(id) on delete set null,
  amount                      numeric(15,2) not null check (amount <> 0),
  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),
  contribution_date           date not null,
  source                      text,
  notes                       text,
  created_at                  timestamptz not null default now()
);

create index idx_gc_goal on public.goal_contributions(goal_id, contribution_date desc);
create index idx_gc_user on public.goal_contributions(user_id);

alter table public.goal_contributions enable row level security;

create policy "gc_owner" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── subscriptions (las del usuario, ej Netflix; NO suscripción FlowFinance)
create table public.subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  recurring_id                uuid references public.recurrings(id) on delete set null,
  category_id                 uuid references public.categories(id) on delete set null,
  card_id                     uuid references public.credit_cards(id) on delete set null,
  account_id                  uuid references public.accounts(id) on delete set null,
  service_name                text not null,
  plan                        text,
  amount                      numeric(15,2) not null,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  frequency                   recurrence_freq not null default 'monthly',
  next_charge_date            date not null,
  start_date                  date not null,
  end_date                    date,
  free_trial_until            date,
  detected_automatically      boolean not null default false,
  is_active                   boolean not null default true,
  cancel_url                  text,
  notes                       text,
  usage_score                 numeric(5,2),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_subs_user on public.subscriptions(user_id) where is_active = true;
create index idx_subs_next on public.subscriptions(user_id, next_charge_date) where is_active = true;

create trigger trg_subs_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subs_owner" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
