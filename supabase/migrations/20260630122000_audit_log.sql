-- ===========================================================================
-- FlowFinance — 21 · Audit log (solo deletes/exports/login/consent_change)
-- ===========================================================================
-- Crea: audit_log
-- Dependencias: users
-- ===========================================================================

create table public.audit_log (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.users(id) on delete set null,
  acting_user_id              uuid references public.users(id) on delete set null,
  action                      audit_action not null,
  entity_type                 text not null,
  entity_id                   uuid,
  before_data                 jsonb,
  after_data                  jsonb,
  ip_address                  inet,
  user_agent                  text,
  session_id                  text,
  metadata                    jsonb,
  created_at                  timestamptz not null default now()
);

create index idx_audit_user
  on public.audit_log(user_id, created_at desc);
create index idx_audit_entity
  on public.audit_log(entity_type, entity_id, created_at desc);
create index idx_audit_action
  on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_owner_read" on public.audit_log
  for select using (auth.uid() = user_id);
-- inserts solo vía triggers o service_role

-- ─── log_delete_audit: trigger genérico para AFTER DELETE ────────────────
-- Se aplica selectivamente a tablas con datos sensibles (transactions,
-- income_entries, goals, family_loans, loan_portfolio).
create or replace function public.log_delete_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, acting_user_id, action, entity_type, entity_id, before_data)
  values (
    old.user_id,
    auth.uid(),
    'delete',
    tg_table_name,
    old.id,
    to_jsonb(old)
  );
  return old;
end;
$$;

-- Aplicar a tablas con soft-delete que sí permiten DELETE físico tras purga
create trigger trg_audit_delete_transactions
  after delete on public.transactions
  for each row execute function public.log_delete_audit();

create trigger trg_audit_delete_income
  after delete on public.income_entries
  for each row execute function public.log_delete_audit();

create trigger trg_audit_delete_goals
  after delete on public.goals
  for each row execute function public.log_delete_audit();

create trigger trg_audit_delete_family_loans
  after delete on public.family_loans
  for each row execute function public.log_delete_audit();

create trigger trg_audit_delete_loan_portfolio
  after delete on public.loan_portfolio
  for each row execute function public.log_delete_audit();
