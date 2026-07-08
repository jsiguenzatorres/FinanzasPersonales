-- ===========================================================================
-- FlowFinance — 13 · Presupuesto (MOD-03)
-- ===========================================================================
-- Crea: budgets, budget_categories
-- Dependencias: users, collab_spaces, categories
-- ===========================================================================

create table public.budgets (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  collab_space_id             uuid references public.collab_spaces(id) on delete cascade,

  period_start                date not null,
  period_end                  date not null,
  mode                        budget_mode not null,

  total_income_expected       numeric(15,2) not null default 0,
  total_allocated             numeric(15,2) not null default 0,
  total_spent                 numeric(15,2) not null default 0,
  unallocated                 numeric(15,2) generated always as
                                (total_income_expected - total_allocated) stored,

  currency                    char(3) not null default 'USD' references public.currencies(code),
  is_locked                   boolean not null default false,
  is_template                 boolean not null default false,
  rollover_unspent            boolean not null default false,
  rollover_overspent          boolean not null default true,

  notes                       text,
  version                     integer not null default 1,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (user_id, period_start, collab_space_id),
  constraint chk_budget_period check (period_end >= period_start)
);

create index idx_budgets_user_period on public.budgets(user_id, period_start desc);
create index idx_budgets_collab on public.budgets(collab_space_id) where collab_space_id is not null;

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets_owner_or_collab" on public.budgets
  for all
  using (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  )
  with check (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

-- ─── budget_categories ─────────────────────────────────────────────────────
create table public.budget_categories (
  id                          uuid primary key default gen_random_uuid(),
  budget_id                   uuid not null references public.budgets(id) on delete cascade,
  category_id                 uuid not null references public.categories(id) on delete restrict,

  allocated_amount            numeric(15,2) not null default 0,
  spent_amount                numeric(15,2) not null default 0,
  rollover_amount             numeric(15,2) not null default 0,
  available_amount            numeric(15,2) generated always as
                                (allocated_amount + rollover_amount - spent_amount) stored,

  warning_threshold           numeric(5,2) default 80.00,
  status                      budget_status generated always as (
                                case
                                  when (spent_amount / nullif(allocated_amount + rollover_amount, 0)) >= 1.0
                                    then 'over'::budget_status
                                  when (spent_amount / nullif(allocated_amount + rollover_amount, 0))
                                       >= (warning_threshold / 100.0)
                                    then 'warning'::budget_status
                                  else 'on_track'::budget_status
                                end
                              ) stored,

  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (budget_id, category_id)
);

create index idx_bc_budget on public.budget_categories(budget_id);
create index idx_bc_status on public.budget_categories(budget_id, status);

create trigger trg_bc_updated_at
  before update on public.budget_categories
  for each row execute function public.set_updated_at();

alter table public.budget_categories enable row level security;

create policy "bc_via_budget" on public.budget_categories
  for all using (
    exists (
      select 1 from public.budgets b
       where b.id = budget_id
         and (
           b.user_id = auth.uid()
           or (b.collab_space_id is not null and public.is_collab_member(b.collab_space_id))
         )
    )
  );
