-- ===========================================================================
-- FlowFinance — 02 · Funciones helper base
-- ===========================================================================
-- Crea: funciones reutilizables que NO dependen de tablas de dominio
-- Dependencias: ninguna (auth.users existe por defecto en Supabase)
-- ===========================================================================

-- ─── set_updated_at: actualiza updated_at en cada UPDATE ───────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: refresca columna updated_at automáticamente.';
