-- ===========================================================================
-- FlowFinance — 12 · Income entries (MOD-00)
-- ===========================================================================
-- Crea: income_entries + cierra los FKs circulares en tax_records
-- Dependencias: users, accounts, recurrings, transactions, tax_records
-- ===========================================================================

create table public.income_entries (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  account_id                  uuid references public.accounts(id) on delete set null,
  recurring_id                uuid references public.recurrings(id) on delete set null,
  transaction_id              uuid references public.transactions(id) on delete set null,

  type                        income_type not null,
  source_name                 text not null,
  gross_amount                numeric(15,2) not null,
  net_amount                  numeric(15,2) not null,
  deductions                  jsonb not null default '[]'::jsonb,

  currency                    char(3) not null default 'USD' references public.currencies(code),
  amount_base                 numeric(15,2),
  fx_rate                     numeric(15,6),

  income_date                 date not null,
  pay_period_start            date,
  pay_period_end              date,

  is_collected                boolean not null default true,
  expected_date               date,
  invoice_number              text,
  invoice_url                 text,

  is_recurring                boolean not null default false,
  is_tax_relevant             boolean not null default true,
  tax_withheld                numeric(15,2) default 0,

  goal_allocation             jsonb default '{}'::jsonb,

  notes                       text,
  tags                        text[] default '{}',

  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint chk_income_amounts
    check (gross_amount >= 0 and net_amount >= 0 and net_amount <= gross_amount)
);

create index idx_income_user_date
  on public.income_entries(user_id, income_date desc) where deleted_at is null;
create index idx_income_type
  on public.income_entries(user_id, type, income_date desc) where deleted_at is null;
create index idx_income_pending
  on public.income_entries(user_id, expected_date) where is_collected = false;

create trigger trg_income_updated_at
  before update on public.income_entries
  for each row execute function public.set_updated_at();

alter table public.income_entries enable row level security;

create policy "income_owner" on public.income_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Cerrar FKs circulares en tax_records ─────────────────────────────────
alter table public.tax_records
  add constraint tax_records_transaction_fk
    foreign key (transaction_id) references public.transactions(id) on delete set null;

alter table public.tax_records
  add constraint tax_records_income_fk
    foreign key (income_entry_id) references public.income_entries(id) on delete set null;
