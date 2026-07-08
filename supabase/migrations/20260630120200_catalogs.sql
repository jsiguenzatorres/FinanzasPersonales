-- ===========================================================================
-- FlowFinance — 03 · Catálogos globales (currencies, fx_rates)
-- ===========================================================================
-- Crea: currencies (+ seed) y fx_rates + funciones get_fx_rate
-- Dependencias: extensiones
-- ===========================================================================

-- ─── currencies ────────────────────────────────────────────────────────────
create table public.currencies (
  code        char(3) primary key,
  name        text not null,
  symbol      text not null,
  decimals    smallint not null default 2,
  is_active   boolean not null default true
);

comment on table public.currencies is 'Catálogo ISO 4217 de monedas soportadas.';

alter table public.currencies enable row level security;

create policy "currencies_read_all" on public.currencies
  for select using (auth.role() = 'authenticated');

-- Seed inicial (USD primero, base SV)
insert into public.currencies (code, name, symbol, decimals) values
  ('USD', 'Dólar estadounidense', '$',   2),
  ('MXN', 'Peso mexicano',         '$',   2),
  ('EUR', 'Euro',                  '€',   2),
  ('GBP', 'Libra esterlina',       '£',   2),
  ('GTQ', 'Quetzal guatemalteco',  'Q',   2),
  ('HNL', 'Lempira hondureña',     'L',   2),
  ('NIO', 'Córdoba nicaragüense',  'C$',  2),
  ('CRC', 'Colón costarricense',   '₡',   2),
  ('PAB', 'Balboa panameño',       'B/.', 2),
  ('COP', 'Peso colombiano',       '$',   2),
  ('ARS', 'Peso argentino',        '$',   2),
  ('BRL', 'Real brasileño',        'R$',  2),
  ('CLP', 'Peso chileno',          '$',   0),
  ('PEN', 'Sol peruano',           'S/',  2),
  ('JPY', 'Yen japonés',           '¥',   0),
  ('CAD', 'Dólar canadiense',      '$',   2),
  ('BTC', 'Bitcoin',               '₿',   8),
  ('ETH', 'Ethereum',              'Ξ',   8);

-- ─── fx_rates ──────────────────────────────────────────────────────────────
create table public.fx_rates (
  id              uuid primary key default gen_random_uuid(),
  from_currency   char(3) not null references public.currencies(code),
  to_currency     char(3) not null references public.currencies(code),
  rate            numeric(15,6) not null,
  rate_date       date not null,
  source          text not null default 'exchangerate-api',
  created_at      timestamptz not null default now(),
  unique (from_currency, to_currency, rate_date)
);

create index idx_fx_rates_lookup
  on public.fx_rates(from_currency, to_currency, rate_date desc);

comment on table public.fx_rates is
  'Snapshot diario de tipos de cambio. Llenada por Edge Function programada.';

alter table public.fx_rates enable row level security;

create policy "fx_rates_read_all" on public.fx_rates
  for select using (auth.role() = 'authenticated');

-- ─── get_fx_rate: busca la tasa más reciente <= fecha dada ────────────────
create or replace function public.get_fx_rate(
  p_from char(3), p_to char(3), p_date date
)
returns numeric(15,6)
language sql
stable
as $$
  select rate
    from public.fx_rates
   where from_currency = p_from
     and to_currency   = p_to
     and rate_date    <= p_date
   order by rate_date desc
   limit 1;
$$;

comment on function public.get_fx_rate(char(3), char(3), date) is
  'Devuelve la tasa from→to vigente a la fecha dada. NULL si no hay registro.';
