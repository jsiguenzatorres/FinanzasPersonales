-- ===========================================================================
-- FlowFinance — 01 · Extensiones y tipos custom (ENUMs)
-- ===========================================================================
-- Crea: extensiones Postgres requeridas + 24 ENUMs usados en todo el schema
-- Dependencias: ninguna
-- ===========================================================================

-- ─── EXTENSIONES ───────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";        -- gen_random_uuid()
create extension if not exists "pg_trgm";         -- trigram para fuzzy search (merchant_name)
create extension if not exists "pg_cron"          -- jobs programados
  with schema extensions;
-- nota: pg_cron requiere habilitarse desde dashboard Supabase (Database → Extensions)

-- ─── ENUMs ─────────────────────────────────────────────────────────────────

-- Plan de suscripción FlowFinance
create type plan_tier as enum ('free', 'starter', 'pro', 'elite');

-- Cuentas y movimientos
create type account_type as enum (
  'checking', 'savings', 'cash', 'credit_card',
  'investment', 'digital_wallet', 'fx', 'virtual'
);

create type account_status as enum ('active', 'closed', 'archived');

create type transaction_kind as enum (
  'expense', 'income', 'transfer_out', 'transfer_in',
  'cc_payment', 'cc_charge', 'fee',
  'interest_earned', 'interest_paid', 'refund', 'adjustment'
);

create type transaction_status as enum ('pending', 'cleared', 'reconciled', 'void');

create type capture_source as enum (
  'manual', 'csv_import', 'ocr_receipt', 'voice',
  'open_banking', 'recurring', 'finn'
);

create type money_class as enum ('need', 'want', 'savings_debt');

-- Ingresos
create type income_type as enum (
  'salary', 'freelance', 'rental', 'investment_yield',
  'loan_payment', 'business', 'eventual', 'other'
);

-- Presupuesto
create type budget_mode as enum ('zero_based', 'flexible', '50_30_20');
create type budget_status as enum ('on_track', 'warning', 'over');

-- Recurrencia
create type recurrence_freq as enum (
  'daily', 'weekly', 'biweekly', 'monthly',
  'bimonthly', 'quarterly', 'semiannual', 'annual'
);

-- Metas
create type goal_type as enum (
  'emergency_fund', 'savings', 'debt_payoff', 'purchase',
  'travel', 'education', 'retirement', 'other'
);
create type goal_status as enum ('active', 'paused', 'completed', 'abandoned');

-- Inversiones
create type investment_type as enum (
  'stock', 'etf', 'mutual_fund', 'bond', 'cete',
  'crypto', 'real_estate', 'business_equity', 'other'
);

-- Préstamos
create type loan_status as enum ('active', 'paid', 'defaulted', 'restructured', 'written_off');
create type family_payment_method as enum ('cash', 'transfer', 'in_kind', 'service', 'mixed');

-- Deudas
create type debt_strategy as enum ('snowball', 'avalanche', 'custom');

-- Patrimonio
create type asset_type as enum (
  'cash', 'investment', 'real_estate', 'vehicle',
  'collectible', 'crypto', 'other'
);
create type liability_type as enum (
  'credit_card', 'personal_loan', 'mortgage',
  'auto_loan', 'student_loan', 'other'
);

-- Viajes
create type trip_status as enum ('planning', 'active', 'completed', 'cancelled');
create type trip_expense_category as enum (
  'transport', 'lodging', 'food', 'activities',
  'shopping', 'fees', 'insurance', 'other'
);

-- Fiscal (genérico LATAM)
create type tax_record_type as enum (
  'income_declaration', 'deductible_expense',
  'isr_withheld', 'iva_paid', 'iva_collected'
);

-- FINN
create type finn_session_kind as enum (
  'onboarding', 'daily_brief', 'chat',
  'simulator', 'goal_planning', 'budget_review'
);

-- Simulador (24 escenarios)
create type simulation_scenario as enum (
  'job_loss', 'salary_increase', 'big_purchase', 'pay_off_debt',
  'invest_lump_sum', 'start_business', 'have_child', 'buy_house',
  'sell_asset', 'early_retirement', 'travel_planning', 'education_cost',
  'medical_emergency', 'inheritance', 'lottery_win', 'rate_change',
  'fx_change', 'inflation_spike', 'recession', 'gift_received',
  'gift_given', 'subscription_review', 'side_hustle', 'custom'
);

-- Gamificación
create type achievement_category as enum (
  'savings', 'budget', 'debt', 'income',
  'investment', 'consistency', 'milestone', 'social'
);

-- Colaborativas
create type collab_role as enum ('owner', 'admin', 'member', 'viewer');
create type collab_status as enum ('invited', 'active', 'removed', 'left');
create type collab_kind as enum ('couple', 'family', 'roommates', 'business', 'other');

-- Alertas y notificaciones
create type alert_kind as enum (
  'budget_threshold', 'cc_cutoff', 'cc_payment_due',
  'bill_due', 'loan_overdue', 'goal_off_track',
  'unusual_spending', 'low_balance', 'subscription_renewal',
  'large_transaction', 'income_received', 'achievement_unlocked'
);
create type alert_severity as enum ('info', 'warning', 'critical');
create type notification_channel as enum ('in_app', 'email', 'push', 'whatsapp', 'sms');
create type notification_status as enum (
  'pending', 'sent', 'delivered', 'read', 'failed'
);

-- Billing
create type billing_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused'
);

-- Auditoría (solo deletes/exports/login/consent_change)
create type audit_action as enum (
  'delete', 'restore', 'export', 'login', 'logout', 'consent_change'
);
