-- ===========================================================================
-- FlowFinance — 19 · FlowScore + Gamificación (MOD-09)
-- ===========================================================================
-- Crea: flow_scores, achievements (+ seed), user_achievements, streaks
-- Dependencias: users
-- ===========================================================================

-- ─── flow_scores (computado semanalmente vía pg_cron) ─────────────────────
create table public.flow_scores (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  score_week                  date not null,
  total_score                 integer not null check (total_score between 0 and 1000),
  level                       text not null,
  savings_rate_score          smallint not null default 0,
  debt_ratio_score            smallint not null default 0,
  emergency_fund_score        smallint not null default 0,
  budget_adherence_score      smallint not null default 0,
  diversification_score       smallint not null default 0,
  growth_score                smallint not null default 0,
  consistency_score           smallint not null default 0,
  goal_progress_score         smallint not null default 0,
  savings_rate                numeric(7,4),
  debt_to_income_ratio        numeric(7,4),
  emergency_fund_months       numeric(5,2),
  net_worth                   numeric(15,2),
  delta_vs_prev_week          integer,
  computed_at                 timestamptz not null default now(),
  unique (user_id, score_week)
);

create index idx_fs_user on public.flow_scores(user_id, score_week desc);

alter table public.flow_scores enable row level security;

create policy "fs_owner_read" on public.flow_scores
  for select using (auth.uid() = user_id);
-- inserts solo vía service_role

-- ─── achievements (catálogo) ──────────────────────────────────────────────
create table public.achievements (
  id                          uuid primary key default gen_random_uuid(),
  code                        text not null unique,
  name                        text not null,
  description                 text not null,
  icon                        text,
  category                    achievement_category not null,
  points                      integer not null default 10,
  tier                        smallint default 1 check (tier between 1 and 4),
  trigger_rule                jsonb not null,
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "achievements_read_all" on public.achievements
  for select using (auth.role() = 'authenticated');

-- Seed inicial de achievements
insert into public.achievements (code, name, description, icon, category, points, tier, trigger_rule) values
  ('first_account',      'Primera cuenta',       'Agregaste tu primera cuenta financiera.',         '🏦', 'milestone',   10, 1, '{"event":"account_created","count":1}'),
  ('first_budget',       'Primer presupuesto',   'Creaste tu primer presupuesto mensual.',          '📊', 'budget',      20, 1, '{"event":"budget_created","count":1}'),
  ('first_goal',         'Primera meta',         'Definiste tu primera meta financiera.',           '🎯', 'milestone',   15, 1, '{"event":"goal_created","count":1}'),
  ('savings_streak_7',   'Racha 7 días',         'Mantuviste presupuesto en verde 7 días.',         '🔥', 'consistency', 25, 1, '{"event":"days_in_green","count":7}'),
  ('savings_streak_30',  'Racha 30 días',        '30 días sin sobregirar.',                          '🔥', 'consistency', 75, 2, '{"event":"days_in_green","count":30}'),
  ('savings_streak_90',  'Racha 90 días',        '3 meses sin sobregirar.',                          '🔥', 'consistency',150, 3, '{"event":"days_in_green","count":90}'),
  ('savings_streak_365', 'Año completo',         '1 año entero sin sobregirar.',                     '🏆', 'consistency',500, 4, '{"event":"days_in_green","count":365}'),
  ('savings_10pct',      'Ahorrador del 10%',    'Tasa de ahorro ≥10% por 3 meses.',                 '💰', 'savings',     50, 1, '{"event":"savings_rate","value":0.10,"months":3}'),
  ('savings_20pct',      'Ahorrador del 20%',    'Tasa de ahorro ≥20% por 3 meses.',                 '💎', 'savings',    100, 2, '{"event":"savings_rate","value":0.20,"months":3}'),
  ('emergency_3m',       'Fondo de 3 meses',     'Acumulaste fondo de emergencia para 3 meses.',     '🛟', 'savings',    150, 2, '{"event":"emergency_months","value":3}'),
  ('emergency_6m',       'Fondo de 6 meses',     'Fondo de emergencia robusto: 6 meses.',           '🛡️', 'savings',    300, 3, '{"event":"emergency_months","value":6}'),
  ('debt_first_payoff',  'Primera deuda saldada','Liquidaste tu primera deuda.',                     '✂️', 'debt',       100, 2, '{"event":"debt_paid_off","count":1}'),
  ('debt_free',          'Libre de deudas',      'Saldaste todas tus deudas (excepto hipoteca).',    '🦅', 'debt',       500, 4, '{"event":"all_debts_paid"}'),
  ('first_investment',   'Inversionista novato', 'Hiciste tu primera inversión.',                    '📈', 'investment',  30, 1, '{"event":"investment_created","count":1}'),
  ('income_diversified', 'Ingresos diversos',    'Tienes 3+ fuentes de ingreso activas.',            '🌱', 'income',      80, 2, '{"event":"income_sources","count":3}'),
  ('finn_buddy',         'Amigo de FINN',        '30 conversaciones con FINN.',                      '🤖', 'social',      40, 1, '{"event":"finn_conversations","count":30}');

-- ─── user_achievements ─────────────────────────────────────────────────────
create table public.user_achievements (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  achievement_id              uuid not null references public.achievements(id) on delete cascade,
  earned_at                   timestamptz not null default now(),
  context_snapshot            jsonb,
  notified_at                 timestamptz,
  unique (user_id, achievement_id)
);

create index idx_ua_user on public.user_achievements(user_id, earned_at desc);

alter table public.user_achievements enable row level security;

create policy "ua_owner_read" on public.user_achievements
  for select using (auth.uid() = user_id);

-- ─── streaks ───────────────────────────────────────────────────────────────
create table public.streaks (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.users(id) on delete cascade,
  kind                        text not null,
  current_count               integer not null default 0,
  longest_count               integer not null default 0,
  last_increment_date         date,
  started_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (user_id, kind)
);

create trigger trg_streaks_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();

alter table public.streaks enable row level security;

create policy "streaks_owner_read" on public.streaks
  for select using (auth.uid() = user_id);
