-- ===========================================================================
-- FlowFinance — 24 · Trigger de balance de cuentas (MOD-02 §5.1)
-- ===========================================================================
-- Crea: update_account_balance() — mantiene accounts.balance sincronizado
-- con las transacciones cleared/reconciled. Pending y void se ignoran.
-- Dependencias: accounts, transactions
-- ===========================================================================

create or replace function public.update_account_balance()
returns trigger
language plpgsql
as $$
declare
  v_old_delta numeric(15,2) := 0;
  v_new_delta numeric(15,2) := 0;
begin
  -- Revertir efecto de la fila anterior (UPDATE o DELETE)
  if TG_OP in ('UPDATE', 'DELETE') then
    if OLD.status in ('cleared', 'reconciled') and OLD.deleted_at is null then
      v_old_delta := public.transaction_balance_delta(OLD.kind, OLD.amount);
      update public.accounts
         set balance = balance - v_old_delta,
             version = version + 1
       where id = OLD.account_id;
    end if;
  end if;

  -- Aplicar efecto de la fila nueva (INSERT o UPDATE)
  if TG_OP in ('INSERT', 'UPDATE') then
    if NEW.status in ('cleared', 'reconciled') and NEW.deleted_at is null then
      v_new_delta := public.transaction_balance_delta(NEW.kind, NEW.amount);
      update public.accounts
         set balance = balance + v_new_delta,
             version = version + 1
       where id = NEW.account_id;
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

comment on function public.update_account_balance() is
  'Trigger AFTER INSERT/UPDATE/DELETE en transactions: mantiene accounts.balance sincronizado.';

-- ─── Helper: signo del delta según el tipo de transacción ─────────────────
create or replace function public.transaction_balance_delta(p_kind transaction_kind, p_amount numeric)
returns numeric(15,2)
language sql
immutable
as $$
  select case p_kind
    when 'income'           then p_amount
    when 'transfer_in'      then p_amount
    when 'refund'           then p_amount
    when 'interest_earned'  then p_amount
    when 'expense'          then -p_amount
    when 'transfer_out'     then -p_amount
    when 'cc_payment'       then -p_amount
    when 'fee'              then -p_amount
    when 'interest_paid'    then -p_amount
    when 'adjustment'       then p_amount
    else 0
  end;
$$;

comment on function public.transaction_balance_delta(transaction_kind, numeric) is
  'Devuelve el delta con signo correcto para aplicar a accounts.balance según kind.';

create trigger trg_transactions_balance
  after insert or update or delete on public.transactions
  for each row execute function public.update_account_balance();
