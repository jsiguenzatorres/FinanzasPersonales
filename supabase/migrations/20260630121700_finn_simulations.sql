-- ===========================================================================
-- FlowFinance — 18 · FINN (MOD-08) + Simulador
-- ===========================================================================
-- Crea: finn_conversations, finn_messages, finn_insights, simulations
-- Dependencias: users
-- ===========================================================================

-- ─── finn_conversations ────────────────────────────────────────────────────
create table public.finn_conversations (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  session_kind                finn_session_kind not null,
  title                       text,
  context_snapshot            jsonb,
  total_tokens_in             integer default 0,
  total_tokens_out            integer default 0,
  total_cost_usd              numeric(10,6) default 0,
  model_used                  text default 'gemini-2.5-flash',
  ended_at                    timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_fc_user on public.finn_conversations(user_id, created_at desc);

create trigger trg_fc_updated_at
  before update on public.finn_conversations
  for each row execute function public.set_updated_at();

alter table public.finn_conversations enable row level security;

create policy "fc_owner" on public.finn_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── finn_messages ─────────────────────────────────────────────────────────
create table public.finn_messages (
  id                          uuid primary key default gen_random_uuid(),
  conversation_id             uuid not null references public.finn_conversations(id) on delete cascade,
  user_id                     uuid not null references public.users(id) on delete cascade,
  role                        text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content                     text,
  parts                       jsonb,
  tool_name                   text,
  tool_input                  jsonb,
  tool_output                 jsonb,
  tokens_in                   integer,
  tokens_out                  integer,
  latency_ms                  integer,
  model                       text,
  created_at                  timestamptz not null default now()
);

create index idx_fm_conv on public.finn_messages(conversation_id, created_at);
create index idx_fm_user on public.finn_messages(user_id);

alter table public.finn_messages enable row level security;

create policy "fm_owner" on public.finn_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── finn_insights (proactivos) ───────────────────────────────────────────
create table public.finn_insights (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  kind                        text not null,
  title                       text not null,
  body                        text not null,
  action_label                text,
  action_payload              jsonb,
  related_entity_type         text,
  related_entity_id           uuid,
  priority                    smallint default 5,
  shown_at                    timestamptz,
  acted_at                    timestamptz,
  dismissed_at                timestamptz,
  expires_at                  timestamptz,
  model_used                  text,
  created_at                  timestamptz not null default now()
);

create index idx_fi_user
  on public.finn_insights(user_id, created_at desc) where dismissed_at is null;
create index idx_fi_active
  on public.finn_insights(user_id, kind, expires_at) where dismissed_at is null;

alter table public.finn_insights enable row level security;

create policy "fi_owner" on public.finn_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── simulations (24 escenarios) ──────────────────────────────────────────
create table public.simulations (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  scenario_type               simulation_scenario not null,
  title                       text not null,
  input_variables             jsonb not null,
  computed_impacts            jsonb not null,
  horizon_months              smallint not null default 12,
  finn_insight                text,
  finn_recommendation         text,
  decision_taken              text check (decision_taken in ('pursued', 'discarded', 'pending')),
  decision_notes              text,
  decision_at                 timestamptz,
  baseline_snapshot           jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index idx_sim_user on public.simulations(user_id, created_at desc);
create index idx_sim_type on public.simulations(user_id, scenario_type);

create trigger trg_sim_updated_at
  before update on public.simulations
  for each row execute function public.set_updated_at();

alter table public.simulations enable row level security;

create policy "sim_owner" on public.simulations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
