-- ===========================================================================
-- FlowFinance — 06 · Finanzas colaborativas (MOD-11)
-- ===========================================================================
-- Crea: collab_spaces, collab_members + función is_collab_member
-- Dependencias: users
-- Nota: schema desde Fase 0 aunque la feature se activa en Fase 3
-- ===========================================================================

create table public.collab_spaces (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.users(id) on delete cascade,
  name                text not null,
  kind                collab_kind not null,
  default_currency    char(3) not null default 'USD' references public.currencies(code),
  default_split_rule  jsonb,
  description         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_cs_owner on public.collab_spaces(owner_id);

create trigger trg_cs_updated_at
  before update on public.collab_spaces
  for each row execute function public.set_updated_at();

alter table public.collab_spaces enable row level security;

create table public.collab_members (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references public.collab_spaces(id) on delete cascade,
  user_id             uuid references public.users(id) on delete cascade,
  invited_email       text,
  role                collab_role not null default 'member',
  status              collab_status not null default 'invited',
  split_percentage    numeric(5,2),
  joined_at           timestamptz,
  invited_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (space_id, user_id),
  unique (space_id, invited_email)
);

create index idx_cm_user on public.collab_members(user_id, status);
create index idx_cm_space on public.collab_members(space_id, status);

create trigger trg_cm_updated_at
  before update on public.collab_members
  for each row execute function public.set_updated_at();

alter table public.collab_members enable row level security;

-- ─── is_collab_member: usada en RLS de tablas colaborativas ───────────────
create or replace function public.is_collab_member(p_space_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.collab_members
     where space_id = p_space_id
       and user_id  = auth.uid()
       and status   = 'active'
  );
$$;

comment on function public.is_collab_member(uuid) is
  'TRUE si el usuario autenticado es miembro activo del espacio colaborativo.';

-- ─── Policies (después de definir is_collab_member) ────────────────────────
create policy "cs_member_select" on public.collab_spaces
  for select using (auth.uid() = owner_id or public.is_collab_member(id));

create policy "cs_owner_modify" on public.collab_spaces
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "cm_select_visible" on public.collab_members
  for select using (public.is_collab_member(space_id) or user_id = auth.uid());

create policy "cm_owner_modify" on public.collab_members
  for all using (
    exists (
      select 1 from public.collab_spaces cs
       where cs.id = space_id and cs.owner_id = auth.uid()
    )
  );
