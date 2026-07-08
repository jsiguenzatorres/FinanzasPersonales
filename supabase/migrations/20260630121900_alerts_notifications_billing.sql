-- ===========================================================================
-- FlowFinance — 20 · Alertas, notificaciones y billing (Stripe)
-- ===========================================================================
-- Crea: alert_rules, notifications, billing_customers, billing_subscriptions,
--       billing_events
-- Dependencias: users
-- ===========================================================================

-- ─── alert_rules ───────────────────────────────────────────────────────────
create table public.alert_rules (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  kind                        alert_kind not null,
  is_active                   boolean not null default true,
  config                      jsonb not null,
  channels                    jsonb not null default '["in_app"]'::jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_ar_user on public.alert_rules(user_id, kind) where is_active = true;

create trigger trg_ar_updated_at
  before update on public.alert_rules
  for each row execute function public.set_updated_at();

alter table public.alert_rules enable row level security;

create policy "ar_owner" on public.alert_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── notifications ─────────────────────────────────────────────────────────
create table public.notifications (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  kind                        alert_kind,
  severity                    alert_severity not null default 'info',
  title                       text not null,
  body                        text not null,
  action_label                text,
  action_url                  text,
  channel                     notification_channel not null,
  status                      notification_status not null default 'pending',
  scheduled_for               timestamptz not null default now(),
  sent_at                     timestamptz,
  delivered_at                timestamptz,
  read_at                     timestamptz,
  failed_reason               text,
  related_entity_type         text,
  related_entity_id           uuid,
  metadata                    jsonb,
  created_at                  timestamptz not null default now()
);

create index idx_notif_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null and channel = 'in_app';
create index idx_notif_pending
  on public.notifications(scheduled_for) where status = 'pending';

alter table public.notifications enable row level security;

create policy "notif_owner_read" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notif_owner_update" on public.notifications
  for update using (auth.uid() = user_id);
-- inserts solo vía service_role

-- ─── billing_customers ─────────────────────────────────────────────────────
create table public.billing_customers (
  user_id                     uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id          text not null unique,
  default_payment_method      text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger trg_bc_billing_updated_at
  before update on public.billing_customers
  for each row execute function public.set_updated_at();

alter table public.billing_customers enable row level security;

create policy "bc_billing_owner_read" on public.billing_customers
  for select using (auth.uid() = user_id);

-- ─── billing_subscriptions ─────────────────────────────────────────────────
create table public.billing_subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id      text not null unique,
  stripe_price_id             text not null,
  plan                        plan_tier not null,
  status                      billing_status not null,
  current_period_start        timestamptz,
  current_period_end          timestamptz,
  trial_end                   timestamptz,
  cancel_at                   timestamptz,
  canceled_at                 timestamptz,
  amount                      numeric(15,2),
  currency                    char(3) default 'USD' references public.currencies(code),
  interval                    text default 'month',
  metadata                    jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_bs_user on public.billing_subscriptions(user_id, status);

create trigger trg_bs_billing_updated_at
  before update on public.billing_subscriptions
  for each row execute function public.set_updated_at();

alter table public.billing_subscriptions enable row level security;

create policy "bs_billing_owner_read" on public.billing_subscriptions
  for select using (auth.uid() = user_id);

-- ─── billing_events (webhook log para idempotencia) ──────────────────────
create table public.billing_events (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.users(id) on delete set null,
  stripe_event_id             text not null unique,
  event_type                  text not null,
  payload                     jsonb not null,
  processed                   boolean not null default false,
  processed_at                timestamptz,
  error                       text,
  created_at                  timestamptz not null default now()
);

create index idx_be_type on public.billing_events(event_type, processed);

alter table public.billing_events enable row level security;
-- sin policies: solo service_role accede
