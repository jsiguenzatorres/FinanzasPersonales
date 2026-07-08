-- ===========================================================================
-- FlowFinance — 04 · Usuarios, settings y dispositivos
-- ===========================================================================
-- Crea: users, user_settings, devices + trigger handle_new_user
-- Dependencias: auth.users (Supabase), currencies
-- ===========================================================================

-- ─── users (perfil extendido sobre auth.users) ────────────────────────────
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null unique,
  display_name        text not null,
  avatar_url          text,
  phone               text,
  country             char(2) not null default 'SV',
  language            text not null default 'es-SV',
  currency_default    char(3) not null default 'USD' references public.currencies(code),
  timezone            text not null default 'America/El_Salvador',
  plan                plan_tier not null default 'free',
  flow_score          integer not null default 0,
  onboarding_done     boolean not null default false,
  crisis_mode         boolean not null default false,
  privacy_mode        boolean not null default false,
  tax_id              text,
  tax_regime          text,
  birth_date          date,
  occupation          text,
  monthly_income_est  numeric(15,2),
  marketing_consent   boolean not null default false,
  data_export_at      timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_users_plan on public.users(plan) where deleted_at is null;
create index idx_users_country on public.users(country);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "users_select_self" on public.users
  for select using (auth.uid() = id);

create policy "users_update_self" on public.users
  for update using (auth.uid() = id);

-- Inserts via trigger handle_new_user(); deletes via cascade auth.users

-- ─── user_settings ─────────────────────────────────────────────────────────
create table public.user_settings (
  user_id                 uuid primary key references public.users(id) on delete cascade,
  dashboard_widgets       jsonb not null default '[]'::jsonb,
  budget_mode_default     budget_mode not null default 'flexible',
  notif_channels          jsonb not null default '{"in_app":true,"email":true,"push":false,"whatsapp":false}'::jsonb,
  notif_quiet_hours       jsonb,
  finn_personality        text not null default 'friendly',
  finn_proactive          boolean not null default true,
  finn_daily_brief_at     time not null default '07:00',
  default_account_id      uuid,
  default_category_id     uuid,
  receipt_auto_attach     boolean not null default true,
  hide_zero_balances      boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_owner" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── devices ───────────────────────────────────────────────────────────────
create table public.devices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  device_token        text not null,
  platform            text not null,
  app_version         text,
  os_version          text,
  name                text,
  push_enabled        boolean not null default true,
  biometric_enabled   boolean not null default false,
  last_seen_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, device_token)
);

create index idx_devices_user on public.devices(user_id);

create trigger trg_devices_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

alter table public.devices enable row level security;

create policy "devices_owner" on public.devices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── handle_new_user: crea fila en public.users al registrarse ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, currency_default, country, language, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'USD',
    'SV',
    'es-SV',
    'America/El_Salvador'
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
