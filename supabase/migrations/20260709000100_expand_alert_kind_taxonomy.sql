-- ===========================================================================
-- FlowFinance — 25 · Ampliación de taxonomía de alertas (alert_kind)
-- ===========================================================================
-- Amplía alert_kind de 12 a 27 valores, incorporando conceptos del análisis
-- de FLOWFINANCE-SPEC.md (documento histórico pre-pivote) que no chocan con
-- decisiones de stack ya tomadas — son puramente taxonomía de producto.
--
-- No se eliminan ni renombran valores existentes (ADD VALUE es solo aditivo,
-- Postgres no permite quitar valores de un enum sin recrear el tipo).
-- ===========================================================================

alter type alert_kind add value if not exists 'budget_projection';       -- proyección de agotamiento antes de fin de mes
alter type alert_kind add value if not exists 'budget_completed';        -- mes cerrado dentro del presupuesto (celebración)
alter type alert_kind add value if not exists 'savings_opportunity';     -- categoría con saldo libre redirigible
alter type alert_kind add value if not exists 'month_start';             -- propuesta de presupuesto del mes nuevo
alter type alert_kind add value if not exists 'spending_increase';       -- gasto total +20% vs mismo período mes anterior
alter type alert_kind add value if not exists 'streak_achievement';      -- racha de presupuesto/hábito (gamificación)
alter type alert_kind add value if not exists 'rollover_available';      -- dinero sobrante del mes anterior sin asignar
alter type alert_kind add value if not exists 'crisis_mode';             -- saldo crítico detectado, activa modo crisis
alter type alert_kind add value if not exists 'subscription_price_change'; -- precio de suscripción subió
alter type alert_kind add value if not exists 'subscription_unused';     -- suscripción sin uso en 30+ días
alter type alert_kind add value if not exists 'goal_completed';          -- meta alcanzada (celebración)
alter type alert_kind add value if not exists 'investment_maturing';     -- CETE/bono/inversión que vence esta semana
alter type alert_kind add value if not exists 'anomaly_detected';        -- transacción inusual, posible fraude
alter type alert_kind add value if not exists 'debt_minimum_risk';       -- pago mínimo únicamente, mostrar costo real
alter type alert_kind add value if not exists 'tax_deadline';            -- fecha límite fiscal próxima

comment on type alert_kind is
  'Taxonomía de 27 tipos de alerta. Ampliada 2026-07-09 desde 12 a 27 tipos '
  '(ver docs/modules/mod-08-finn.md §Taxonomía de alertas). '
  'Alertas de umbral (budget 70/90/100%) usan un solo valor budget_threshold '
  '+ campo severity, en vez de un valor por umbral, para mantener el enum manejable.';
