# FlowFinance — Supabase

Schema PostgreSQL completo + RLS + funciones + triggers para FlowFinance.

## Estructura

```
supabase/
├── migrations/        # 23 archivos SQL versionados, aplicar en orden
├── functions/         # Edge Functions (Deno) — se llenan en Fase 0.7
├── policies/          # Notas adicionales de RLS (opcional)
└── README.md
```

## Migraciones (orden de ejecución)

| # | Archivo | Crea |
|---|---|---|
| 01 | `20260630120000_extensions_and_enums.sql` | Extensiones + 24 ENUMs |
| 02 | `20260630120100_helper_functions_base.sql` | `set_updated_at()` |
| 03 | `20260630120200_catalogs.sql` | `currencies` (+ seed 18 monedas), `fx_rates`, `get_fx_rate()` |
| 04 | `20260630120300_users.sql` | `users`, `user_settings`, `devices` + `handle_new_user()` |
| 05 | `20260630120400_categories.sql` | `categories` + `user_hidden_categories` + vista + **seed SV** (8 grupos × 5 subcategorías) |
| 06 | `20260630120500_collab.sql` | `collab_spaces`, `collab_members` + `is_collab_member()` |
| 07 | `20260630120600_accounts.sql` | `accounts` |
| 08 | `20260630120700_credit_cards.sql` | `credit_cards`, `cc_statements` |
| 09 | `20260630120800_recurrings.sql` | `recurrings` |
| 10 | `20260630120900_tax_trips_goals_skeleton.sql` | `tax_records`, `trips`, `goals` (FKs circulares diferidos) |
| 11 | `20260630121000_transactions.sql` | `transactions` (la tabla más grande) |
| 12 | `20260630121100_income_entries.sql` | `income_entries` + cierra FKs circulares en `tax_records` |
| 13 | `20260630121200_budgets.sql` | `budgets`, `budget_categories` |
| 14 | `20260630121300_goal_contributions_subscriptions.sql` | `goal_contributions`, `subscriptions` |
| 15 | `20260630121400_investments_networth.sql` | `investments`, `investment_transactions`, `manual_assets`, `manual_liabilities`, `net_worth_snapshots` |
| 16 | `20260630121500_loans.sql` | `family_loans`, `family_loan_payments`, `loan_portfolio`, `loan_payments` |
| 17 | `20260630121600_debts_trips_expenses.sql` | `debts`, `debt_payments`, `trip_expenses` |
| 18 | `20260630121700_finn_simulations.sql` | `finn_conversations`, `finn_messages`, `finn_insights`, `simulations` |
| 19 | `20260630121800_gamification.sql` | `flow_scores`, `achievements` (+ seed 16 logros), `user_achievements`, `streaks` |
| 20 | `20260630121900_alerts_notifications_billing.sql` | `alert_rules`, `notifications`, `billing_customers`, `billing_subscriptions`, `billing_events` |
| 21 | `20260630122000_audit_log.sql` | `audit_log` + triggers AFTER DELETE en 5 tablas críticas |
| 22 | `20260630122100_amount_base_triggers.sql` | `fill_amount_base()` + triggers multi-moneda |
| 23 | `20260630122200_pg_cron_jobs.sql` | Jobs programados (comentados; activar tras desplegar Edge Functions) |

**Total:** 39 tablas, 24 ENUMs, ~85 índices, ~80 RLS policies.

## Aplicar las migraciones

### Opción 1 — Supabase CLI (recomendado)
```bash
# Instalar CLI
npm install -g supabase

# Linkear al proyecto
supabase link --project-ref <YOUR_PROJECT_REF>

# Aplicar migraciones
supabase db push
```

### Opción 2 — SQL Editor de Supabase
Ejecutar archivos en orden numérico desde el SQL Editor del dashboard.

### Opción 3 — Local con Docker
```bash
supabase start
supabase db reset    # aplica todas las migraciones
```

## Después de aplicar

1. Habilitar extensión **pg_cron** desde Dashboard → Database → Extensions.
2. Habilitar extensión **pg_net** (necesaria para que pg_cron llame Edge Functions).
3. Desplegar Edge Functions referenciadas en migración 23 (Fase 0.7).
4. Configurar `app.settings.service_role_key` en variables de DB o reemplazar en jobs.
5. Descomentar el bloque de jobs en migración 23 y reemplazar `<PROJECT_REF>`.

## Convenciones del schema

- País por defecto: **SV (El Salvador)** · Moneda base: **USD** · Idioma: **es-SV**
- Dinero: `numeric(15,2)` · Cripto: `numeric(20,8)`
- Soft delete solo en: `transactions`, `income_entries`, `goals`, `family_loans`, `loan_portfolio`
- `updated_at` automático en todas las tablas con esa columna (trigger `set_updated_at`)
- `amount_base` automático en moneda base del usuario (trigger `fill_amount_base`)
- `audit_log` registra **solo** deletes/exports/login/consent_change (no UPDATEs ni INSERTs)
- Vista `v_user_categories` filtra categorías visibles al usuario (sistema + propias − ocultas)

## Documentación de referencia

- Schema completo: `../docs/schema/SCHEMA-COMPLETO.md`
- Plan de trabajo: `../PLAN-DE-TRABAJO.md`
- Documento maestro de producto: `../flowfinance-maestro-completo-1.html`
