-- ===========================================================================
-- FlowFinance — Protege columnas privilegiadas de public.users
-- ===========================================================================
-- La policy "users_update_self" (auth.uid() = id) no tiene WITH CHECK ni
-- restricción por columna: cualquier usuario autenticado podía hacer un PATCH
-- a su propia fila vía la REST API de Supabase y poner is_superadmin=true o
-- plan='pro' directamente, sin pasar por ningún flujo de aprobación/pago.
-- Se descubrió al construir el panel de administración, que usa
-- is_superadmin para autorizar el acceso — sin este fix, cualquier usuario
-- podría autopromoverse a admin.
--
-- Un trigger BEFORE UPDATE revierte cambios a estas columnas salvo que la
-- sesión sea service_role (el admin client en apps/web/src/lib/supabase/admin.ts).
-- ===========================================================================

create or replace function public.protect_privileged_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_superadmin is distinct from old.is_superadmin then
      new.is_superadmin := old.is_superadmin;
    end if;
    if new.plan is distinct from old.plan then
      new.plan := old.plan;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_users_protect_privileged_columns
  before update on public.users
  for each row execute function public.protect_privileged_user_columns();
