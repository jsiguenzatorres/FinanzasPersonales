-- ===========================================================================
-- FlowFinance — 07 · Cuentas financieras (MOD-02)
-- ===========================================================================
-- Crea: accounts
-- Dependencias: users, currencies
-- ===========================================================================

create table public.accounts (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  name                        text not null,
  type                        account_type not null,
  status                      account_status not null default 'active',
  bank_name                   text,
  account_number_mask         text,
  currency                    char(3) not null default 'USD' references public.currencies(code),
  balance                     numeric(15,2) not null default 0,
  initial_balance             numeric(15,2) not null default 0,
  interest_rate               numeric(7,4) default 0,
  credit_limit                numeric(15,2),
  color                       text,
  icon                        text,
  is_included_in_net_worth    boolean not null default true,
  is_archived                 boolean not null default false,
  belvo_account_id            text,
  belvo_link_id               text,
  last_sync_at                timestamptz,
  parent_account_id           uuid references public.accounts(id) on delete cascade,
  virtual_buckets             jsonb not null default '[]'::jsonb,
  version                     integer not null default 1,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_accounts_user
  on public.accounts(user_id) where is_archived = false;
create index idx_accounts_type
  on public.accounts(user_id, type);
create index idx_accounts_parent
  on public.accounts(parent_account_id);
create index idx_accounts_belvo
  on public.accounts(belvo_account_id) where belvo_account_id is not null;

create trigger trg_accounts_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
