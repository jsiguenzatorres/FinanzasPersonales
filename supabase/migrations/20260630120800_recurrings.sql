-- ===========================================================================
-- FlowFinance — 09 · Recurrings (plantillas de transacciones recurrentes)
-- ===========================================================================
-- Crea: recurrings
-- Dependencias: users, accounts, credit_cards, categories
-- ===========================================================================

create table public.recurrings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  account_id          uuid references public.accounts(id) on delete cascade,
  card_id             uuid references public.credit_cards(id) on delete set null,
  category_id         uuid references public.categories(id) on delete set null,
  name                text not null,
  kind                transaction_kind not null,
  amount              numeric(15,2) not null,
  currency            char(3) not null default 'USD' references public.currencies(code),
  frequency           recurrence_freq not null,
  day_of_month        smallint,
  day_of_week         smallint,
  start_date          date not null,
  end_date            date,
  next_run_date       date not null,
  is_active           boolean not null default true,
  auto_create         boolean not null default true,
  notify_before_days  smallint default 1,
  source_type         text,
  source_metadata     jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_recurrings_user
  on public.recurrings(user_id, is_active);
create index idx_recurrings_next
  on public.recurrings(next_run_date) where is_active = true and auto_create = true;

create trigger trg_recurrings_updated_at
  before update on public.recurrings
  for each row execute function public.set_updated_at();

alter table public.recurrings enable row level security;

create policy "recurrings_owner" on public.recurrings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
