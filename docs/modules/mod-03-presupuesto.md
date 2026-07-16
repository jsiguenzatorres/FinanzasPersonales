# MOD-03 — Presupuesto Híbrido Inteligente

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.2, semanas 8-11)
> **Tablas core:** `budgets`, `budget_categories`, `transactions`, `categories`, `income_entries`, `recurrings`
> **Status:** Corazón operativo del MVP. Módulo con la lógica de negocio más compleja: 3 modos de presupuesto, rollover, semáforos, alertas.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Categorías sin límite en Flexible** = `allocated_amount = 0`, no aparece en semáforo pero cuenta en `total_spent`.
2. ✅ **Rollover overspent default `true`** (disciplina realista). Configurable en settings.
3. ✅ **Colab schema soportado desde MVP, UI de invitación en MOD-11 (Fase 3)**. Mientras tanto, todos los budgets son personales.
4. ✅ **Split y presupuesto**: sumar por hijas cuando `is_split = true` (consistente con MOD-04).
5. ✅ **Cache de sugerencia Neto**: localStorage 24h TTL con botón "Actualizar sugerencia" forzando refetch.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Permite al usuario planificar y controlar sus gastos mensuales usando 3 modos: **Zero-based** (rígido), **Flexible** (por categorías), o **50/30/20** (regla clásica). Rastrea en tiempo real contra los gastos capturados en MOD-04.

### 1.2 Qué NO hace
- No captura gastos (eso es MOD-04).
- No proyecta ingresos futuros (eso viene de MOD-00 + `recurrings`).
- No gestiona metas (MOD-05, Fase 2 — el presupuesto puede tener línea "ahorro para metas" pero la gestión detallada vive en MOD-05).
- No paga cuentas automáticamente (nunca).

### 1.3 Alcance MVP vs Fase 2

| Feature | MVP | Fase 2 |
|---|---|---|
| 3 modos de presupuesto | ✅ | — |
| Creación wizard 5 pasos | ✅ | — |
| 8 categorías × ~5 subcategorías (SV) | ✅ | — |
| Rollover automático mes-a-mes | ✅ | — |
| 10 KPIs en tiempo real | ✅ | — |
| Alertas configurables (umbrales) | ✅ | — |
| Sugerencia de Neto basada en historial | ✅ básica | ✅ mejorada con ML |
| Presupuesto colaborativo (via collab_space) | ✅ persistencia | ✅ UI Fase 3 |
| Realtime (Supabase Realtime) para colaborativo | ✅ | — |
| Plantillas guardadas | ❌ | ✅ |
| Análisis de variación mensual | ✅ básico | ✅ dashboard dedicado |
| Presupuesto anual (12 meses) | ❌ | ✅ |
| Presupuesto por proyecto/viaje | ❌ | ✅ (con MOD-18) |
| ML: sugerencia inteligente próximo mes | ❌ | ✅ |

---

## 2. Los 3 modos de presupuesto

### 2.1 Modo Zero-Based
> "Cada peso del ingreso mensual recibe una asignación antes de gastarlo. Dinero sin asignar = $0."

**Comportamiento:**
- Usuario asigna cada centavo del ingreso esperado a categorías.
- `budgets.unallocated = total_income_expected - total_allocated` debe llegar a 0 para "cerrar" el presupuesto.
- Al gastar, el `spent_amount` de la categoría sube; queda disponible = `allocated - spent`.
- Rollover: sobrantes van a "Ahorro programado" (default) o a categorías definidas por el usuario.

**Para quién:** usuarios con deudas o que buscan máximo control.

### 2.2 Modo Flexible
> "El usuario define límites máximos por categoría. La app rastrea automáticamente."

**Comportamiento:**
- Usuario define solo las categorías principales con un límite máximo.
- No necesita asignar el 100% — sobrantes son "colchón libre".
- Al gastar, se rastrea contra el límite.
- Alertas al llegar a 80% y 100%.

**Para quién:** usuarios que no quieren ceremonia diaria.

### 2.3 Modo 50/30/20
> "50% necesidades, 30% deseos, 20% ahorro/deuda."

**Comportamiento:**
- Sistema auto-clasifica gastos según `categories.money_class` (o `money_class_override` de la transaction).
- Muestra semáforo de las 3 macrocategorías vs. límites del modelo.
- No requiere sub-categorización manual.
- Auto-ajusta ratios: si el usuario configura 60/25/15, se respeta.

**Para quién:** usuarios que quieren simplicidad conceptual.

---

## 3. Casos de uso

### CU-01 — Crear primer presupuesto (wizard 5 pasos)
**Actor:** Usuario que ya tiene ≥1 ingreso registrado.
**Trigger:** Va a `/app/presupuesto` sin budget activo.
**Flujo:**
1. **Paso 1 — Elegir modo**: 3 tarjetas explicativas (Zero-based / Flexible / 50-30-20). Usuario elige.
2. **Paso 2 — Neto detecta ingreso**: sistema calcula `total_income_expected` = ingresos recurrentes activos + promedio 3 meses de ingresos variables.
3. **Paso 3 — Neto propone distribución**: basada en historial de gastos por categoría últimos 3 meses. Muestra propuesta editable.
4. **Paso 4 — Usuario ajusta**: sliders o inputs por categoría. Muestra "Disponible: $X" en tiempo real.
5. **Paso 5 — Confirmar y activar**: valida (zero-based requiere `unallocated = 0`), crea `budgets` + `budget_categories`, activa alertas.

**Postcondición:** Presupuesto activo. Gastos en MOD-04 empiezan a rastrearse contra él.

### CU-02 — Rastrear gasto en tiempo real
**Actor:** Usuario captura gasto de $30 en "Restaurantes".
**Flujo:**
1. MOD-04 crea `transaction` con `category_id = <Restaurantes>`.
2. Trigger `update_budget_spent()` actualiza `budget_categories.spent_amount` de la categoría "Alimentación → Restaurantes" del budget activo.
3. Generated column `available_amount` y `status` se recalculan.
4. Si cruza `warning_threshold` (default 80%): dispara `alerts` + notification.
5. Dashboard y MOD-03 reflejan al instante (Supabase Realtime).

### CU-03 — Ver ejecución del presupuesto
**Actor:** Usuario en `/app/presupuesto`.
**Vista:**
```
Junio 2026 · Modo Flexible
Ingreso esperado: $1,800.00
Asignado:         $1,600.00
Sobrante:         $  200.00 (colchón)
Ejecutado:        $  980.00 (61%)  🟢

Días:  20/30                Promedio necesario/día: $27.30

━━━ Categorías ━━━━━━━━━━━━━━━━━━━━━
🏠 Vivienda          $480 / $500  ▓▓▓▓▓▓▓▓▓░  96%  🟡
🛒 Alimentación      $210 / $300  ▓▓▓▓▓▓▓░░░  70%  🟢
🚗 Transporte        $ 80 / $150  ▓▓▓▓▓░░░░░  53%  🟢
❤️ Salud             $ 30 / $ 80  ▓▓▓░░░░░░░  38%  🟢
🎉 Entretenimiento   $150 / $100  ▓▓▓▓▓▓▓▓▓▓▓ 150%  🔴 sobregirado
💰 Ahorro            $ 30 / $200  ▓░░░░░░░░░  15%  🟢
```

### CU-04 — Alerta al cruzar umbral
**Trigger:** transaction hace que `budget_categories.spent_amount / (allocated + rollover) ≥ warning_threshold`.
**Flujo:**
1. Trigger BD detecta cruce.
2. Inserta en `alerts` con `kind = 'budget_threshold'`, prioridad según:
   - 80%: info
   - 100%: warning
   - >100%: critical
3. Crea `notification` con `in_app` (siempre) + canales según preferencias del usuario.
4. Neto puede generar insight: "Restaurantes lleva 89% con 10 días del mes por delante. Necesitas gastar <$3/día para no sobregirar."

### CU-05 — Cierre de mes con rollover
**Trigger:** `pg_cron` primer día del mes 3am UTC.
**Flujo:**
1. Para cada `budget` con `period_end = ayer`:
   - Marca `is_locked = true`.
   - Calcula sobrantes y sobregiros por categoría.
   - Crea NUEVO budget para nuevo mes con misma configuración.
   - Aplica rollover:
     - Si `budgets.rollover_unspent = true`: sobrante de categoría X pasa como `rollover_amount` positivo en nueva línea.
     - Si `budgets.rollover_overspent = true` (default): sobregiro de categoría X se resta al mes nuevo (`rollover_amount` negativo).
2. Neto insight: "Julio arrancó. Tu presupuesto de junio quedó en 96% ejecutado. Excelente."

### CU-06 — Cambiar modo de presupuesto
**Actor:** Usuario quiere pasar de Flexible a Zero-based.
**Flujo:**
1. `/app/presupuesto` → "Cambiar modo".
2. Warning: "Tu presupuesto actual se cierra y se crea uno nuevo. ¿Continuar?"
3. Cierra el actual (`is_locked = true`).
4. Corre wizard de creación con el nuevo modo.
5. Historial se preserva; reportes muestran ambos modos en su periodo.

### CU-07 — Presupuesto colaborativo (Fase 3 completo, MVP persistencia)
**Actor:** Pareja quiere presupuesto conjunto.
**Flujo:**
1. En MOD-11 (Fase 3): crea `collab_space` con la pareja.
2. En MOD-03: crea budget con `collab_space_id = <space>`.
3. Ambos users ven y editan el mismo budget (RLS lo permite).
4. Realtime sincroniza cambios.

**Status MVP:** el schema soporta `collab_space_id`. UI de creación permite marcar "compartido" pero solo funciona con 1 dueño hasta MOD-11 (Fase 3).

### CU-08 — Vista modo 50/30/20
**Vista:**
```
Junio 2026 · Modo 50/30/20
Ingreso: $1,800

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50% Necesidades      $  680 / $ 900   🟢 75%
30% Deseos           $  480 / $ 540   🟡 89%
20% Ahorro/Deuda     $   30 / $ 360   🔴  8%  necesita atención
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 Neto: "Vas bien en necesidades y deseos, pero tu meta
de 20% en ahorro está muy atrás. Considera revisar
tus gastos discrecionales del resto del mes."
```

### CU-09 — Sugerencia de distribución con Neto
**Actor:** Usuario en paso 3 del wizard, presupuesto en modo Zero-based.
**Flujo:**
1. Sistema consulta historial últimos 3 meses agrupado por categoría.
2. Llama Edge Function `budget-suggest` con contexto: ingreso, historial, modo elegido.
3. Gemini Flash-Lite genera sugerencia: `{allocations: [{category_id, amount, reasoning}], warnings: [...]}`.
4. UI muestra sugerencia editable con explicación de cada asignación.
5. Usuario acepta/ajusta.

**Costo:** ~$0.0002 por cálculo (solo se llama al crear budget mensual).

### CU-10 — Ajuste dinámico durante el mes
**Actor:** Usuario a mitad de mes se da cuenta que la categoría "Entretenimiento" quedó corta.
**Flujo:**
1. Detalle del budget → categoría "Entretenimiento" → "Ajustar límite".
2. Sistema pide de dónde mover el dinero (si zero-based) o simplemente aumenta el límite (flexible/50-30-20).
3. Actualiza `allocated_amount` de las categorías involucradas.
4. Registra ajuste en histórico del budget (opcional metadata JSONB).

### CU-11 — Comparativa mes actual vs. anteriores
**Vista en `/app/presupuesto/historia`:**
- Tabla de meses cerrados con columnas: Ingreso · Presupuesto · Ejecutado · %.
- Tap en mes → detalle completo del budget de ese mes.
- Gráfica de tendencia: % ejecución mes a mes.

### CU-12 — Presupuesto para categoría personalizada
**Actor:** Usuario creó categoría custom "Mascota".
**Flujo:**
1. Al crear/editar budget, puede agregar cualquier categoría no-archivada (sistema o custom).
2. La categoría custom aparece en presupuesto normal.
3. `money_class` de la categoría define en cuál de los 3 buckets 50/30/20 cae.

---

## 4. Modelo de datos

### 4.1 `budgets` (ya definida migración 13)

Campos clave:
- `period_start`, `period_end` — típicamente día 1 y último del mes
- `mode` — enum
- `total_income_expected`, `total_allocated`, `total_spent`
- `unallocated` (generated)
- `is_locked` — cierra al finalizar
- `rollover_unspent`, `rollover_overspent`
- `collab_space_id` — opcional

### 4.2 `budget_categories` (ya definida migración 13)

Una fila por (`budget_id`, `category_id`):
- `allocated_amount`, `spent_amount`, `rollover_amount`
- `available_amount` (generated) = `allocated + rollover - spent`
- `warning_threshold` (default 80%)
- `status` (generated) = `on_track` / `warning` / `over`

### 4.3 Reglas de integridad

- `budgets.unique(user_id, period_start, collab_space_id)` — un budget por usuario/mes/espacio.
- `budget_categories.unique(budget_id, category_id)` — no duplicar categoría en un budget.
- Si `mode = 'zero_based'` y `is_locked = false`, `unallocated` debe ser 0 para activar. Enforced en app, no BD.
- No se puede editar `budgets` con `is_locked = true` (solo backend service_role puede desbloquear).

---

## 5. Reglas de negocio

### 5.1 Trigger de rastreo `update_budget_spent`

```sql
create or replace function update_budget_spent()
returns trigger language plpgsql as $$
declare
  v_budget_id uuid;
  v_delta numeric(15,2);
begin
  -- Solo aplican estas kinds al presupuesto
  if TG_OP = 'INSERT' and new.kind not in ('expense', 'cc_charge', 'refund') then
    return new;
  end if;

  -- Encontrar budget activo para este user + fecha
  select id into v_budget_id
    from public.budgets
   where user_id = new.user_id
     and new.transaction_date between period_start and period_end
     and is_locked = false
   limit 1;

  if v_budget_id is null then return new; end if;

  -- Calcular delta según kind
  v_delta := case new.kind
    when 'expense'   then new.amount_base
    when 'cc_charge' then new.amount_base
    when 'refund'    then -new.amount_base
    else 0
  end;

  -- Aplicar a budget_categories
  update public.budget_categories
     set spent_amount = spent_amount + v_delta
   where budget_id = v_budget_id
     and category_id = coalesce(new.category_id, new.ai_category_id);

  return new;
end;
$$;
```

Aplicar en `transactions` AFTER INSERT/UPDATE/DELETE.

**Notas:**
- `fee` e `interest_paid` NO afectan presupuesto (costos operativos).
- `refund` revierte proporcionalmente al `spent_amount`.
- `money_class_override` NO afecta el budget de la categoría, solo los reportes 50/30/20.

### 5.2 Cálculo de estados

Ya definido como `generated column`:
```sql
status = case
  when spent / (allocated + rollover) >= 1.0 then 'over'
  when spent / (allocated + rollover) >= warning_threshold/100.0 then 'warning'
  else 'on_track'
end
```

### 5.3 Rollover al inicio de mes

Función `close_and_rollover_budget(p_budget_id)`:
1. Marca `is_locked = true`.
2. Crea nuevo `budget` para próximo mes con misma configuración.
3. Para cada `budget_categories` del viejo:
   - `available = allocated + rollover - spent`
   - Si `available > 0 and rollover_unspent`: nueva línea con `rollover_amount = +available`.
   - Si `available < 0 and rollover_overspent`: nueva línea con `rollover_amount = -|available|` (deuda contra el próximo mes).
   - Sino: nueva línea con `rollover_amount = 0`.
4. Recalcula `total_allocated`, `unallocated` del nuevo budget.

Job `pg_cron` mensual día 1 corre esto para todos los budgets activos.

### 5.4 KPIs en tiempo real

Los 10 KPIs del doc maestro, calculados desde vista `v_budget_kpis`:

| # | KPI | Fórmula |
|---|---|---|
| 1 | % Ejecución Global | `total_spent / total_allocated * 100` |
| 2 | Días Transcurridos | `(current_date - period_start) / (period_end - period_start) * 100` |
| 3 | Ritmo diario ejecutado | `total_spent / dias_transcurridos` |
| 4 | Ritmo diario necesario | `(total_allocated - total_spent) / dias_restantes` |
| 5 | Categorías en verde | `COUNT WHERE status = 'on_track'` |
| 6 | Categorías en amarillo | `COUNT WHERE status = 'warning'` |
| 7 | Categorías en rojo | `COUNT WHERE status = 'over'` |
| 8 | Sobrante/Sobregiro proyectado | `total_allocated - (ritmo_actual * dias_totales)` |
| 9 | Ratio 50/30/20 real | Suma por `money_class` (con override) |
| 10 | Diferencial vs. mes anterior | `%exec_actual - %exec_mismo_dia_mes_anterior` |

### 5.5 Sugerencia de distribución Neto

**Prompt template (Gemini Flash-Lite):**
```
Eres un asesor de presupuesto para un usuario en El Salvador.
Modo elegido: {mode}
Ingreso mensual esperado: ${income} USD
Historial últimos 3 meses (categoría, promedio, min, max):
{history_json}

REGLAS:
- Zero-based: la suma debe ser EXACTAMENTE el ingreso.
- Flexible: puedes dejar 10-20% sin asignar.
- 50/30/20: respeta las proporciones ± 5%.
- Prioriza: ahorro ≥ 10%, vivienda, alimentación, salud.
- Nunca asignes 0 a una categoría con gasto histórico.

Responde JSON:
{
  "allocations": [{"category_id": "uuid", "amount": number, "reasoning": "string"}],
  "warnings": ["string"],
  "confidence": 0.0-1.0
}
```

Costo: ~$0.0002 por llamada. Solo se ejecuta al crear budget mensual.

---

## 6. API / Endpoints

| # | Tipo | Path | Descripción |
|---|---|---|---|
| 1 | Supabase client | `budgets` CRUD | Con RLS |
| 2 | Edge Function POST | `/functions/v1/budget-create` | Crea budget + budget_categories atómico |
| 3 | Edge Function POST | `/functions/v1/budget-suggest` | Neto sugiere distribución |
| 4 | Edge Function POST | `/functions/v1/budget-close-rollover` | Cierra + rollover (llamado por cron y manual) |
| 5 | Edge Function POST | `/functions/v1/budget-adjust-category` | Ajusta límite de una categoría |
| 6 | Edge Function GET | `/functions/v1/budget-kpis` | Retorna los 10 KPIs |
| 7 | Edge Function GET | `/functions/v1/budget-history` | Meses cerrados con métricas |

### 6.1 Schema request: `budget-create`
```typescript
POST /functions/v1/budget-create
Body:
{
  period_start: string,             // YYYY-MM-DD
  period_end: string,
  mode: 'zero_based' | 'flexible' | '50_30_20',
  currency?: string,                // default users.currency_default
  total_income_expected: number,
  categories: Array<{
    category_id: string,
    allocated_amount: number,
    warning_threshold?: number
  }>,
  rollover_unspent?: boolean,
  rollover_overspent?: boolean,
  collab_space_id?: string
}

Response 201:
{
  budget: Budget,
  budget_categories: BudgetCategory[]
}

Response 422:
{ error: 'zero_based_must_balance', unallocated: 45.30 }
```

---

## 7. UI / UX

### 7.1 Pantallas
1. **Overview** (`/app/presupuesto`) — vista principal del budget activo.
2. **Wizard nuevo/edit** — 5 pasos.
3. **Historia** (`/app/presupuesto/historia`) — meses pasados con comparativas.
4. **Reportes** — `/app/presupuesto/reportes`.

### 7.2 Overview layout
```
Junio 2026 · Modo Flexible                    ⋯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$980 / $1,600  gastados (61%)         🟢
Día 20/30                              ▓▓▓▓▓▓▓░░░

┌─ KPIs rápidos ─────────────────────┐
│ Sobrante proyectado: +$120         │
│ Ritmo diario:  $49  (necesitas $62)│
│ Categorías: 4 verdes · 1 🟡 · 1 🔴 │
└────────────────────────────────────┘

▼ Todas las categorías (expandible)
```

### 7.3 Wizard paso 3 (Neto sugiere)
```
Neto analizó tus últimos 3 meses. Esta es una sugerencia:

🏠 Vivienda           $500  ← "Consistente, mismo alquiler"
🛒 Alimentación       $300  ← "Promedio +5% inflación"
🚗 Transporte         $150  ← "Reducido, no viajes recientes"
❤️ Salud              $ 80
📚 Educación          $ 60
🎉 Entretenimiento    $100  ← "Baja vs $150 típico"
👕 Ropa               $ 50
💰 Ahorro             $200  ← "10% ingreso, mínimo saludable"

Asignado: $1,440  ·  Disponible: $360 (colchón)
[ Aceptar ] [ Editar ] [ Empezar de cero ]
```

### 7.4 Alerta visual en el mes
- Progreso barrado con colores por categoría.
- Toast al cruzar 80%, 100%, sobregiro.
- Badge rojo en el ícono del menú si hay categorías 🔴.

### 7.5 Estados vacíos
- Sin ingresos: "Primero registra un ingreso para poder crear tu presupuesto."
- Sin budget activo: "¿Empezamos tu presupuesto de <mes actual>?"
- Budget archivado: mostrar próximo mes upcoming.

### 7.6 Confirmaciones críticas
- Cambiar de modo: warning claro.
- Eliminar/cerrar budget activo: bloqueado. Solo cerrar automáticamente al fin de mes.
- Cambiar `total_income_expected` con budget activo: re-valida zero-based.

---

## 8. Reportes del módulo

### MVP (5 reportes)
1. **% Ejecución global histórica** — line chart 12 meses.
2. **Categorías top de gasto** — bar por mes actual.
3. **Distribución 50/30/20 real vs. objetivo** — semáforo.
4. **Variación mensual por categoría** — heatmap (categoría x mes).
5. **Sobregiro histórico** — categorías más problemáticas.

### Fase 2
- Análisis de estacionalidad
- Forecast próximo mes
- Comparativa vs. usuarios similares (benchmark)

---

## 9. RLS

Ya definido en migración 13:
```sql
create policy "budgets_owner_or_collab" on public.budgets
  for all
  using (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  ) with check (...);

create policy "bc_via_budget" on public.budget_categories
  for all using (exists (
    select 1 from public.budgets b where b.id = budget_id
      and (b.user_id = auth.uid() or (b.collab_space_id is not null and public.is_collab_member(b.collab_space_id)))
  ));
```

Realtime: canal por `budget_id` para colaborativo, filtrado por RLS.

---

## 10. Validaciones

| Campo | Regla |
|---|---|
| `period_start` | Primer día del mes típicamente; pero flexible |
| `period_end` | `> period_start`, mismo mes preferido |
| `mode` | enum válido |
| `total_income_expected` | > 0 |
| `total_allocated` | ≥ 0, para zero_based debe ser = `total_income_expected` |
| `budget_categories.allocated_amount` | ≥ 0 |
| `warning_threshold` | 0-100 |
| `collab_space_id` | User debe ser member active |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| Gasto retroactivo (fecha anterior al budget actual) | Aplica al budget del periodo correspondiente (si existe y no `is_locked`) |
| Gasto sin categoría (`category_id NULL`) | No afecta ningún budget_categories; se acumula "sin categorizar" |
| Categoría archivada durante el mes | Budget mantiene la línea; se puede consumir; UI muestra badge "archivada" |
| Cambio de `warning_threshold` con gasto ya en la línea | Recalcula `status` inmediatamente |
| Zero-based con `unallocated > 0` en día 1 | Warning "Faltan $X por asignar"; no bloquea uso |
| Ingreso extra no esperado | No afecta budget automáticamente; usuario puede editarlo |
| Múltiples budgets del mismo mes | Bloqueado por UNIQUE constraint |
| Budget con collab_space y user sale del space | Su acceso RLS se corta; budget sigue existiendo |
| Rollover positivo enorme (categoría se subutilizó $500) | Se rollover completo; usuario puede editar en nuevo mes |
| Rollover negativo grande (sobregiro $200) | Se aplica; nuevo mes empieza con deuda; UI resalta |
| Cambio de FX durante el mes con gastos en otras monedas | `spent_amount` almacena `amount_base` original; no se recalcula si FX cambia |

---

## 12. Plan de tests

### 12.1 Unit
- `validateZeroBased(allocations, income)` → suma exacta
- `calculateDailyPace(spent, days_elapsed, days_total)`
- `computeStatus(spent, allocated, rollover, threshold)`
- `calculate503020(transactions_by_class)` con override
- Zod schemas

### 12.2 Integration
- Crear budget zero-based con validación
- Trigger `update_budget_spent` con:
  - expense normal → spent sube
  - cc_charge → spent sube
  - refund → spent baja
  - Con `category_id` NULL → no afecta
  - Con transaction fuera del periodo → no afecta
- Rollover mensual: sobrante positivo, sobrante negativo
- Neto suggest con historial → JSON estructurado válido
- RLS entre users y en colab_space

### 12.3 E2E
- Wizard 5 pasos zero-based con Neto suggest → crea budget
- Capturar gasto → dashboard refleja
- Cruzar 80% → alert aparece
- Cruzar 100% → status over
- Cambio de mes → rollover aplicado correctamente
- Modo flexible → categoría sin límite explícito no bloquea

### 12.4 Performance
- KPIs endpoint responde <200ms P95
- 50 categorías en budget → smooth UI

---

## 13. Telemetría

### 13.1 Eventos
- `budget_created` props: `mode`, `income_band`, `categories_count`, `used_finn_suggestion`
- `budget_category_over_threshold` props: `threshold`, `days_into_month`
- `budget_rollover_applied` props: `unspent_total`, `overspent_total`
- `budget_mode_changed` props: `from`, `to`
- `budget_finn_suggestion_accepted` / `_edited`
- `budget_kpi_viewed`

### 13.2 KPIs
- % usuarios activos con budget: ≥70%
- % ejecución global mediana: entre 85-100% (ni subutilizado ni sobregirado)
- % que usa Zero-based: ~15%, Flexible ~65%, 50/30/20 ~20% (esperado)
- % de alertas que resultan en acción del usuario: ≥40%

---

## 14. Out of scope (MVP)

- ❌ Presupuesto anual/trimestral (Fase 2)
- ❌ Plantillas guardadas (Fase 2)
- ❌ ML avanzado de sugerencia (Fase 2)
- ❌ Presupuesto por proyecto/viaje (Fase 2 con MOD-18)
- ❌ Benchmark vs otros usuarios (Fase 3)
- ❌ Sub-presupuestos (por miembro de familia) — se hace vía collab_space (Fase 3)
- ❌ Notificaciones de "hoy tu presupuesto es $X" cada mañana (Fase 2)
- ❌ Auto-ajuste inteligente cuando cambia el ingreso (Fase 2)

---

## 15. Dependencias

### 15.1 Bloqueadores
- ✅ Schema migración 13 aplicada
- ⏳ MOD-00 Ingresos activo (para `total_income_expected`)
- ⏳ MOD-02 Cuentas activo (para tener gastos rastreables)
- ⏳ MOD-04 Gastos activo (source del `spent_amount`)
- ⏳ Categorías sistema seed (✅ migración 5)
- ⏳ pg_cron habilitado (rollover mensual)

### 15.2 Orden recomendado
1. Zod schemas + `budget-create` Edge Function
2. Trigger `update_budget_spent` + tests
3. UI wizard 5 pasos (sin Neto suggest todavía)
4. UI overview + KPIs base
5. Integración Neto suggest (Gemini)
6. Cierre + rollover automático
7. Alertas y notificaciones
8. Vista modo 50/30/20 con money_class_override
9. Vista modo Zero-based (más estricta)
10. Modo colaborativo básico (RLS + realtime)
11. 5 reportes MVP
12. Tests

### 15.3 Estimación
- Schemas y RPC: 1.5 días
- Trigger update_budget_spent + tests: 1 día
- UI wizard: 3 días
- UI overview + KPIs: 2 días
- Neto suggest: 1 día
- Rollover automático: 1 día
- Alertas: 1 día
- Vistas por modo (50/30/20, zero-based specifics): 2 días
- Reportes: 1.5 días
- Realtime colab: 1 día
- Tests: 2 días
- **Total estimado:** ~17 días (~3.5 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Categorías sin límite en Flexible | ✅ `allocated=0` = sin semáforo pero cuenta | Trigger ignora si `allocated + rollover = 0` |
| 2 | Rollover overspent default | ✅ `true` | Configurable en settings del budget |
| 3 | Colab en MVP | ✅ Schema sí, UI en MOD-11 | Presupuestos personales hasta Fase 3 |
| 4 | Split y budget | ✅ Sumar hijas | Trigger usa `category_id` de cada hija |
| 5 | Cache Neto suggest | ✅ localStorage 24h TTL | Botón refetch manual disponible |

---

## 17. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ `packages/shared/src/schemas/budget.ts`
- ⏳ `packages/finn/src/prompts/suggest-budget.ts`
- ⏳ Trigger `update_budget_spent` en nueva migración
- ⏳ Función `close_and_rollover_budget(p_budget_id)` en nueva migración
- ⏳ Vista `v_budget_kpis`
- ⏳ Edge Functions: budget-create, budget-suggest, budget-close-rollover, budget-adjust-category, budget-kpis
- ⏳ pg_cron job: monthly-rollover
- ⏳ UI wizard 5 pasos + overview + 3 modos
- ⏳ 5 reportes MVP
- ⏳ Realtime channel por budget_id
- ⏳ Tests unit + integration + 4 E2E

---

## 18. Conexión con otros módulos

| Módulo | Interacción |
|---|---|
| **MOD-00 Ingresos** | Fuente de `total_income_expected` (recurrings + variables promedio) |
| **MOD-04 Gastos** | Cada `expense` / `cc_charge` incrementa `spent_amount`; `refund` lo revierte |
| **MOD-01 Dashboard** | Widget "Semáforo Presupuesto" muestra categorías 🟢🟡🔴 |
| **MOD-15 Tarjetas** | Cargos a tarjeta cuentan como cualquier gasto |
| **MOD-05 Metas (Fase 2)** | Línea "Ahorro" del budget puede vincularse a meta específica |
| **MOD-08 Neto** | Suggest en wizard, alertas de cruce de umbral, insight de fin de mes |
| **MOD-11 Colaborativas (Fase 3)** | Budgets con `collab_space_id` compartidos entre members |
| **MOD-12 Salud financiera (Fase 3)** | Ratio ingreso/gasto viene del budget |
| **MOD-09 Gamificación (Fase 3)** | Logros: mes con presupuesto en verde, racha de meses balanceados |
| **FlowScore** | `budget_adherence_score` viene de % ejecución + días sin sobregiro |
