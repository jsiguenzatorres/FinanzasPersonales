-- ===========================================================================
-- FlowFinance — 34 · MOD-13 Préstamos Familiares
-- ===========================================================================
-- Crea: family_loans, family_loan_payments
-- Extiende: transaction_kind (+ cc_cash_advance), chk_tx_account_or_card,
--           cc_balance_delta(), update_budget_spent()
-- Spec completa: docs/modules/mod-13-prestamos-familiares.md
--
-- Diseño clave: un préstamo entregado vía tarjeta/cuenta SIEMPRE tiene una
-- transacción real detrás (family_loans.transaction_id) — nunca se registra
-- el monto "flotando" sin afectar el saldo real de donde salió. El split
-- parcial (parte del gasto es personal, parte es préstamo) se resuelve con
-- family_loans.linked_amount, NO creando transacciones hijas — eso hubiera
-- arriesgado descontar el mismo dinero dos veces del saldo real.
-- ===========================================================================

-- Nota: el valor de enum 'cc_cash_advance' se agregó en la migración anterior
-- (34a — cc_cash_advance_enum.sql). Tenía que confirmarse en su propia
-- transacción antes de poder usarse en los checks/funciones de este archivo.

-- ─── 2. cc_cash_advance requiere card_id, igual que cc_charge ─────────────
alter table public.transactions drop constraint if exists chk_tx_account_or_card;

alter table public.transactions
  add constraint chk_tx_account_or_card
  check (
    (kind in ('cc_charge', 'cc_cash_advance') and card_id is not null)
    or (kind not in ('cc_charge', 'cc_cash_advance') and account_id is not null)
  );

comment on constraint chk_tx_account_or_card on public.transactions is
  'cc_charge y cc_cash_advance requieren card_id (no tocan cuenta bancaria); el resto de kinds requiere account_id.';

-- ─── 3. cc_cash_advance aumenta la deuda de tarjeta, igual que cc_charge ──
create or replace function public.cc_balance_delta(p_kind transaction_kind, p_amount numeric)
returns numeric(15,2)
language sql
immutable
as $$
  select case p_kind
    when 'cc_charge'        then p_amount   -- aumenta la deuda
    when 'cc_cash_advance'  then p_amount   -- retiro de efectivo — también aumenta la deuda
    when 'cc_payment'       then -p_amount  -- reduce la deuda
    when 'interest_paid'    then p_amount   -- interés cargado a la tarjeta
    when 'fee'              then p_amount   -- comisión/anualidad cargada a la tarjeta
    when 'refund'           then -p_amount  -- reembolso a la tarjeta
    else 0
  end;
$$;

-- ─── 4. family_loans ────────────────────────────────────────────────────────
-- drop if exists: un intento anterior de esta migración pudo haber creado
-- parcialmente estas tablas antes de fallar por el problema del enum (§1).
drop table if exists public.family_loan_payments cascade;
drop table if exists public.family_loans cascade;

create table public.family_loans (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,

  person_name         text not null,
  relationship        text,
  original_amount     numeric(15,2) not null check (original_amount > 0),
  balance             numeric(15,2) not null,
  currency            char(3) not null default 'USD' references public.currencies(code),

  delivery_date       date not null,
  delivery_method     text not null check (delivery_method in (
                         'cash', 'transfer', 'debit',
                         'credit_purchase', 'credit_cash_advance',
                         'bitcoin', 'crypto'
                       )),
  origin_account_id   uuid references public.accounts(id) on delete set null,
  origin_card_id      uuid references public.credit_cards(id) on delete set null,

  -- El cargo/retiro/transferencia real que originó el préstamo (Flujo A) o el
  -- gasto ya existente vinculado retroactivamente (Flujo B). linked_amount
  -- NULL = el préstamo es el 100% del monto de transaction_id; si tiene
  -- valor, solo esa porción es préstamo (split parcial, spec §3).
  transaction_id      uuid references public.transactions(id) on delete set null,
  linked_amount        numeric(15,2) check (linked_amount is null or linked_amount > 0),

  category            text,
  evidence_url         text,
  agreed_payment_date  date,
  notes                text,
  status               text not null check (status in ('active', 'paid', 'written_off')) default 'active',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint chk_family_loan_card_origin check (
    (delivery_method in ('credit_purchase', 'credit_cash_advance') and origin_card_id is not null)
    or (delivery_method not in ('credit_purchase', 'credit_cash_advance'))
  )
);

create index idx_family_loans_user on public.family_loans(user_id, status);
create index idx_family_loans_transaction on public.family_loans(transaction_id) where transaction_id is not null;

create trigger trg_family_loans_updated_at
  before update on public.family_loans
  for each row execute function public.set_updated_at();

alter table public.family_loans enable row level security;

create policy "family_loans_owner" on public.family_loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── 5. family_loan_payments ───────────────────────────────────────────────
create table public.family_loan_payments (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  loan_id                 uuid not null references public.family_loans(id) on delete cascade,

  amount                  numeric(15,2) not null check (amount > 0),
  payment_method          text,
  destination_account_id  uuid references public.accounts(id) on delete set null,
  transaction_id          uuid references public.transactions(id) on delete set null,
  resulting_balance       numeric(15,2) not null,
  evidence_url            text,
  notes                   text,
  paid_at                 date not null,

  created_at              timestamptz not null default now()
);

create index idx_family_loan_payments_loan on public.family_loan_payments(loan_id, paid_at desc);

alter table public.family_loan_payments enable row level security;

create policy "family_loan_payments_owner" on public.family_loan_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── 6. update_budget_spent(): incluir cc_cash_advance en los kinds trackeados ──
create or replace function public.update_budget_spent()
returns trigger
language plpgsql
as $$
declare
  v_old_budget_cat_id uuid;
  v_new_budget_cat_id uuid;
  v_old_resolved_cat uuid;
  v_new_resolved_cat uuid;
  v_old_delta numeric(15,2);
  v_new_delta numeric(15,2);
begin
  if TG_OP in ('UPDATE', 'DELETE') then
    if OLD.kind in ('expense', 'cc_charge', 'cc_cash_advance', 'refund')
       and OLD.deleted_at is null
       and OLD.category_id is not null then
      v_old_resolved_cat := public.resolve_budget_category_id(OLD.category_id);

      select bc.id into v_old_budget_cat_id
        from public.budget_categories bc
        join public.budgets b on b.id = bc.budget_id
       where bc.category_id = v_old_resolved_cat
         and b.user_id = OLD.user_id
         and b.is_locked = false
         and OLD.transaction_date between b.period_start and b.period_end
       limit 1;

      if v_old_budget_cat_id is not null then
        v_old_delta := case OLD.kind when 'refund' then -OLD.amount else OLD.amount end;
        update public.budget_categories
           set spent_amount = spent_amount - v_old_delta
         where id = v_old_budget_cat_id;
      end if;
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') then
    if NEW.kind in ('expense', 'cc_charge', 'cc_cash_advance', 'refund')
       and NEW.deleted_at is null
       and NEW.category_id is not null then
      v_new_resolved_cat := public.resolve_budget_category_id(NEW.category_id);

      select bc.id into v_new_budget_cat_id
        from public.budget_categories bc
        join public.budgets b on b.id = bc.budget_id
       where bc.category_id = v_new_resolved_cat
         and b.user_id = NEW.user_id
         and b.is_locked = false
         and NEW.transaction_date between b.period_start and b.period_end
       limit 1;

      if v_new_budget_cat_id is not null then
        v_new_delta := case NEW.kind when 'refund' then -NEW.amount else NEW.amount end;
        update public.budget_categories
           set spent_amount = spent_amount + v_new_delta
         where id = v_new_budget_cat_id;
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

-- ─── 7. Excluir del presupuesto la porción vinculada a un préstamo ────────
-- Se dispara sobre family_loans (no sobre transactions) porque el vínculo
-- a menudo se crea DESPUÉS de la transacción (Flujo B, o el segundo insert
-- del Flujo A) — update_budget_spent() ya contó el monto completo como
-- gasto en ese momento; este trigger revierte la porción que corresponde
-- al préstamo (linked_amount, o el monto completo si linked_amount es NULL).
create or replace function public.update_budget_spent_for_loan_link()
returns trigger
language plpgsql
as $$
declare
  v_tx record;
  v_resolved_cat uuid;
  v_budget_cat_id uuid;
  v_old_excluded numeric(15,2);
  v_new_excluded numeric(15,2);
begin
  if TG_OP in ('UPDATE', 'DELETE') and OLD.transaction_id is not null then
    select * into v_tx from public.transactions where id = OLD.transaction_id and deleted_at is null;
    if found and v_tx.kind in ('expense', 'cc_charge', 'cc_cash_advance', 'refund') and v_tx.category_id is not null then
      v_resolved_cat := public.resolve_budget_category_id(v_tx.category_id);
      select bc.id into v_budget_cat_id
        from public.budget_categories bc
        join public.budgets b on b.id = bc.budget_id
       where bc.category_id = v_resolved_cat
         and b.user_id = v_tx.user_id
         and b.is_locked = false
         and v_tx.transaction_date between b.period_start and b.period_end
       limit 1;

      if v_budget_cat_id is not null then
        v_old_excluded := coalesce(OLD.linked_amount, v_tx.amount);
        update public.budget_categories
           set spent_amount = spent_amount + v_old_excluded
         where id = v_budget_cat_id;
      end if;
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') and NEW.transaction_id is not null then
    select * into v_tx from public.transactions where id = NEW.transaction_id and deleted_at is null;
    if found and v_tx.kind in ('expense', 'cc_charge', 'cc_cash_advance', 'refund') and v_tx.category_id is not null then
      v_resolved_cat := public.resolve_budget_category_id(v_tx.category_id);
      select bc.id into v_budget_cat_id
        from public.budget_categories bc
        join public.budgets b on b.id = bc.budget_id
       where bc.category_id = v_resolved_cat
         and b.user_id = v_tx.user_id
         and b.is_locked = false
         and v_tx.transaction_date between b.period_start and b.period_end
       limit 1;

      if v_budget_cat_id is not null then
        v_new_excluded := coalesce(NEW.linked_amount, v_tx.amount);
        update public.budget_categories
           set spent_amount = spent_amount - v_new_excluded
         where id = v_budget_cat_id;
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.update_budget_spent_for_loan_link() is
  'Trigger AFTER INSERT/UPDATE/DELETE en family_loans: excluye del presupuesto la porción de una '
  'transacción que corresponde a un préstamo familiar vinculado (linked_amount, o el monto completo si es NULL).';

create trigger trg_family_loans_budget_exclusion
  after insert or update or delete on public.family_loans
  for each row execute function public.update_budget_spent_for_loan_link();
