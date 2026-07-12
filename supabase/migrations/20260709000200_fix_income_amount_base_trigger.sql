-- ===========================================================================
-- FlowFinance — 26 · Fix: trigger de amount_base específico para income_entries
-- ===========================================================================
-- Bug: el trigger genérico fill_amount_base() (migración 22) asume una
-- columna `amount`, pero income_entries tiene `gross_amount`/`net_amount`.
-- Referenciar (new).amount en esa tabla causa error en runtime al insertar.
--
-- Fix: función dedicada que usa net_amount (lo que realmente entra a la
-- cuenta) como base de conversión FX, consistente con cómo se usa
-- amount_base en transactions.
-- ===========================================================================

create or replace function public.fill_income_amount_base()
returns trigger
language plpgsql
as $$
declare
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = new.user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if new.currency = v_base then
    new.amount_base := new.net_amount;
    new.fx_rate := 1.0;
  elsif new.amount_base is null or new.fx_rate is null then
    new.fx_rate := public.get_fx_rate(new.currency, v_base, new.income_date);
    if new.fx_rate is not null then
      new.amount_base := round(new.net_amount * new.fx_rate, 2);
    else
      new.amount_base := null;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.fill_income_amount_base() is
  'Trigger BEFORE INSERT/UPDATE en income_entries: completa amount_base usando net_amount (dinero real recibido).';

drop trigger if exists trg_amount_base_income on public.income_entries;

create trigger trg_amount_base_income
  before insert or update of gross_amount, net_amount, currency, income_date
  on public.income_entries
  for each row execute function public.fill_income_amount_base();
