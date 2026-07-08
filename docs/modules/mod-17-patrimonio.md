# MOD-17 — Patrimonio Neto

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.2, semanas 8-11)
> **Tablas core:** `net_worth_snapshots`, `accounts`, `credit_cards`, `investments`, `manual_assets`, `manual_liabilities`, `family_loans`, `loan_portfolio`, `debts`
> **Status:** KPI más importante de las finanzas personales. Se actualiza automáticamente y se snapshot semanal.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Snapshot semanal** (lunes 9am UTC). Usuario puede forzar snapshot manual desde UI. Diario descartado por inflar tabla.
2. ✅ **Sin depreciación automática de vehículos en MVP**. Solo cuando el usuario actualiza manualmente. Fase 2 puede aplicar `appreciation_rate_yr` mensual.
3. ✅ **BTC incluido en patrimonio por default** (relevante en SV como legal tender). Usuario puede excluir cuenta con `is_included_in_net_worth = false`.
4. ✅ **Family loans y loan_portfolio cuentan como `receivables`** en activos, sin discriminar por `trust_score`. Un badge visual muestra riesgo si `trust_score < 5`.
5. ✅ **Manual assets en moneda distinta a base**: aceptados con conversión automática via `get_fx_rate`.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Calcula y visualiza el patrimonio neto (activos − pasivos) del usuario en cada momento y a través del tiempo. Es la única métrica que refleja el verdadero progreso financiero.

### 1.2 Qué NO hace
- No gestiona los activos ni pasivos individualmente (eso lo hacen MOD-02, MOD-07, MOD-15, MOD-16, MOD-13/14).
- No proyecta patrimonio futuro con ML (Fase 2).
- No hace análisis de asignación óptima (Fase 2).
- No compara con benchmarks demográficos (Fase 3).

### 1.3 Alcance MVP vs Fase 2/3

| Feature | MVP | Fase 2 | Fase 3 |
|---|---|---|---|
| Cálculo live (todo momento) | ✅ | — | — |
| Snapshot semanal automático | ✅ `pg_cron` | — | — |
| Desglose activos y pasivos por categoría | ✅ | — | — |
| Historial 12 meses | ✅ | — | — |
| Gráfica de evolución | ✅ line chart | — | — |
| Activos manuales (auto, casa, joyería) | ✅ | Apreciación automática | — |
| Pasivos manuales (préstamos privados) | ✅ | — | — |
| Multi-moneda consolidado a USD | ✅ | — | — |
| Bitcoin como activo | ✅ | — | — |
| Cambios significativos (>5%) con explicación FINN | ✅ | — | — |
| Proyección ML a 6/12/24 meses | ❌ | ✅ Prophet | — |
| Benchmark anónimo vs. cohorte | ❌ | ❌ | ✅ |
| Simulador de escenarios patrimoniales | Parcial | ✅ completo | — |

---

## 2. Fórmula de cálculo

### 2.1 Activos (siempre positivos)

| Fuente | Query | Nota |
|---|---|---|
| Cuentas de saldo positivo | `SUM(accounts.balance)` WHERE `is_included_in_net_worth = true AND is_archived = false AND balance > 0 AND type ≠ 'credit_card'` | Excluye tarjetas |
| Cuentas de saldo negativo (efectivo/cash con deuda) | Se van a pasivos si `balance < 0` | |
| Inversiones | `SUM(investments.current_value)` WHERE `is_active = true` | Fase 2 activa |
| Activos manuales | `SUM(manual_assets.value)` WHERE `is_active = true` | Auto, casa, joyería |
| Préstamos otorgados sin interés | `SUM(family_loans.balance)` WHERE `status = 'active' AND deleted_at IS NULL` | Fase 2 |
| Cartera con interés | `SUM(loan_portfolio.balance_pending)` WHERE `status = 'active' AND deleted_at IS NULL` | Fase 2 |

### 2.2 Pasivos (siempre positivos en el modelo, aunque se resten)

| Fuente | Query | Nota |
|---|---|---|
| Tarjetas de crédito | `SUM(credit_cards.current_balance)` WHERE `status = 'active' AND current_balance > 0` | Solo saldo positivo (deuda); crédito a favor no aplica aquí |
| Deudas propias | `SUM(debts.current_balance)` WHERE `status = 'active' AND deleted_at IS NULL` | Préstamos personales, hipoteca, auto |
| Cuentas con saldo negativo | `SUM(|accounts.balance|)` WHERE `balance < 0 AND is_included_in_net_worth = true` | Sobregiros |
| Pasivos manuales | `SUM(manual_liabilities.amount)` WHERE `is_active = true` | Deuda con familiar sin registrar como préstamo |

### 2.3 Fórmula final
```
net_worth = total_assets − total_liabilities
```

Todos los valores convertidos a `users.currency_default` (USD para SV) usando `get_fx_rate(<currency>, 'USD', snapshot_date)`.

### 2.4 Desglose (para UI)

**Activos:**
```json
{
  "cash":         valor,   // checking + savings + cash + digital_wallet USD
  "bitcoin":      valor,   // digital_wallet BTC convertido
  "investments":  valor,   // investments
  "real_estate":  valor,   // manual_assets type=real_estate
  "vehicles":     valor,   // manual_assets type=vehicle
  "receivables":  valor,   // family_loans + loan_portfolio (dinero prestado)
  "other":        valor    // resto
}
```

**Pasivos:**
```json
{
  "credit_cards":   valor,  // credit_cards.current_balance
  "personal_loans": valor,  // debts type=personal_loan + student_loan
  "mortgage":       valor,  // debts type=mortgage
  "auto_loan":      valor,  // debts type=auto_loan
  "manual":         valor,  // manual_liabilities
  "overdrafts":     valor   // saldos negativos de cuentas
}
```

---

## 3. Casos de uso

### CU-01 — Ver patrimonio neto actual
**Actor:** Usuario abre `/app/patrimonio` o Dashboard.
**Flujo:**
1. Frontend llama Edge Function `net-worth-live` o consulta vista `v_net_worth_current`.
2. Recibe: `{total_assets, total_liabilities, net_worth, currency, breakdown_assets, breakdown_liabilities}`.
3. Muestra número grande + delta vs último snapshot semanal.
4. Gráfica de evolución 12 meses.

### CU-02 — Snapshot semanal automático
**Trigger:** `pg_cron` lunes 9:00 AM UTC.
**Flujo:**
1. Edge Function `snapshot-net-worth` corre para cada `users` activo.
2. Calcula `total_assets`, `total_liabilities`, breakdowns.
3. Compara con último snapshot: `delta_amount`, `delta_pct`.
4. INSERT en `net_worth_snapshots`.
5. Si `|delta_pct| > 5%`: FINN genera insight explicando el cambio.

### CU-03 — Agregar activo manual (auto, casa)
**Actor:** Usuario tiene auto tasado en $8,500.
**Flujo:**
1. `/app/patrimonio` → tab "Activos manuales" → "Agregar".
2. Captura: nombre ("Toyota Corolla 2020"), tipo `vehicle`, valor, fecha de compra, tasa de apreciación anual (negativa para depreciación, ej. -15%).
3. Sistema guarda en `manual_assets`.
4. Aparece en breakdown inmediatamente.
5. En Fase 2: cálculo automático de depreciación con `appreciation_rate_yr`.

### CU-04 — Agregar pasivo manual
**Actor:** Usuario debe $500 al primo, no lo modela como préstamo formal.
**Flujo:**
1. `/app/patrimonio` → tab "Pasivos manuales" → "Agregar".
2. Captura: nombre ("Debo a Carlos"), tipo `other`, monto.
3. Guarda en `manual_liabilities`.
4. FINN sugiere: "¿Prefieres registrarlo como préstamo familiar para tracking de pagos?" (redirige a MOD-13, Fase 2).

### CU-05 — Ver desglose completo
**Actor:** Usuario quiere entender de qué está compuesto su patrimonio.
**Vista:**
```
Patrimonio Neto:  $12,340.56
↑ +$450.30 (+3.8%) vs. semana pasada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVOS                $15,890.56
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Efectivo/Ahorro       $  4,200
🪙 Bitcoin (0.05 BTC)    $  3,150
📈 Inversiones           $  2,500
🏠 Bienes raíces         $  4,000
🚗 Vehículos             $  1,200
📊 Otros                 $     40

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASIVOS                $ 3,550.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 Tarjetas              $  1,234
🏦 Préstamo auto         $  2,000
👥 Manuales              $    316
```

### CU-06 — Evolución mensual (gráfica)
**Vista:**
- Line chart 12 meses con 3 líneas: net_worth, activos, pasivos.
- Puntos = snapshots semanales agregados por mes (promedio o último).
- Tooltip con desglose de mes.
- Botón: cambiar rango 1m / 3m / 6m / 12m / desde inicio.

### CU-07 — Insight de FINN sobre cambio grande
**Trigger:** snapshot semanal detecta `delta_pct > 5%` (positivo o negativo).
**Flujo:**
1. Edge Function analiza qué cambió: comparar breakdowns actual vs anterior.
2. Identifica top 2 fuentes del cambio (ej. "Cuentas +$800, Inversiones -$350").
3. Genera insight con explicación:
   - "+8.2% esta semana. Principal aporte: tu quincena de $800 y ganancia en inversiones."
   - "-6.5% esta semana. Principal causa: pago de tarjeta $500 y depreciación mensual auto $150."

### CU-08 — Excluir cuenta del patrimonio
**Actor:** Usuario tiene cuenta compartida familiar que no considera "suya".
**Flujo:**
1. En MOD-02, edita cuenta → `is_included_in_net_worth = false`.
2. Automáticamente excluida de siguiente snapshot y del cálculo live.

### CU-09 — Historia detallada (drill-down)
**Actor:** Usuario tap en punto de la gráfica del 15 de junio.
**Flujo:**
1. Muestra snapshot completo de esa fecha.
2. Comparación con snapshot anterior (7 días antes).
3. Lista transacciones grandes del periodo que explican el delta.

### CU-10 — Objetivo de patrimonio
**Actor:** Usuario quiere llegar a $20K en 12 meses.
**Flujo:**
1. En MOD-05 Metas (Fase 2), crea meta tipo `savings` con target $20K.
2. MOD-17 muestra progreso hacia esa meta.
3. FINN calcula si ritmo actual alcanza (proyección lineal MVP).

**Status MVP:** vinculación básica; visualización completa en Fase 2 con MOD-05.

---

## 4. Modelo de datos

### 4.1 `net_worth_snapshots`
Ya definida en migración 15. Un snapshot por usuario por día (unique constraint).

Campos clave:
- `snapshot_date` (unique con `user_id`)
- `total_assets`, `total_liabilities`, `net_worth` (generated)
- `currency` (moneda base del usuario)
- `assets_breakdown` JSONB (ver §2.4)
- `liabilities_breakdown` JSONB
- `delta_amount`, `delta_pct` (vs snapshot anterior)
- `source` (`'auto'` o `'manual'`)

### 4.2 Vista `v_net_worth_current`
Vista SQL que calcula patrimonio actual on-the-fly (no cachea):

```sql
create or replace view public.v_net_worth_current
with (security_invoker = true)
as
with u as (
  select id, currency_default from public.users where id = auth.uid()
),
assets as (
  -- accounts positivos
  select coalesce(sum(
    case when balance > 0 then
      public.to_base_currency(balance, currency, u.id, current_date)
    else 0 end
  ), 0) as val
    from public.accounts, u
   where accounts.user_id = u.id
     and is_included_in_net_worth = true
     and is_archived = false
     and type <> 'credit_card'
),
liabilities_cc as (
  select coalesce(sum(
    case when current_balance > 0 then
      public.to_base_currency(current_balance, currency, u.id, current_date)
    else 0 end
  ), 0) as val
    from public.credit_cards, u
   where credit_cards.user_id = u.id
     and status = 'active'
),
-- ... similar para: manual_assets, investments, family_loans, loan_portfolio,
--                    manual_liabilities, debts, cuentas negativas
select u.id as user_id,
       u.currency_default as currency,
       assets.val + /* otros activos */ as total_assets,
       liabilities_cc.val + /* otros pasivos */ as total_liabilities,
       (assets.val + /* otros activos */) - (liabilities_cc.val + /* otros pasivos */) as net_worth
  from u, assets, liabilities_cc /* joins */;
```

**Nota implementación:** por brevedad, arriba está simplificado. La vista real hace 8-10 CTEs (una por fuente).

### 4.3 Función `calculate_net_worth(p_user_id, p_date)`
Retorna JSONB completo:
```json
{
  "user_id": "uuid",
  "date": "2026-06-30",
  "currency": "USD",
  "total_assets": 15890.56,
  "total_liabilities": 3550.00,
  "net_worth": 12340.56,
  "assets_breakdown": {...},
  "liabilities_breakdown": {...}
}
```

Usada por:
- Snapshot job (con `p_date = current_date`)
- Endpoint live (con `p_date = current_date`)
- Historia (con `p_date = <fecha pasada>` — recalcula usando datos históricos)

---

## 5. Reglas de negocio

### 5.1 Multi-moneda
Cada activo/pasivo tiene su moneda. Se convierte a `users.currency_default` usando `get_fx_rate(from, to, snapshot_date)`.

Si FX no disponible para BTC o divisa exótica en `snapshot_date`, el valor se excluye del cálculo Y se registra en `assets_breakdown.pending_fx: [{name, amount, currency}]` para UI advierta.

### 5.2 Frecuencia de snapshots
- Semanal (lunes 9am UTC) por cron.
- El usuario puede forzar snapshot manual desde UI (útil después de un evento grande).
- Máximo 1 snapshot por día (`unique (user_id, snapshot_date)`).

### 5.3 Retención
Snapshots se conservan indefinidamente. Volumen bajo (~52/año/usuario = 5 KB/año). No purga.

### 5.4 Cuentas cash con saldo negativo
- Un `type = 'cash'` con `balance < 0` significa que el usuario debe efectivo (raro pero posible).
- Va a `liabilities_breakdown.overdrafts` con valor absoluto.

### 5.5 Bitcoin
- Cuentas `digital_wallet` con `currency = 'BTC'` se convierten a USD con `get_fx_rate('BTC', 'USD', date)`.
- Fuente: CoinGecko API vía job `sync-fx-rates` diario.
- Va a `assets_breakdown.bitcoin`.
- En SV es legal tender, así que cuenta como activo líquido.

### 5.6 Depreciación de vehículos (MVP simplificado)
- `manual_assets.appreciation_rate_yr` — puede ser negativo (depreciación).
- MVP: NO aplica automáticamente. El valor se mantiene igual hasta que usuario lo actualice manualmente.
- FINN sugiere anualmente: "Actualiza el valor de tu Toyota Corolla — probablemente depreció ~15% en el último año".

Fase 2: función `depreciate_manual_assets()` job mensual que aplica automáticamente.

### 5.7 Delta significativo (>5%)
- `delta_pct` calculado como `(new_net_worth - old_net_worth) / |old_net_worth|`.
- Si `|delta_pct| ≥ 0.05` (5%), disparar insight FINN.
- Excepciones: primera semana (no hay old) NO dispara.

### 5.8 Contribución al FlowScore
`FlowScore.growth_score` (0-100) se calcula desde:
- Tendencia de patrimonio últimas 4 semanas (positiva = puntos)
- Consistencia (menos volatilidad = puntos)
- Absoluto (mayor patrimonio = puntos, hasta 100)

Fórmula exacta se documenta en spec de FlowScore transversal.

---

## 6. API / Endpoints

| # | Tipo | Path / Función | Descripción |
|---|---|---|---|
| 1 | Supabase view | `v_net_worth_current` SELECT | Patrimonio actual |
| 2 | Edge Function GET | `/functions/v1/net-worth-live` | Cálculo actual con breakdown completo |
| 3 | Supabase client | `from('net_worth_snapshots').select()` | Histórico (RLS owner) |
| 4 | Edge Function POST | `/functions/v1/net-worth-snapshot` | Forzar snapshot manual |
| 5 | Edge Function GET | `/functions/v1/net-worth-explain-delta` | Genera insight FINN sobre cambio |
| 6 | Supabase client | `from('manual_assets').all()` | CRUD activos manuales |
| 7 | Supabase client | `from('manual_liabilities').all()` | CRUD pasivos manuales |

### 6.1 Response: `net-worth-live`
```typescript
GET /functions/v1/net-worth-live
Authorization: Bearer <user_jwt>

Response 200:
{
  currency: 'USD',
  as_of: '2026-06-30T14:23:45Z',
  total_assets: 15890.56,
  total_liabilities: 3550.00,
  net_worth: 12340.56,
  assets_breakdown: {
    cash: 4200.00,
    bitcoin: 3150.00,
    investments: 2500.00,
    real_estate: 4000.00,
    vehicles: 1200.00,
    receivables: 800.00,
    other: 40.56,
    pending_fx: []
  },
  liabilities_breakdown: {
    credit_cards: 1234.00,
    personal_loans: 0,
    mortgage: 0,
    auto_loan: 2000.00,
    manual: 316.00,
    overdrafts: 0
  },
  last_snapshot: {
    date: '2026-06-24',
    net_worth: 11890.26,
    delta_amount: 450.30,
    delta_pct: 0.0379
  }
}
```

---

## 7. UI / UX

### 7.1 Pantallas
1. **Overview** (`/app/patrimonio`) — número grande + gráfica + breakdown expandible.
2. **Histórico** (`/app/patrimonio/historia`) — tabla de snapshots + drill-down.
3. **Activos manuales** (`/app/patrimonio/activos`) — CRUD.
4. **Pasivos manuales** (`/app/patrimonio/pasivos`) — CRUD.

### 7.2 Overview layout
```
Patrimonio Neto
$12,340.56 USD

┌──── Últimos 12 meses ────────────┐
│                              ╱─── │
│                          ╱───     │
│                      ╱───         │
│  ────╲          ╱───              │
│       ╲──────╱                    │
└───────────────────────────────────┘
Jul                            Jun

▼ Activos    $15,890.56
▼ Pasivos    $ 3,550.00

+$450 esta semana  ↑
💬 FINN: "Tu patrimonio subió principalmente por tu quincena de $800."
```

### 7.3 Drill-down
Tap en breakdown item ("Bitcoin") → muestra:
- Detalle: 0.05 BTC × $63,000 = $3,150
- Fuente: Chivo Wallet + Bitcoin Beach
- Última actualización: hace 3 días
- CTA "Actualizar saldo"

### 7.4 Estados vacíos
- Sin ningún activo o pasivo: "Tu patrimonio se calculará cuando agregues tu primera cuenta o activo. Empieza con MOD-02 Cuentas."

### 7.5 Confirmaciones
- Eliminar `manual_asset` con valor > $1,000: confirmación con advertencia "Esto reducirá tu patrimonio en $X en el próximo snapshot".

---

## 8. Reportes del módulo

### MVP (3 reportes)
1. **Evolución 12 meses** — line chart (default en overview).
2. **Composición actual** — pie/donut breakdown activos y pasivos.
3. **Delta semanal** — bar chart mostrando cambio semana a semana.

### Fase 2
- Proyección Prophet a 6/12/24 meses
- Distribución % ideal vs actual (según edad, ingreso)
- Sharpe ratio simplificado de crecimiento

---

## 9. RLS

Ya definido en migración 15:
```sql
create policy "nw_owner_read" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
-- inserts solo vía service_role
```

Vista `v_net_worth_current` usa `security_invoker = true` → respeta RLS de tablas subyacentes.

Edge Functions verifican `auth.uid()` antes de calcular.

---

## 10. Validaciones

| Campo | Regla |
|---|---|
| `manual_assets.value` | > 0 |
| `manual_assets.currency` | ISO 4217 válido |
| `manual_assets.appreciation_rate_yr` | -1.0 a 1.0 (rangos razonables, warning si excede) |
| `manual_assets.type` | enum `asset_type` |
| `manual_liabilities.amount` | > 0 |
| `snapshot_date` | ≤ current_date (no futuros) |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| Usuario sin ningún activo ni pasivo | net_worth = 0, breakdowns vacíos, UI muestra empty state |
| Patrimonio negativo (deudas > activos) | Válido, se muestra en rojo con FINN insight sobre plan de acción |
| BTC price no disponible temporalmente | Excluir del cálculo, mostrar en `pending_fx`, retry al día siguiente |
| Usuario cambia `currency_default` | Snapshots pasados quedan en su currency histórica; nuevos usan nueva base |
| Delta 100% (pasa de 0 a positivo) | Cálculo `delta_pct` con `nullif(|old|, 0)` → infinity → capado a 999% con nota |
| Manual asset con valor 0 | Rechazado (constraint) |
| Family loan con `deleted_at` reciente | No cuenta desde soft-delete |
| Cuenta archivada durante la semana | Snapshot semanal la incluye hasta el día anterior a archivarse |
| BTC volatilidad extrema (±20% semana) | Snapshot lo captura; delta grande dispara FINN insight explicativo |
| Manual asset con currency ≠ base | Convertido cada vez usando `get_fx_rate` |

---

## 12. Plan de tests

### 12.1 Unit
- `calculateNetWorth(assets_by_source, liabilities_by_source)` → suma correcta
- `calculateDelta(new, old)` → maneja división por 0
- `groupAssetsBreakdown(raw_data)` → agrupa por categoría
- Zod: `manualAssetSchema`, `manualLiabilitySchema`

### 12.2 Integration
- Vista `v_net_worth_current` con:
  - Sin datos → 0
  - Solo cuentas → suma correcta
  - Multi-moneda → conversión aplicada
  - Con BTC → CoinGecko fx aplicada
- Función `calculate_net_worth()` para fecha pasada usa historical fx
- Snapshot job: crea entry idempotente (no duplica)
- Delta insight generado cuando ≥5% cambio
- RLS: usuario A no ve snapshots de B

### 12.3 E2E
- Onboarding con primera cuenta → patrimonio positivo visible
- Agregar auto manual $8,000 → patrimonio sube $8,000
- Cargar tarjeta con $500 → patrimonio baja $500
- Snapshot manual → aparece en histórico
- Ver drill-down desde gráfica → snapshot correcto

### 12.4 Performance
- `net-worth-live` responde <300ms P95 con ≤100 cuentas/activos
- Vista `v_net_worth_current` <200ms P95

---

## 13. Telemetría

### 13.1 Eventos
- `net_worth_viewed` props: `net_worth_band`, `has_investments`, `has_manual_assets`
- `manual_asset_created` props: `type`, `value_band`, `currency`
- `manual_liability_created` props: `type`, `amount_band`
- `net_worth_snapshot_manual` props: `days_since_last`
- `net_worth_drill_down` props: `category`
- `net_worth_delta_insight_generated` props: `delta_pct_bucket`, `direction`

### 13.2 KPIs
- % usuarios activos que revisan patrimonio ≥1 vez/semana: ≥40%
- % usuarios con ≥1 manual asset: ≥30%
- Crecimiento promedio mensual de patrimonio (para usuarios continuos): +2% ideal

---

## 14. Out of scope (MVP)

- ❌ Proyección ML con Prophet (Fase 2)
- ❌ Depreciación automática de vehículos (Fase 2)
- ❌ Apreciación automática de inmuebles (Fase 2)
- ❌ Benchmark anónimo vs cohorte demográfica (Fase 3)
- ❌ Cálculo de "libertad financiera" (patrimonio × 4% > gastos anuales) — planea Fase 3
- ❌ Alertas de dependencia excesiva de un solo activo (Fase 2)
- ❌ Recomendaciones de rebalanceo de portafolio (Fase 3)
- ❌ Sharpe ratio o métricas avanzadas
- ❌ Múltiples currencies base simultáneas (una sola por usuario)

---

## 15. Dependencias

### 15.1 Bloqueadores
- ✅ Schema migración 15 aplicada
- ⏳ MOD-02 Cuentas activo (fuente principal de activos)
- ⏳ MOD-15 Tarjetas activo (fuente de pasivos)
- ⏳ Función `to_base_currency()` funcionando (ya en migración 3)
- ⏳ Job `sync-fx-rates` corriendo diariamente (para BTC y multi-currency)
- ⏳ `pg_cron` habilitado

### 15.2 Orden recomendado
1. Vista `v_net_worth_current` con cuentas y tarjetas (Fase 1)
2. Extender vista con manual_assets y manual_liabilities
3. Función `calculate_net_worth()` para fechas históricas
4. Edge Function `net-worth-live`
5. Edge Function `net-worth-snapshot` + cron job
6. UI overview con gráfica
7. UI CRUD manual_assets y manual_liabilities
8. Delta insight con FINN
9. Drill-down y histórico
10. 3 reportes MVP
11. Tests

### 15.3 Estimación
- Vista SQL: 1 día (compleja por CTEs)
- Función calculate_net_worth: 1 día
- Edge Functions: 1 día
- Cron job + snapshot: 0.5 día
- UI overview con Recharts: 1.5 días
- UI CRUD manual: 1 día
- Delta insight con FINN: 1 día
- Drill-down: 0.5 día
- Reportes: 0.5 día
- Tests: 1 día
- **Total estimado:** ~9 días (~2 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Frecuencia snapshot | ✅ Semanal (lunes 9am UTC) | pg_cron job + endpoint manual |
| 2 | Depreciación automática | ✅ Sin auto en MVP | Solo update manual; Fase 2 con `depreciate_manual_assets()` job |
| 3 | BTC en patrimonio | ✅ Incluido por default | Configurable por cuenta con `is_included_in_net_worth` |
| 4 | Family loans como activo | ✅ Sí, sin discriminar | Badge visual "Alto riesgo" si `trust_score < 5` |
| 5 | Manual asset multi-moneda | ✅ Aceptado | Conversión automática via `get_fx_rate` |

---

## 17. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ Vista `v_net_worth_current` en nueva migración
- ⏳ Función `calculate_net_worth(user_id, date)` en nueva migración
- ⏳ Edge Functions: net-worth-live, net-worth-snapshot, net-worth-explain-delta
- ⏳ pg_cron job semanal
- ⏳ UI overview con gráfica Recharts
- ⏳ UI CRUD activos y pasivos manuales
- ⏳ Integración FINN insights
- ⏳ 3 reportes MVP
- ⏳ Tests unit + integration + 3 E2E

---

## 18. Conexión con otros módulos

| Módulo | Interacción |
|---|---|
| **MOD-02 Cuentas** | Fuente principal de activos (`accounts.balance`) |
| **MOD-15 Tarjetas** | Fuente principal de pasivos (`credit_cards.current_balance`) |
| **MOD-07 Inversiones (Fase 2)** | Fuente de activos (`investments.current_value`) |
| **MOD-13 Family loans (Fase 2)** | Fuente de `receivables` |
| **MOD-14 Cartera (Fase 2)** | Fuente de `receivables` |
| **MOD-16 Deudas (Fase 2)** | Fuente de pasivos |
| **MOD-01 Dashboard** | Widget con patrimonio + delta semanal |
| **MOD-05 Metas (Fase 2)** | Meta tipo "patrimonio a $X" mide progreso desde aquí |
| **MOD-08 FINN** | Insights de delta significativo, recomendaciones de rebalanceo |
| **FlowScore** | Componente `growth_score` viene de tendencia de patrimonio |
| **MOD-09 Gamificación (Fase 3)** | Logros por milestones ($10K, $50K, $100K) |
| **MOD-10 Reportes (Fase 3)** | Reporte anual de patrimonio |
