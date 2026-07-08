-- ===========================================================================
-- FlowFinance — 10 · Skeleton tablas referenciadas por transactions
-- ===========================================================================
-- Crea: tax_records, trips, goals (sin sus FKs cruzadas a transactions)
-- Dependencias: users, collab_spaces, accounts
-- Nota: transaction_id / income_entry_id FKs se agregan en migración 12
-- ===========================================================================

-- ─── tax_records ───────────────────────────────────────────────────────────
create table public.tax_records (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  transaction_id          uuid,    -- FK añadido luego (circular con transactions)
  income_entry_id         uuid,    -- FK añadido luego (circular con income_entries)
  fiscal_year             smallint not null,
  fiscal_period           text,
  fiscal_month            smallint,
  type                    tax_record_type not null,
  amount                  numeric(15,2) not null,
  currency                char(3) not null default 'USD' references public.currencies(code),
  issuer_tax_id           text,
  issuer_name             text,
  receiver_tax_id         text,
  invoice_uuid            text,
  invoice_number          text,
  invoice_url             text,
  invoice_type            text,
  deduction_category      text,
  vat_amount              numeric(15,2),
  income_tax_amount       numeric(15,2),
  withholding_amount      numeric(15,2),
  is_validated            boolean not null default false,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_tax_user_year on public.tax_records(user_id, fiscal_year, type);
create index idx_tax_invoice
  on public.tax_records(invoice_uuid) where invoice_uuid is not null;

create trigger trg_tax_updated_at
  before update on public.tax_records
  for each row execute function public.set_updated_at();

alter table public.tax_records enable row level security;

create policy "tax_owner" on public.tax_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── trips ─────────────────────────────────────────────────────────────────
create table public.trips (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  collab_space_id             uuid references public.collab_spaces(id) on delete cascade,
  goal_id                     uuid,   -- FK añadido en migración de goals
  destination                 text not null,
  destination_country         char(2),
  destination_currency        char(3) references public.currencies(code),
  start_date                  date not null,
  end_date                    date not null,
  travelers_count             smallint not null default 1,
  budget                      numeric(15,2) not null,
  budget_currency             char(3) not null default 'USD' references public.currencies(code),
  actual_spent                numeric(15,2) not null default 0,
  ai_itinerary                jsonb,
  destination_info            jsonb,
  flight_info                 jsonb,
  lodging_info                jsonb,
  status                      trip_status not null default 'planning',
  cover_image_url             text,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_trips_user on public.trips(user_id, status);
create index idx_trips_collab on public.trips(collab_space_id) where collab_space_id is not null;

create trigger trg_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

create policy "trips_owner_or_collab" on public.trips
  for all
  using (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)))
  with check (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)));

-- ─── goals ─────────────────────────────────────────────────────────────────
create table public.goals (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  collab_space_id             uuid references public.collab_spaces(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  name                        text not null,
  description                 text,
  type                        goal_type not null,
  icon                        text,
  color                       text,
  target_amount               numeric(15,2) not null,
  current_amount              numeric(15,2) not null default 0,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  progress_pct                numeric(5,2) generated always as (
                                case when target_amount > 0
                                  then round(current_amount / target_amount * 100, 2)
                                  else 0 end
                              ) stored,
  start_date                  date not null default current_date,
  target_date                 date,
  monthly_contribution        numeric(15,2),
  status                      goal_status not null default 'active',
  priority                    smallint default 5,
  auto_contribution_pct       numeric(5,2),
  ai_feasibility_score        numeric(5,2),
  ai_recommendation           text,
  ai_updated_at               timestamptz,
  deleted_at                  timestamptz,
  completed_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_goals_user on public.goals(user_id, status) where deleted_at is null;
create index idx_goals_collab on public.goals(collab_space_id) where collab_space_id is not null;

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals_owner_or_collab" on public.goals
  for all
  using (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)))
  with check (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)));

-- ─── trips.goal_id FK ahora que goals existe ──────────────────────────────
alter table public.trips
  add constraint trips_goal_fk
  foreign key (goal_id) references public.goals(id) on delete set null;
