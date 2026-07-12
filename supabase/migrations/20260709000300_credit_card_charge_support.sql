-- ===========================================================================
-- FlowFinance — 27 · Soporte de cargos a tarjeta + trigger de saldo (MOD-15)
-- ===========================================================================
-- Problema: transactions.account_id era NOT NULL, pero un cargo a tarjeta
-- (kind='cc_charge') no sale de una cuenta bancaria — sale de la tarjeta.
-- La "cuenta espejo" de la tarjeta es opt-in (decisión MOD-15 §16, default
-- OFF), así que no podíamos forzar account_id en cc_charge.
--
-- Fix: account_id pasa a ser nullable, con constraint que exige UNO de los
-- dos (account_id o card_id) según el kind.
--
-- También faltaba el trigger que mantiene credit_cards.current_balance
-- sincronizado — el trigger de MOD-02 solo toca accounts.balance.
-- ===========================================================================

-- ─── account_id nullable + constraint condicional ─────────────────────────
alter table public.transactions alter column account_id drop not null;

alter table public.transactions
  add constraint chk_tx_account_or_card
  check (
    (kind = 'cc_charge' and card_id is not null)
    or (kind <> 'cc_charge' and account_id is not null)
  );

comment on constraint chk_tx_account_or_card on public.transactions is
  'cc_charge requiere card_id (no toca cuenta bancaria); el resto de kinds requiere account_id.';

-- ─── Trigger de saldo de tarjeta ───────────────────────────────────────────
create or replace function public.cc_balance_delta(p_kind transaction_kind, p_amount numeric)
returns numeric(15,2)
language sql
immutable
as $$
  select case p_kind
    when 'cc_charge'      then p_amount   -- aumenta la deuda
    when 'cc_payment'     then -p_amount  -- reduce la deuda
    when 'interest_paid'  then p_amount   -- interés cargado a la tarjeta
    when 'fee'            then p_amount   -- comisión/anualidad cargada a la tarjeta
    when 'refund'         then -p_amount  -- reembolso a la tarjeta
    else 0
  end;
$$;

comment on function public.cc_balance_delta(transaction_kind, numeric) is
  'Delta con signo correcto para aplicar a credit_cards.current_balance según kind.';

create or replace function public.update_credit_card_balance()
returns trigger
language plpgsql
as $$
declare
  v_old_delta numeric(15,2) := 0;
  v_new_delta numeric(15,2) := 0;
begin
  if TG_OP in ('UPDATE', 'DELETE') then
    if OLD.card_id is not null and OLD.status in ('cleared', 'reconciled') and OLD.deleted_at is null then
      v_old_delta := public.cc_balance_delta(OLD.kind, OLD.amount);
      update public.credit_cards
         set current_balance = current_balance - v_old_delta
       where id = OLD.card_id;
    end if;
  end if;

  if TG_OP in ('INSERT', 'UPDATE') then
    if NEW.card_id is not null and NEW.status in ('cleared', 'reconciled') and NEW.deleted_at is null then
      v_new_delta := public.cc_balance_delta(NEW.kind, NEW.amount);
      update public.credit_cards
         set current_balance = current_balance + v_new_delta
       where id = NEW.card_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.update_credit_card_balance() is
  'Trigger AFTER INSERT/UPDATE/DELETE en transactions: mantiene credit_cards.current_balance sincronizado.';

create trigger trg_transactions_cc_balance
  after insert or update or delete on public.transactions
  for each row execute function public.update_credit_card_balance();
