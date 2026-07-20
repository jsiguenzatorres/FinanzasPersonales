-- ===========================================================================
-- FlowFinance — MOD-05 Metas · trigger de saldo de goal_contributions
-- ===========================================================================
-- goals.current_amount y goal_contributions existen desde las migraciones
-- 20260630120900 y 20260630121300, pero nunca se creó el trigger que
-- mantiene current_amount al día — hasta ahora nada lo actualizaba.
-- Mismo patrón que update_budget_spent(): revierte el efecto de la fila
-- vieja en UPDATE/DELETE, aplica el de la fila nueva en INSERT/UPDATE.
-- ===========================================================================

create or replace function public.update_goal_current_amount()
returns trigger
language plpgsql
as $$
declare
  v_goal_id uuid;
begin
  v_goal_id := coalesce(new.goal_id, old.goal_id);

  update public.goals
     set current_amount = current_amount
       - coalesce(old.amount, 0) * (case when TG_OP in ('UPDATE', 'DELETE') then 1 else 0 end)
       + coalesce(new.amount, 0) * (case when TG_OP in ('UPDATE', 'INSERT') then 1 else 0 end)
   where id = v_goal_id;

  -- Auto-completar al llegar (o pasar) el monto objetivo. Reversible: si
  -- luego se retira un abono y current_amount vuelve a bajar del target,
  -- NO se revierte el status solo — completar una meta es un hito, no un
  -- estado que oscile con cada abono.
  update public.goals
     set status = 'completed',
         completed_at = now()
   where id = v_goal_id
     and status = 'active'
     and current_amount >= target_amount
     and target_amount > 0;

  return coalesce(new, old);
end;
$$;

create trigger trg_goal_contributions_balance
  after insert or update or delete on public.goal_contributions
  for each row execute function public.update_goal_current_amount();
