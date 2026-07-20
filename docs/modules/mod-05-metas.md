# MOD-05 — Metas Financieras

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `goals`, `goal_contributions`, `transactions`, `income_entries`, `accounts`
> **Status:** El esqueleto de base de datos ya existe (migraciones `20260630120900` y `20260630121300`) — este módulo es 100% construir la lógica de aplicación sobre tablas ya diseñadas, sin migración nueva salvo el trigger de saldo que falta.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Permite al usuario definir metas de ahorro con un monto objetivo, fecha límite opcional y prioridad — fondo de emergencia, viaje, compra grande, etc. — y llevar el progreso con abonos manuales o automáticos desde sus ingresos. Neto puede opinar sobre viabilidad ("a este ritmo la cumples en 8 meses, te faltan 2 para la fecha que pusiste") y sugerir ajustes.

### 1.2 Qué NO hace (v1)
- No mueve dinero real entre cuentas — es tracking, igual que Préstamos Familiares. `account_id` es solo una referencia informativa ("esta meta vive en mi cuenta de ahorros"), no sincroniza saldo real.
- No crea metas colaborativas (`collab_space_id` existe en el esquema pero MOD-11 Finanzas Colaborativas no está construido — se deja en `null` por ahora, el campo ya está listo para cuando exista).
- No calcula viabilidad con IA en v1 (`ai_feasibility_score`/`ai_recommendation` quedan en el esquema para cuando Neto los use, pero el cálculo no se activa todavía — evita una dependencia nueva para el primer corte).

### 1.3 Alcance v1 (Fase 2) vs. después

| Feature | v1 | Después |
|---|---|---|
| CRUD de metas (crear/editar/pausar/eliminar) | ✅ | — |
| Abono manual a una meta | ✅ | — |
| Retirar dinero de una meta (abono negativo) | ✅ | — |
| Auto-completar `status='completed'` al llegar al monto | ✅ vía trigger | — |
| Aporte automático desde un ingreso confirmado (§3) | ✅ | — |
| Vincular retroactivamente un ingreso ya registrado a una meta | ❌ | ✅ |
| Neto explica viabilidad (`ai_feasibility_score`) | ❌ | ✅ Fase 3 |
| Metas colaborativas (`collab_space_id`) | ❌ | ✅ cuando exista MOD-11 |
| Widget en dashboard | ✅ tarjeta simple | ✅ gráfico de progreso más adelante |

---

## 2. Campos (ya existen, sin cambios de esquema)

### 2.1 Meta (`goals`)
| Campo | Tipo | Notas |
|---|---|---|
| `name` / `description` | text | |
| `type` | enum `goal_type` | `emergency_fund, savings, debt_payoff, purchase, travel, education, retirement, other` |
| `target_amount` / `current_amount` | numeric | `current_amount` se mantiene por trigger, no se edita directo |
| `progress_pct` | numeric | columna generada — `current_amount / target_amount * 100` |
| `currency` | char(3) | default USD |
| `account_id` | uuid → accounts | opcional, solo informativo |
| `target_date` | date | opcional |
| `monthly_contribution` | numeric | meta de aporte mensual — informativo, no obliga nada |
| `auto_contribution_pct` | numeric | % de cada ingreso confirmado que se aporta automáticamente (ver §3) |
| `priority` | smallint | default 5, para ordenar la lista |
| `status` | enum `goal_status` | `active, paused, completed, abandoned` |

### 2.2 Abono (`goal_contributions`)
| Campo | Tipo | Notas |
|---|---|---|
| `goal_id` | uuid → goals | |
| `transaction_id` / `income_entry_id` | uuid, nullable | se llena el que corresponda según origen del abono |
| `amount` | numeric | puede ser negativo (retiro) |
| `currency` / `amount_base` / `fx_rate` | | ya cubiertos por el trigger `amount_base` existente, sin cambios |
| `contribution_date` | date | |
| `source` | text | `'manual'` \| `'auto_income'` — para distinguir en el historial qué abonos puso el usuario a mano vs. cuáles generó el sistema |

---

## 3. Aporte automático desde ingresos — alineado con MOD-00 §CU-04/§4.6

**Corrección sobre la v1.1 de este doc:** la primera versión proponía un trigger de base de datos que actuara solo, en segundo plano, al confirmarse un ingreso. Al construir esto se encontró que `docs/modules/mod-00-ingresos.md` (§CU-04, §4.6) ya tiene un diseño distinto para exactamente esto, con `income_entries.goal_allocation` (JSONB) y `incomeCreateSchema` ya validando la suma — solo nunca se conectó porque Metas no existía. Se prioriza consistencia con lo ya especificado en vez de crear un segundo mecanismo paralelo. El resultado para el usuario es el mismo (aporte automático de verdad, según el % que configuró); cambia el mecanismo:

1. **Cuándo se decide:** en el formulario de "Nuevo ingreso" (`/app/ingresos/nueva`), no en segundo plano. Si el usuario tiene metas activas con `auto_contribution_pct` y marca el ingreso como cobrado (`is_collected=true`), aparece una sección "Distribuir a metas" con montos **sugeridos** (`net_amount * auto_contribution_pct / 100` por meta) que el usuario puede ajustar o poner en 0 antes de guardar — no es una sorpresa después del hecho, es parte del mismo flujo de registrar el ingreso.
2. **Al guardar:** `income_entries.goal_allocation = {goal_id: amount, ...}` (ya validado por `incomeCreateSchema`: la suma no puede exceder `net_amount`) y se crea un `goal_contributions` por cada entrada, con `source='auto_income'`, `income_entry_id` poblado, `contribution_date = income_date`.
3. **Alcance v1:** solo aplica a ingresos que se registran ya cobrados (`is_collected=true`) en el momento de creación. Un ingreso pendiente que luego se confirma, o vincular un ingreso ya existente a una meta después, queda fuera de v1 (ya estaba marcado "❌ v1 / ✅ después" en §1.3).
4. **Transparencia y reversión:** cada aporte automático es una fila normal de `goal_contributions`, visible y eliminable como cualquier otro abono — eliminar el ingreso (`deleteIncomeAction`) debe eliminar también sus `goal_contributions` asociadas (`income_entry_id` coincide) para no dejar saldo huérfano en la meta.

---

## 4. Trigger de saldo (nuevo, único cambio de esquema)

No existe hoy un trigger que mantenga `goals.current_amount` — hay que agregarlo, siguiendo el mismo patrón ya usado en `update_budget_spent()` / `update_budget_spent_for_loan_link()` (revertir efecto de fila vieja en UPDATE/DELETE, aplicar efecto de fila nueva en INSERT/UPDATE):

- `AFTER INSERT/UPDATE/DELETE ON goal_contributions` → recalcula `goals.current_amount` para el `goal_id` afectado.
- Cuando `current_amount >= target_amount` y `status = 'active'` → el mismo trigger pone `status = 'completed'`, `completed_at = now()`. El usuario puede seguir abonando después de completada (no se bloquea), simplemente ya no cambia el status de nuevo.

---

## 5. Decisiones cerradas (2026-07-20)

1. ✅ **Aporte automático "de verdad"** — diseño de §3 tal cual, con el límite de 100% entre metas activas y cada aporte visible/reversible en el historial.
2. ✅ **Tarjeta de dashboard condicional** — mismo patrón que "Préstamos activos": solo aparece si hay al menos una meta activa.
3. ✅ **`get_goals` se agrega en este mismo corte** — mismo patrón que `get_family_loans`.
