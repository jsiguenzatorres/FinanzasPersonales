-- ===========================================================================
-- FlowFinance — 05 · Categorías + user_hidden_categories
-- ===========================================================================
-- Crea: categories (sistema + custom) + user_hidden_categories + vista
-- Seed: 8 grupos × 5 subcategorías para El Salvador
-- Dependencias: users
-- ===========================================================================

create table public.categories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users(id) on delete cascade,
  parent_id           uuid references public.categories(id) on delete cascade,
  name                text not null,
  icon                text,
  color               text,
  money_class         money_class not null default 'want',
  is_tax_deductible   boolean not null default false,
  is_system           boolean not null default false,
  sort_order          integer not null default 0,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_cat_system_no_user check (
    (is_system = true and user_id is null)
    or (is_system = false and user_id is not null)
  )
);

create index idx_categories_user
  on public.categories(user_id, parent_id) where archived_at is null;
create index idx_categories_system
  on public.categories(is_system) where is_system = true;

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories_select_visible" on public.categories
  for select using (user_id = auth.uid() or is_system = true);

create policy "categories_modify_own" on public.categories
  for all
  using (user_id = auth.uid() and is_system = false)
  with check (user_id = auth.uid() and is_system = false);

-- ─── user_hidden_categories: usuario "elimina" categoría sistema ──────────
create table public.user_hidden_categories (
  user_id         uuid not null references public.users(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete cascade,
  hidden_at       timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index idx_uhc_user on public.user_hidden_categories(user_id);

alter table public.user_hidden_categories enable row level security;

create policy "uhc_owner" on public.user_hidden_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── v_user_categories: vista filtrada (visibles - ocultas) ───────────────
create or replace view public.v_user_categories
with (security_invoker = true)  -- respeta RLS del que consulta
as
select c.*
  from public.categories c
 where (c.user_id = auth.uid() or c.is_system = true)
   and c.archived_at is null
   and not exists (
     select 1 from public.user_hidden_categories h
      where h.user_id = auth.uid() and h.category_id = c.id
   );

comment on view public.v_user_categories is
  'Categorías visibles al usuario (sistema + propias - ocultas - archivadas).';

-- ─── SEED categorías sistema para El Salvador ─────────────────────────────
-- 8 grupos padres + ~40 subcategorías

-- 1. Vivienda (need)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Vivienda', '🏠', '#00E5A0', 'need', true, 1)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, 'need', true, x.so
  from grp, (values
    ('Alquiler / Hipoteca',   1),
    ('Servicios (agua, luz)', 2),
    ('Internet / Telefonía',  3),
    ('Mantenimiento',         4),
    ('Seguro de hogar',       5)
  ) as x(name, so);

-- 2. Alimentación (need + último want)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Alimentación', '🛒', '#FFD166', 'need', true, 2)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, x.mc::money_class, true, x.so
  from grp, (values
    ('Supermercado / Despensa',     'need', 1),
    ('Restaurantes',                'want', 2),
    ('Delivery (PedidosYa, Hugo)',  'want', 3),
    ('Cafeterías',                  'want', 4),
    ('Bebidas alcohólicas',         'want', 5)
  ) as x(name, mc, so);

-- 3. Transporte (need)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Transporte', '🚗', '#5B6EFF', 'need', true, 3)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, 'need', true, x.so
  from grp, (values
    ('Combustible',              1),
    ('Buses / Microbuses',       2),
    ('Uber / InDriver',          3),
    ('Mantenimiento vehículo',   4),
    ('Seguro vehicular',         5)
  ) as x(name, so);

-- 4. Salud (need + último want)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_tax_deductible, is_system, sort_order)
  values ('Salud', '❤️', '#FF6B6B', 'need', true, true, 4)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_tax_deductible, is_system, sort_order)
select id, x.name, x.mc::money_class, x.ded, true, x.so
  from grp, (values
    ('Médico / Consultas',        'need', true,  1),
    ('Farmacia / Medicinas',      'need', true,  2),
    ('Seguro médico / ISSS',      'need', true,  3),
    ('Dentista / Oftalmólogo',    'need', true,  4),
    ('Gimnasio / Deporte',        'want', false, 5)
  ) as x(name, mc, ded, so);

-- 5. Educación (need, deducible)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_tax_deductible, is_system, sort_order)
  values ('Educación', '📚', '#C084FC', 'need', true, true, 5)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_tax_deductible, is_system, sort_order)
select id, x.name, 'need', true, true, x.so
  from grp, (values
    ('Colegiatura / Universidad', 1),
    ('Cursos / Capacitación',     2),
    ('Útiles escolares',          3),
    ('Libros / Suscripciones',    4),
    ('Uniformes / Actividades',   5)
  ) as x(name, so);

-- 6. Entretenimiento (want)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Entretenimiento', '🎉', '#FF9F43', 'want', true, 6)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, 'want', true, x.so
  from grp, (values
    ('Streaming (Netflix, Spotify…)', 1),
    ('Cine / Conciertos',             2),
    ('Videojuegos / Hobbies',         3),
    ('Salidas / Bares',               4),
    ('Vacaciones / Viajes',           5)
  ) as x(name, so);

-- 7. Ropa & Personal (want)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Ropa & Personal', '👕', '#00E5A0', 'want', true, 7)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, 'want', true, x.so
  from grp, (values
    ('Ropa / Calzado',                1),
    ('Accesorios / Bolsas',           2),
    ('Peluquería / Estética',         3),
    ('Cosméticos / Cuidado personal', 4),
    ('Lavandería',                    5)
  ) as x(name, so);

-- 8. Finanzas (savings_debt)
with grp as (
  insert into public.categories (name, icon, color, money_class, is_system, sort_order)
  values ('Finanzas', '💰', '#5B6EFF', 'savings_debt', true, 8)
  returning id
)
insert into public.categories (parent_id, name, money_class, is_system, sort_order)
select id, x.name, 'savings_debt', true, x.so
  from grp, (values
    ('Ahorro programado',          1),
    ('Pago de deudas',             2),
    ('Tarjetas de crédito',        3),
    ('Inversiones recurrentes',    4),
    ('Préstamos familiares',       5)
  ) as x(name, so);
