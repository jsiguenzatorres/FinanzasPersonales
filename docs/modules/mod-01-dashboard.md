# MOD-01 — Dashboard Principal

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.2, semanas 8-11)
> **Tablas core:** consume todas — `users`, `accounts`, `credit_cards`, `transactions`, `budgets`, `goals`, `net_worth_snapshots`, `flow_scores`, `finn_insights`, `alerts`, `notifications`
> **Status:** Primera pantalla que el usuario ve cada día. Define la percepción diaria del producto.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Layout móvil: FINN Brief sticky-below-header**. Visible al scroll inicial; se libera contenido debajo cuando el usuario ya lo leyó.
2. ✅ **Regeneración manual del Daily Brief: 3/día en Free, ilimitado en Pro+**. Cada regeneración es llamada Gemini con costo real.
3. ✅ **Widget FlowScore en MVP con score básico + badge "Beta"** para setear expectativa. Gamificación completa en Fase 3.
4. ✅ **Sparkline Net Worth: 6 meses** (responsivo al comportamiento reciente). 12 meses en módulo dedicado.
5. ✅ **PWA offline: mostrar datos stale con badge "Sin conexión — datos de hace X horas"**. UX degradada pero funcional.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Presenta una vista **360°** del estado financiero del usuario en tiempo real: 8 widgets personalizables, KPIs, semáforo de salud financiera y el brief diario de FINN. Optimizado para: leer en 30 segundos y decidir qué acción tomar hoy.

### 1.2 Qué NO hace
- No captura datos (redirige a MOD-00, 04, 15).
- No genera reportes profundos (eso es MOD-10, Fase 3).
- No permite edición de widgets más allá de orden/visibilidad.
- No es una pantalla de configuración.

### 1.3 Alcance MVP vs Fase 2/3

| Feature | MVP | Fase 2 | Fase 3 |
|---|---|---|---|
| 8 widgets predefinidos | ✅ | — | — |
| Drag & drop reorder | ✅ | — | — |
| Ocultar/mostrar widgets | ✅ | — | — |
| Realtime updates (Supabase Realtime) | ✅ | — | — |
| FINN Daily Brief automático | ✅ | Personalización tono | — |
| Top 5 alertas del día | ✅ | ML priority | — |
| KPIs live | ✅ | — | — |
| Widgets personalizados por usuario | ❌ | ✅ | — |
| Modo compacto móvil (bottom nav) | ✅ | — | — |
| Deep links a módulos (tap widget → detalle) | ✅ | — | — |
| Dashboard alternativo por perfil (Free/Pro/Elite) | ❌ | ✅ | — |
| Widget marketplace (comunidad) | ❌ | ❌ | ✅ |

---

## 2. Los 8 widgets predefinidos

Los 8 widgets del doc maestro, todos activos por default:

### 2.1 💎 Patrimonio Neto Live
- **Fuente:** vista `v_net_worth_current` (MOD-17).
- **Muestra:** número grande, delta semanal absoluto y %, mini-sparkline 6 meses.
- **Deep link:** `/app/patrimonio`.
- **Refresh:** cada 60 seg o al detectar cambio en transaction.

### 2.2 💸 Flujo del Mes
- **Fuente:** cálculo agregado sobre `transactions` del mes actual.
- **Muestra:**
  - Barra de progreso: ingresos confirmados vs. gastos ejecutados
  - Proyección de cierre del mes (extrapolación lineal: `gasto_actual / dias_transcurridos * dias_totales`)
  - Semáforo verde/amarillo/rojo según ratio ingreso/gasto proyectado
- **Deep link:** `/app/gastos`.

### 2.3 🔔 Top 5 Alertas del Día
- **Fuente:** `finn_insights` y `notifications` con prioridad alta + no dismissed + no expired.
- **Muestra:** 5 items ordenados por `priority DESC, created_at DESC`.
- **Cada item:** ícono, título, `action_label`, botón acción (pagar / registrar / revisar / ignorar).
- **Interacción:** tap ejecuta `action_payload.type = 'navigate'` o marca como dismissed.

### 2.4 🎯 Metas Top 3
- **Fuente:** `goals` WHERE `status = 'active'` ORDER BY `priority DESC, target_date ASC` LIMIT 3.
- **Muestra por cada meta:** nombre, barra progreso, % completado, fecha estimada, badge "¿alcanza a tiempo?" calculado con ritmo actual.
- **Deep link:** `/app/metas` (Fase 2 real).
- **MVP:** placeholder si MOD-05 no está activo aún, solo muestra "Configura tus metas".

### 2.5 📊 Semáforo Presupuesto
- **Fuente:** `budget_categories` del budget activo.
- **Muestra:** mini-grid 3x3 con categorías coloreadas por `status`. Contador global "3 verdes · 2 amarillas · 1 roja".
- **Deep link:** `/app/presupuesto`.

### 2.6 💵 Liquidez Libre Hoy
- **Fórmula:**
  ```
  liquidez_libre = SUM(accounts.balance WHERE type IN ('checking','savings','cash','digital_wallet'))
                 - SUM(compromisos_fijos_pendientes_del_mes)
                 - SUM(aportes_meta_programados_pendientes)
  ```
  Donde:
  - `compromisos_fijos_pendientes` = `recurrings WHERE kind IN ('expense','cc_charge') AND next_run_date BETWEEN today AND end_of_month`
  - `aportes_meta_programados_pendientes` = `goals WHERE monthly_contribution > 0 AND status = 'active'` (menos ya contribuidos este mes)
- **Muestra:** número grande, badge "USD equivalente" si multi-moneda, tooltip explicativo.
- **Deep link:** `/app/cuentas`.

### 2.7 🤖 FINN Daily Brief
- **Fuente:** `finn_insights` WHERE `kind = 'daily_brief' AND DATE(created_at) = today`.
- **Generación:** job `finn-daily-brief` corre a las 6:50am hora del usuario (`user_settings.finn_daily_brief_at`).
- **Muestra:** párrafo generado por Gemini 2.5 Flash con:
  - Saludo con nombre
  - Estado de liquidez
  - 1-2 alertas relevantes del día
  - 1 acción concreta recomendada
- **Ejemplo real del doc maestro:**
  > "Buenos días, Juan. Hoy tienes **$3,840 de liquidez libre** — $400 menos que la semana pasada. **Restaurantes lleva 89%** de su límite con 12 días del mes por delante. Tu Visa cierra en **6 días con $4,200**. Tu hermano Carlos lleva 47 días sin abonarte. **Acción del día:** Escríbele hoy y limita a $300 el gasto en restaurantes."

### 2.8 🏆 FlowScore + Racha
- **Fuente:** `flow_scores` último snapshot + `streaks` activos.
- **Muestra:** score 0-1000, nivel, círculo animado, racha actual "18 días sin sobregirar", próximo logro a desbloquear.
- **Deep link:** `/app/flowscore` (marketing/gamif, Fase 3).
- **MVP:** score básico calculado; gamif completo en Fase 3.

---

## 3. Casos de uso

### CU-01 — Primera visita del usuario al Dashboard
**Actor:** Usuario que acaba de completar onboarding + tiene ≥1 cuenta y ≥1 ingreso.
**Flujo:**
1. Redirect desde `/onboarding/complete` → `/app`.
2. Sistema carga los 8 widgets con datos reales del user.
3. FINN Daily Brief (primera vez) se genera on-the-fly (no cron todavía).
4. Se muestra hint "Puedes reordenar widgets manteniéndolos presionados".

### CU-02 — Vista diaria (usuario recurrente)
**Actor:** Abre la app cada mañana.
**Flujo:**
1. Landing en `/app`.
2. FINN Daily Brief ya generado por cron a las 6:50am.
3. Widgets renderizan primero con caché local (last known); actualiza en background con Realtime.
4. Usuario lee brief, ve alertas, tap en acción.

### CU-03 — Reordenar widgets
**Actor:** Usuario en desktop o móvil quiere poner FlowScore primero.
**Flujo:**
1. Long-press o click drag en widget.
2. Arrastra a nueva posición; grid se reorganiza en real time con `dnd-kit`.
3. Al soltar, sistema guarda nuevo orden en `user_settings.dashboard_widgets`.
4. `dashboard_widgets` = `[{id: 'net_worth', visible: true, order: 1}, ...]`.

### CU-04 — Ocultar widget
**Actor:** No quiere ver metas hasta configurar la primera.
**Flujo:**
1. Menú del widget → "Ocultar".
2. Sistema actualiza `dashboard_widgets` con `visible: false` para ese widget.
3. Widget desaparece; menú "Restaurar widgets" lo trae de vuelta.

### CU-05 — Tap en alerta
**Actor:** Ve "Tu Visa cierra en 3 días con $856".
**Flujo:**
1. Tap → navega a `/app/tarjetas/[visa_id]`.
2. Detalle de tarjeta con opción "Registrar pago".
3. Al registrar pago, alerta desaparece del Top 5.

### CU-06 — Realtime update
**Actor:** Registra un ingreso en otra pestaña o dispositivo.
**Flujo:**
1. Insert en `income_entries` dispara evento.
2. Supabase Realtime notifica.
3. Widgets afectados (Liquidez, Flujo del Mes, Patrimonio) refetch automáticamente.
4. Sin recarga de página.

### CU-07 — Estados vacíos del dashboard
**Actor:** Onboarding incompleto o sin datos.
**Flujo:**
1. Cada widget detecta ausencia de datos y muestra CTA específico:
   - Sin cuentas → "Crea tu primera cuenta"
   - Sin ingresos → "Registra un ingreso"
   - Sin budget → "Crea tu presupuesto"
   - Sin metas → "Define una meta"
2. FINN Daily Brief adapta el mensaje: "Aún no tienes suficientes datos para un análisis completo. Empieza registrando..."

### CU-08 — Widget "Metas Top 3" con menos de 3 metas
**Flujo:** Muestra las que existen + card "Crear meta" al final.

### CU-09 — Modo móvil compacto
**Actor:** Usuario en teléfono.
**Layout:**
- FINN Brief primero (full width)
- Grid 1 columna con widgets apilados
- Bottom nav con 5 tabs: Home · Gastos · Presupuesto · FINN · Más

### CU-10 — Alerta sin acción del usuario en 24h
**Flujo:**
1. Cron detecta alerta con `created_at < now() - 24h` y `dismissed_at IS NULL AND acted_at IS NULL`.
2. Aumenta prioridad si sigue relevante (ej. vencimiento se acerca).
3. Repite notificación en canales configurados.

### CU-11 — Deep link desde notificación
**Actor:** Recibe push "Presupuesto de Restaurantes al 100%".
**Flujo:**
1. Tap → app abre en `/app` con Dashboard cargado.
2. Widget "Semáforo Presupuesto" resaltado con animación breve.
3. Tap resalta → `/app/presupuesto`.

### CU-12 — FINN Daily Brief manual (refresh)
**Actor:** Usuario quiere re-generar brief.
**Flujo:**
1. Tap ⋯ del widget FINN → "Regenerar".
2. Llama Edge Function `finn-daily-brief?force=true`.
3. Rate limited: máximo 3 regeneraciones/día en Free.

---

## 4. Modelo de datos

### 4.1 `user_settings.dashboard_widgets`
JSONB en `user_settings`:
```json
[
  { "id": "net_worth",       "visible": true,  "order": 1 },
  { "id": "finn_brief",      "visible": true,  "order": 2 },
  { "id": "monthly_flow",    "visible": true,  "order": 3 },
  { "id": "alerts_top5",     "visible": true,  "order": 4 },
  { "id": "budget_semaphore","visible": true,  "order": 5 },
  { "id": "goals_top3",      "visible": false, "order": 6 },
  { "id": "liquidity_today", "visible": true,  "order": 7 },
  { "id": "flow_score",      "visible": true,  "order": 8 }
]
```
Se llena por default en `handle_new_user()`; usuario lo edita después.

### 4.2 Vista `v_dashboard_summary`
Vista SQL que agrega los datos principales en una sola query (optimización):
```sql
create or replace view public.v_dashboard_summary
with (security_invoker = true)
as
select
  auth.uid() as user_id,
  (select net_worth from public.v_net_worth_current) as net_worth,
  (select delta_amount from public.net_worth_snapshots
    where user_id = auth.uid()
    order by snapshot_date desc limit 1) as net_worth_delta_week,
  /* ... otros KPIs consolidados ... */
;
```

---

## 5. Reglas de negocio

### 5.1 Cálculo de liquidez libre

```sql
create or replace function calculate_liquidity_today(p_user_id uuid)
returns numeric(15,2) language plpgsql stable as $$
declare
  v_liquid numeric := 0;
  v_commitments numeric := 0;
  v_goal_pending numeric := 0;
  v_base char(3);
begin
  select currency_default into v_base from public.users where id = p_user_id;

  -- Suma cuentas líquidas
  select coalesce(sum(public.to_base_currency(balance, currency, p_user_id, current_date)), 0)
    into v_liquid
    from public.accounts
   where user_id = p_user_id
     and is_archived = false
     and type in ('checking', 'savings', 'cash', 'digital_wallet')
     and balance > 0;

  -- Compromisos fijos pendientes hasta fin de mes
  select coalesce(sum(amount), 0) into v_commitments
    from public.recurrings
   where user_id = p_user_id
     and is_active = true
     and kind in ('expense', 'cc_charge')
     and next_run_date between current_date and (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;

  -- Metas: aportes programados no cubiertos este mes
  select coalesce(sum(g.monthly_contribution - coalesce(gc.contributed_this_month, 0)), 0)
    into v_goal_pending
    from public.goals g
    left join (
      select goal_id, sum(amount) as contributed_this_month
        from public.goal_contributions
       where user_id = p_user_id
         and contribution_date >= date_trunc('month', current_date)
       group by goal_id
    ) gc on gc.goal_id = g.id
   where g.user_id = p_user_id
     and g.status = 'active'
     and g.monthly_contribution > 0;

  return round(v_liquid - v_commitments - v_goal_pending, 2);
end;
$$;
```

### 5.2 Generación del Daily Brief

**Prompt (Gemini 2.5 Flash):**
```
Eres FINN, asistente de finanzas personales.

Genera un párrafo de "brief diario" para el usuario, en español SV, cálido y directo.

Contexto del usuario:
- Nombre: {display_name}
- Fecha: {today}
- Liquidez libre: ${liquidity}
- Delta vs semana pasada: ${liquidity_delta_week}
- Categorías presupuesto en riesgo: {budget_risks}
- Vencimientos próximos: {upcoming_bills}
- Alertas prioritarias: {top_alerts}
- FlowScore: {flow_score}
- Racha días: {streak}

REGLAS:
- Máximo 4 oraciones.
- Termina con UNA acción concreta clara ("Acción del día: ...").
- Sé específico con montos y días.
- No des consejos de inversión.
- Menciona lo relevante, no todo.

Output: sólo el texto del brief. Sin encabezados.
```

Costo: ~$0.001 por brief. 1 diario por user activo. 1000 users activos = $1/día = $30/mes.

### 5.3 Selección de Top 5 Alertas

```sql
select * from public.finn_insights
 where user_id = auth.uid()
   and dismissed_at is null
   and (expires_at is null or expires_at > now())
 order by priority desc, created_at desc
 limit 5;
```

Priority buckets:
- 10 = crítico (vencimiento hoy)
- 7-9 = alto (vencimiento 3-5 días, presupuesto sobregirado)
- 4-6 = medio (categoría warning, sync FX pendiente)
- 1-3 = bajo (recordatorio conciliar, sugerir meta)

### 5.4 Realtime subscription

Frontend suscribe a canales:
- `postgres_changes` en `transactions` filtrado por `user_id`
- `postgres_changes` en `finn_insights`
- `postgres_changes` en `budget_categories`

Al detectar cambio, invalida caché de React Query correspondiente y refetch.

---

## 6. API / Endpoints

| # | Tipo | Path | Descripción |
|---|---|---|---|
| 1 | Supabase view | `v_dashboard_summary` SELECT | KPIs agregados |
| 2 | Edge Function GET | `/functions/v1/dashboard-data` | Todos los widgets en una llamada |
| 3 | Edge Function POST | `/functions/v1/finn-daily-brief?force=true` | Regenerar brief |
| 4 | Supabase client | `user_settings.dashboard_widgets` UPDATE | Persistir orden |
| 5 | Supabase Realtime | Canal `dashboard-<user_id>` | Updates live |

### 6.1 Response: `dashboard-data`
```typescript
GET /functions/v1/dashboard-data
Response 200:
{
  as_of: '2026-06-30T14:23:45Z',
  currency: 'USD',
  net_worth: { value: 12340.56, delta_week: 450.30, sparkline: [...] },
  monthly_flow: {
    income_confirmed: 1800,
    expenses_executed: 980,
    projection_close: 1470,
    semaphore: 'green'
  },
  alerts_top5: [ { id, title, priority, action_label, action_url }, ... ],
  goals_top3: [ { id, name, progress_pct, on_track }, ... ],
  budget_semaphore: { green: 4, yellow: 1, red: 1 },
  liquidity_today: 3840,
  finn_brief: { text: '...', generated_at, model },
  flow_score: { total: 680, level: 'apprentice', streak: 18, next_achievement: '...' },
  widget_config: [ ... ]
}
```

---

## 7. UI / UX

### 7.1 Layout desktop
```
┌────────────────────────────────────────────────────┐
│ Sidebar   │   Dashboard                            │
│ (nav)     │                                        │
│           │  ┌────────────┐ ┌────────────┐        │
│           │  │ FINN Brief │ │ Alertas 5  │        │
│           │  │            │ │            │        │
│           │  └────────────┘ └────────────┘        │
│           │                                        │
│           │  ┌────────┐ ┌────────┐ ┌────────┐    │
│           │  │NetWorth│ │Liquidez│ │FlowScore│   │
│           │  └────────┘ └────────┘ └────────┘    │
│           │                                        │
│           │  ┌────────────┐ ┌────────────┐        │
│           │  │Presupuesto │ │  Flujo Mes │        │
│           │  └────────────┘ └────────────┘        │
└────────────────────────────────────────────────────┘
```

### 7.2 Layout móvil
- Header: greeting + avatar
- FINN Brief full width (siempre visible arriba)
- Widgets apilados 1 columna
- Bottom nav: Home · Gastos · Presupuesto · FINN · Más
- FAB "+Gasto" flotante

### 7.3 Componentes
- Grid con `dnd-kit` para drag & drop
- Recharts para sparklines y mini-charts
- Framer Motion para transiciones suaves
- Skeleton loaders durante carga inicial
- Realtime indicator (dot verde cuando conectado)

### 7.4 Estados de widget
- Loading: skeleton
- Empty: CTA acción
- Error: retry button
- Ok: contenido normal

---

## 8. Reportes del módulo

MOD-01 no tiene reportes propios — es el agregador. Los reportes de profundidad viven en cada módulo.

---

## 9. RLS

Todas las tablas consultadas tienen RLS owner. Vista `v_dashboard_summary` con `security_invoker = true` respeta RLS de subyacentes.

---

## 10. Validaciones

| Campo | Regla |
|---|---|
| `user_settings.dashboard_widgets` | JSON array, max 20 widgets (para futuros), IDs válidos del catálogo |
| Widget order | Enteros ≥1, sin duplicados |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| Usuario sin datos (todos widgets vacíos) | Cada widget muestra su CTA de setup |
| FINN Brief falla (Gemini down) | Fallback texto estático: "Empieza tu día revisando tu presupuesto y gastos recientes." |
| Realtime desconectado | Badge "Reconectando..."; refetch manual via pull-to-refresh |
| Usuario cambia currency_default | Widgets recalculan al reload |
| Widget con error (crash) | Error boundary aísla; resto del dashboard sigue funcionando |
| Layout con 8 widgets ocultos | Mensaje "Todos los widgets están ocultos. Restaura desde ⋯" |
| Móvil con conexión lenta | Muestra caché local + skeleton para lo nuevo |
| PWA offline | Muestra last-known desde IndexedDB con badge "Sin conexión" |

---

## 12. Plan de tests

### 12.1 Unit
- `calculateLiquidityToday(accounts, recurrings, goals)`
- `filterTopAlerts(insights, notifications, limit=5)`
- `computeMonthlyFlowProjection(spent, days_elapsed, days_total)`
- Widget reducers/selectors

### 12.2 Integration
- Vista `v_dashboard_summary` con datos varios
- Function `calculate_liquidity_today()` con casos edge
- `dashboard-data` endpoint retorna correcto para RLS
- Realtime channels emiten al cambiar tablas

### 12.3 E2E
- Onboarding → dashboard aparece con datos
- Registrar gasto en otra tab → dashboard actualiza sin reload
- Drag widget → orden persiste tras reload
- Ocultar widget → no aparece
- Deep link desde alerta → navegación correcta
- FINN Brief force regenerate → nuevo texto

### 12.4 Performance
- `dashboard-data` responde <400ms P95 con caché
- Renderizado inicial <1.5s P75
- Realtime latencia <500ms

---

## 13. Telemetría

### 13.1 Eventos
- `dashboard_viewed`
- `widget_reordered` props: `widget_id`, `from`, `to`
- `widget_hidden` / `widget_shown`
- `alert_clicked` props: `alert_kind`
- `finn_brief_regenerated`
- `dashboard_deep_link` props: `widget_source`, `target`

### 13.2 KPIs
- % usuarios activos que abren dashboard diariamente: ≥60%
- % que interactúan con al menos 1 widget (tap): ≥50%
- Tiempo promedio en dashboard: ≥15 seg (indicador de lectura)
- % de alertas del Top 5 con acción tomada: ≥40%
- % de reordenamiento de widgets: ~10-20% (feature valorada pero no masiva)

---

## 14. Out of scope (MVP)

- ❌ Widgets personalizados por usuario (Fase 2)
- ❌ Widget marketplace (Fase 3)
- ❌ Dashboards alternativos por rol (Fase 3 con MOD-11 asesor B2B)
- ❌ Comparativas con benchmarks anónimos (Fase 3)
- ❌ Streamlit-like plots interactivos (Fase 3)
- ❌ Comandos de voz "¿cuánto tengo hoy?" (Fase 2 con dictado)
- ❌ Widget de crypto tracker separado (BTC ya está en liquidez si aplica)
- ❌ Modo oscuro/claro toggle (default oscuro; theming completo Fase 2)

---

## 15. Dependencias

### 15.1 Bloqueadores
- ⏳ MOD-00, 02, 04, 15, 17 activos (fuentes de datos)
- ⏳ MOD-03 activo (semáforo presupuesto)
- ⏳ MOD-08 FINN básico (para Daily Brief)
- ⏳ Supabase Realtime configurado

### 15.2 Orden recomendado
1. Vista `v_dashboard_summary` + function `calculate_liquidity_today`
2. Edge Function `dashboard-data` (agregador)
3. Grid layout con `dnd-kit`
4. 8 widgets uno por uno (empezando por FINN Brief y NetWorth)
5. Realtime subscriptions
6. Deep links a módulos
7. Estados vacíos por widget
8. Modo móvil optimizado + bottom nav
9. Tests
10. Performance tuning

### 15.3 Estimación
- Vista + function: 1 día
- Endpoint agregador: 0.5 día
- Grid + dnd-kit: 1 día
- 8 widgets: 3 días (0.4 día c/u)
- Realtime: 1 día
- Deep links + estados vacíos: 1 día
- Mobile layout: 1 día
- Tests: 1 día
- **Total estimado:** ~9.5 días (~2 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Layout móvil FINN Brief | ✅ Sticky-below-header | CSS `position: sticky; top: <header-height>` |
| 2 | Regenerar Daily Brief | ✅ 3/día Free · Ilimitado Pro+ | Rate limit por plan en Edge Function |
| 3 | FlowScore widget MVP | ✅ Sí con badge "Beta" | Score básico visible, tooltip explica limitación |
| 4 | Sparkline Net Worth | ✅ 6 meses | Query `net_worth_snapshots` últimos 24 puntos |
| 5 | PWA offline | ✅ Datos stale + badge | IndexedDB cache; badge muestra `Hace X horas` |

---

## 17. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ Vista `v_dashboard_summary` en nueva migración
- ⏳ Function `calculate_liquidity_today()` en nueva migración
- ⏳ Edge Function `dashboard-data`
- ⏳ 8 componentes React (uno por widget) con tests
- ⏳ Grid con drag & drop
- ⏳ Realtime channels configurados
- ⏳ Layouts desktop + móvil
- ⏳ Tests E2E de flujos críticos
- ⏳ Eventos PostHog activos

---

## 18. Conexión con otros módulos

| Módulo | Rol en Dashboard |
|---|---|
| **MOD-00** | Ingresos alimentan Flujo del Mes y Liquidez |
| **MOD-02** | Cuentas alimentan Liquidez y Net Worth |
| **MOD-03** | Presupuesto alimenta Semáforo |
| **MOD-04** | Gastos actualizan Flujo del Mes en realtime |
| **MOD-15** | Tarjetas alimentan Alertas (vencimientos) |
| **MOD-17** | Patrimonio en widget dedicado |
| **MOD-05 (Fase 2)** | Metas alimentan widget Top 3 Metas |
| **MOD-08 FINN** | Daily Brief + insights → Top 5 Alertas |
| **MOD-12 Salud (Fase 3)** | Complementa semáforo global |
| **FlowScore** | Widget dedicado |
