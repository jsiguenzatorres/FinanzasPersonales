-- ===========================================================================
-- FlowFinance — 28 · Vista de patrimonio neto en vivo (MOD-17)
-- ===========================================================================
-- Crea: v_net_worth_current — agrega activos y pasivos del usuario actual
-- en tiempo real, usando to_base_currency() ya existente (migración 3).
--
-- Cobertura MVP (Fase 1): cuentas (accounts) + tarjetas (credit_cards) +
-- activos/pasivos manuales. Inversiones y préstamos otorgados se suman en
-- Fase 2 cuando existan esos módulos.
--
-- También agrega policy de INSERT en net_worth_snapshots para permitir que
-- el usuario fuerce un snapshot manual (antes solo insertaba service_role).
--
-- BUG encontrado: to_base_currency() estaba documentada en SCHEMA-COMPLETO.md
-- (§3.5, una de las "5 funciones compartidas") pero NUNCA se escribió en
-- ninguna de las 23 migraciones originales. Se implementa aquí, donde se usa
-- por primera vez de verdad.
-- ===========================================================================

create or replace function public.to_base_currency(
  p_amount numeric, p_currency char(3), p_user_id uuid, p_date date
)
returns numeric(15,2)
language plpgsql
stable
as $$
declare
  v_base char(3);
  v_rate numeric(15,6);
begin
  select currency_default into v_base from public.users where id = p_user_id;
  if v_base is null then
    v_base := 'USD';
  end if;

  if v_base = p_currency then
    return p_amount;
  end if;

  v_rate := public.get_fx_rate(p_currency, v_base, p_date);
  if v_rate is null then
    return null;
  end if;

  return round(p_amount * v_rate, 2);
end;
$$;

comment on function public.to_base_currency(numeric, char(3), uuid, date) is
  'Convierte un monto de p_currency a la moneda base del usuario, usando get_fx_rate(). '
  'Devuelve NULL si no hay tasa disponible para la fecha (el llamador debe manejarlo).';

create or replace view public.v_net_worth_current
with (security_invoker = true)
as
with assets_accounts as (
  select coalesce(sum(public.to_base_currency(balance, currency, user_id, current_date)), 0) as val
    from public.accounts
   where user_id = auth.uid()
     and is_included_in_net_worth = true
     and is_archived = false
     and type <> 'credit_card'
     and balance > 0
),
liabilities_overdrafts as (
  select coalesce(sum(public.to_base_currency(-balance, currency, user_id, current_date)), 0) as val
    from public.accounts
   where user_id = auth.uid()
     and is_included_in_net_worth = true
     and is_archived = false
     and type <> 'credit_card'
     and balance < 0
),
liabilities_cc as (
  select coalesce(sum(public.to_base_currency(current_balance, currency, user_id, current_date)), 0) as val
    from public.credit_cards
   where user_id = auth.uid()
     and status = 'active'
     and current_balance > 0
),
assets_manual as (
  select coalesce(sum(public.to_base_currency(value, currency, user_id, current_date)), 0) as val
    from public.manual_assets
   where user_id = auth.uid()
     and is_active = true
),
liabilities_manual as (
  select coalesce(sum(public.to_base_currency(amount, currency, user_id, current_date)), 0) as val
    from public.manual_liabilities
   where user_id = auth.uid()
     and is_active = true
)
select
  auth.uid() as user_id,
  (select currency_default from public.users where id = auth.uid()) as currency,
  (assets_accounts.val + assets_manual.val) as total_assets,
  (liabilities_overdrafts.val + liabilities_cc.val + liabilities_manual.val) as total_liabilities,
  (assets_accounts.val + assets_manual.val)
    - (liabilities_overdrafts.val + liabilities_cc.val + liabilities_manual.val) as net_worth,
  jsonb_build_object(
    'cash', assets_accounts.val,
    'manual', assets_manual.val
  ) as assets_breakdown,
  jsonb_build_object(
    'credit_cards', liabilities_cc.val,
    'overdrafts', liabilities_overdrafts.val,
    'manual', liabilities_manual.val
  ) as liabilities_breakdown
from assets_accounts, liabilities_overdrafts, liabilities_cc, assets_manual, liabilities_manual;

comment on view public.v_net_worth_current is
  'Patrimonio neto en vivo del usuario autenticado. Cobertura MVP: accounts + credit_cards + '
  'manual_assets + manual_liabilities. Inversiones y préstamos otorgados se suman en Fase 2.';

-- ─── Permitir snapshot manual desde la app ─────────────────────────────────
create policy "nw_owner_insert" on public.net_worth_snapshots
  for insert with check (auth.uid() = user_id);

comment on policy "nw_owner_insert" on public.net_worth_snapshots is
  'Permite que el usuario fuerce un snapshot manual (decisión MOD-17 #1). '
  'El snapshot automático semanal seguirá insertando vía service_role cuando se active pg_cron.';
