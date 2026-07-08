-- ===========================================================================
-- FlowFinance — 23 · Jobs programados con pg_cron
-- ===========================================================================
-- Crea: jobs para snapshots semanales, daily brief, recurrings, fx, purgas
-- Dependencias: pg_cron habilitado, Edge Functions desplegadas
-- ===========================================================================
-- IMPORTANTE: pg_cron debe habilitarse desde el dashboard Supabase
-- (Database → Extensions → pg_cron). Los jobs llaman Edge Functions vía HTTP.
-- ===========================================================================

-- Esta migración está COMENTADA por defecto.
-- Descomentar y ajustar la URL del proyecto Supabase cuando las
-- Edge Functions estén desplegadas en Fase 0.7.

/*
-- Diario 6:00 AM UTC — actualizar fx_rates
select cron.schedule(
  'flowfinance-fx-rates-daily',
  '0 6 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-fx-rates',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Diario 6:50 AM (hora local SV = 12:50 UTC) — daily brief FINN
select cron.schedule(
  'flowfinance-finn-daily-brief',
  '50 12 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/finn-daily-brief',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Diario 7:00 AM UTC — procesar recurrings con next_run_date = today
select cron.schedule(
  'flowfinance-process-recurrings',
  '0 7 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/process-recurrings',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Diario 8:00 AM UTC — detectar alertas según alert_rules
select cron.schedule(
  'flowfinance-detect-alerts',
  '0 8 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/detect-alerts',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Lunes 9:00 AM UTC — net_worth_snapshots semanales
select cron.schedule(
  'flowfinance-networth-weekly',
  '0 9 * * 1',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/snapshot-net-worth',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Lunes 10:00 AM UTC — flow_scores semanales
select cron.schedule(
  'flowfinance-flowscore-weekly',
  '0 10 * * 1',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/compute-flow-scores',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  $$
);

-- Diario 4:00 AM UTC — purgar soft-deletes con >30 días
select cron.schedule(
  'flowfinance-purge-soft-deletes',
  '0 4 * * *',
  $$
    delete from public.transactions
     where deleted_at is not null and deleted_at < now() - interval '30 days';
    delete from public.income_entries
     where deleted_at is not null and deleted_at < now() - interval '30 days';
    delete from public.goals
     where deleted_at is not null and deleted_at < now() - interval '30 days';
    delete from public.family_loans
     where deleted_at is not null and deleted_at < now() - interval '30 days';
    delete from public.loan_portfolio
     where deleted_at is not null and deleted_at < now() - interval '30 days';
  $$
);
*/

-- Para inspeccionar jobs:        select * from cron.job;
-- Para deshabilitar uno:         select cron.unschedule('<job-name>');
-- Para historial:                select * from cron.job_run_details order by start_time desc limit 50;
