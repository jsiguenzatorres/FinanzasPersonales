-- ===========================================================================
-- FlowFinance — MOD-07 Inversiones · v_net_worth_current suma investments +
-- family_loans (bug encontrado, ver docs/modules/mod-07-inversiones.md §3)
-- ===========================================================================
-- v_net_worth_current (20260709000400) decía en su propio comentario:
-- "Inversiones y préstamos otorgados se suman en Fase 2 cuando existan esos
-- módulos" — Inversiones nunca existió hasta ahora; Préstamos Familiares SÍ
-- se construyó en Fase 2 pero nunca se conectó a esta vista. Se corrigen
-- ambos aquí, en la misma migración, ya que se toca la vista de todas formas.
--
-- AVISO: esto cambia el patrimonio neto mostrado a cualquier usuario con
-- préstamos familiares activos (dinero prestado ahora cuenta como activo,
-- correctamente) — no es un bug nuevo, es la corrección del ya documentado.
-- ===========================================================================

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
),
assets_investments as (
  select coalesce(sum(public.to_base_currency(coalesce(current_value, 0), currency, user_id, current_date)), 0) as val
    from public.investments
   where user_id = auth.uid()
     and is_active = true
),
assets_receivables as (
  select coalesce(sum(public.to_base_currency(balance, currency, user_id, current_date)), 0) as val
    from public.family_loans
   where user_id = auth.uid()
     and status = 'active'
)
select
  auth.uid() as user_id,
  (select currency_default from public.users where id = auth.uid()) as currency,
  (assets_accounts.val + assets_manual.val + assets_investments.val + assets_receivables.val) as total_assets,
  (liabilities_overdrafts.val + liabilities_cc.val + liabilities_manual.val) as total_liabilities,
  (assets_accounts.val + assets_manual.val + assets_investments.val + assets_receivables.val)
    - (liabilities_overdrafts.val + liabilities_cc.val + liabilities_manual.val) as net_worth,
  jsonb_build_object(
    'cash', assets_accounts.val,
    'manual', assets_manual.val,
    'investments', assets_investments.val,
    'receivables', assets_receivables.val
  ) as assets_breakdown,
  jsonb_build_object(
    'credit_cards', liabilities_cc.val,
    'overdrafts', liabilities_overdrafts.val,
    'manual', liabilities_manual.val
  ) as liabilities_breakdown
from assets_accounts, liabilities_overdrafts, liabilities_cc, assets_manual, liabilities_manual,
     assets_investments, assets_receivables;

comment on view public.v_net_worth_current is
  'Patrimonio neto en vivo del usuario autenticado. Cobertura: accounts + credit_cards + '
  'manual_assets + manual_liabilities + investments (MOD-07) + family_loans como cuentas por '
  'cobrar (MOD-13). Préstamos con interés (MOD-14) y deudas propias (MOD-16) se suman cuando existan.';
