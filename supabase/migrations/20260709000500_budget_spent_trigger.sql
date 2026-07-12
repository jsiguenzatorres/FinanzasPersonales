-- ===========================================================================
-- FlowFinance — 29 · Trigger de gasto ejecutado en presupuesto (MOD-03)
-- ===========================================================================
-- Bug: update_budget_spent() estaba documentada en mod-03-presupuesto.md §5.1
-- pero nunca se escribió en ninguna migración — otro caso como
-- to_base_currency() (migración 28).
--
-- Detalle importante: las transacciones se categorizan a nivel de
-- SUBCATEGORÍA (ej. "Cafeterías"), pero el presupuesto asigna a nivel de
-- GRUPO PADRE (ej. "Alimentación", 8 grupos). El trigger debe resolver
-- cada transacción a su categoría padre antes de buscar la línea de
-- presupuesto correspondiente.
-- ===========================================================================

create or replace function public.resolve_budget_category_id(p_category_id uuid)
returns uuid
language sql
stable
as $$
  select coalesce(
    (select parent_id from public.categories where id = p_category_id and parent_id is not null),
    p_category_id
  );
$$;

comment on function public.resolve_budget_category_id(uuid) is
  'Resuelve una categoría (subcategoría o grupo padre) a su grupo padre para efectos de presupuesto. '
  'Si ya es un grupo padre (parent_id NULL), devuelve la misma id.';

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
  -- Revertir efecto de la fila anterior (UPDATE o DELETE)
  if TG_OP in ('UPDATE', 'DELETE') then
    if OLD.kind in ('expense', 'cc_charge', 'refund')
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

  -- Aplicar efecto de la fila nueva (INSERT o UPDATE)
  if TG_OP in ('INSERT', 'UPDATE') then
    if NEW.kind in ('expense', 'cc_charge', 'refund')
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

comment on function public.update_budget_spent() is
  'Trigger AFTER INSERT/UPDATE/DELETE en transactions: mantiene budget_categories.spent_amount '
  'sincronizado. Solo expense/cc_charge/refund cuentan; fee/interest_paid quedan fuera (costos '
  'operativos, no gasto discrecional) según decisión MOD-03 §5.1.';

create trigger trg_transactions_budget_spent
  after insert or update or delete on public.transactions
  for each row execute function public.update_budget_spent();
