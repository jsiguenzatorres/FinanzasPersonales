# MOD-15 — Tarjetas de Crédito

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.1, semanas 4-7)
> **Tablas core:** `credit_cards`, `cc_statements`, `transactions`
> **Status:** Módulo con lógica financiera compleja (ciclos, intereses, pagos). Herramienta clave para evitar sobreendeudamiento.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Cálculo de intereses simplificado con banner "Cálculo aproximado"** en cada statement con intereses. Interés simple diario sobre `unpaid`.
2. ✅ **Cuenta espejo del CC en `accounts`: opt-in**. Default OFF.
3. ✅ **FINN pregunta anualidad al detectar fee grande** en tarjeta si el usuario no configuró `annual_fee_month`.
4. ✅ **Meses sin intereses (MSI): ignorar en MVP**. Usuario ajusta `payment_no_interest` manualmente.
5. ✅ **Alertas de utilización alta: evento único al cruzar 60% + recordatorio semanal** si continúa alta.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Gestiona las tarjetas de crédito del usuario: registro, tracking de cargos, cálculo del ciclo de facturación, estados de cuenta mensuales, cálculo del pago óptimo para no generar intereses, alertas de vencimiento, rewards.

### 1.2 Qué NO hace
- No procesa pagos reales (eso lo hace el usuario en su banco; MOD-15 solo registra).
- No genera reportes crediticios (no somos buró de crédito).
- No sugiere qué tarjeta usar en cada compra en MVP (Fase 3: "Marketplace transparente").
- No compara tarjetas del mercado en MVP.

### 1.3 Alcance MVP vs Fase 2/3

| Feature | MVP | Fase 2 | Fase 3 |
|---|---|---|---|
| Registro de tarjeta con datos completos | ✅ | — | — |
| Cargos (via MOD-04 `cc_charge`) | ✅ | — | — |
| Cálculo de ciclo (corte / vencimiento) | ✅ | — | — |
| Estado de cuenta mensual (generación automática) | ✅ | — | — |
| Cálculo de pago sin intereses | ✅ | — | — |
| Cálculo de pago mínimo | ✅ | — | — |
| Alerta de corte próximo | ✅ | — | — |
| Alerta de vencimiento | ✅ | — | — |
| Registrar pago hecho | ✅ | — | — |
| Rewards / puntos / cashback tracking | ✅ básico | Cálculo automático por categoría | Marketplace canjes |
| Multi-tarjeta (varias tarjetas del usuario) | ✅ | — | — |
| Estado de cuenta multi-moneda (tarjetas USD + otra) | ✅ | — | — |
| Import PDF estado de cuenta con Gemini | ❌ | ✅ | — |
| Comparador de tarjetas del mercado | ❌ | ❌ | ✅ |
| Sugerencia de qué tarjeta usar para cada gasto | ❌ | ❌ | ✅ |
| Anualidad automática registrada como gasto | ✅ | — | — |
| Sobregiro / cargos moratorios | ✅ warning | — | — |

---

## 2. Tarjetas soportadas en El Salvador

### 2.1 Bancos emisores preset (autocomplete `bank_name`)
- BAC Credomatic (más común en SV)
- Banco Agrícola
- Banco Cuscatlán
- Davivienda
- Banco Promerica
- Banco Hipotecario
- Banco Azul

### 2.2 Marcas (autocomplete `card_brand`)
- Visa
- MasterCard
- American Express (AmEx)
- Discover
- UnionPay (raro en SV)

### 2.3 Rangos típicos SV
- Tasa CAT anual: 24% - 40%
- Pago mínimo: 5% del saldo o $10 (lo que sea mayor)
- Anualidad: $30 - $150 USD (varía por producto)
- Interés moratorio: adicional al normal (típicamente +5% anual)
- Comisión sobregiro: $10-$25 USD
- Comisión retiro efectivo: 3-5% del monto + $2-$5 fijo

---

## 3. Casos de uso

### CU-01 — Registrar tarjeta de crédito
**Actor:** Usuario con tarjeta Visa BAC.
**Flujo:**
1. Va a `/app/tarjetas`, tap "Agregar tarjeta".
2. Wizard 3 pasos:
   - **Paso 1 — Identificación**: banco (autocomplete), marca (Visa/MC/AmEx), últimos 4 dígitos, titular.
   - **Paso 2 — Términos**: límite de crédito, saldo actual, día de corte (1-31), día de pago (1-31), tasa CAT anual.
   - **Paso 3 — Extras**: color/ícono, programa de recompensas (nombre + tipo: puntos/cashback/millas), saldo actual de rewards, anualidad y mes en que se cobra.
3. Sistema valida:
   - `credit_limit > current_balance` (permitir sobregiro con warning).
   - `payment_due_day > cut_day` (típico): calcula días de gracia.
   - Tasas > 100% → warning "Tasa poco común, verifica".
4. Guarda en `credit_cards`.
5. Opcional: crea cuenta espejo en `accounts` con `type = 'credit_card'` para reportes unificados (default OFF; usuario decide).

**Postcondición:** Tarjeta visible en `/app/tarjetas`; aparece en selector de MOD-04 para `cc_charge`.

### CU-02 — Registrar cargo a tarjeta
Flujo real es en **MOD-04**, pero MOD-15 muestra resultado:
1. Usuario captura gasto con `card_id = <BAC Visa>`.
2. `credit_cards.current_balance += amount`.
3. `credit_cards.utilization_pct` (generated) se actualiza.
4. Aparece en MOD-15 vista de tarjeta bajo "Cargos del ciclo actual".

### CU-03 — Generación automática de estado de cuenta
**Trigger:** `pg_cron` job diario a las 2am UTC verifica tarjetas cuyo `cut_day` fue ayer.
**Flujo:**
1. Para cada `credit_card` activa con `EXTRACT(day FROM current_date - 1) = cut_day`:
   - Determina periodo del ciclo (día siguiente al corte anterior → cut_date actual).
   - Suma `charges`, `payments`, `interest`, `fees` de `transactions` en ese periodo.
   - Calcula `new_balance = previous_balance + charges - payments + interest + fees`.
   - Calcula `minimum_payment = MAX(new_balance * min_payment_pct / 100, 10)`.
   - Calcula `payment_no_interest = new_balance - promociones sin interés`.
   - INSERT en `cc_statements`.
   - Marca transactions del periodo como `status = 'reconciled'`.
2. FINN genera `finn_insight` "Tu tarjeta BAC cortó: $856 de saldo, vence el 5 de julio".

### CU-04 — Ver estado de cuenta actual
**Actor:** Usuario abre detalle de tarjeta.
**Vista:**
```
BAC Visa Platinum · ****1234
─────────────────────────────
Saldo actual:      $1,234.56
Disponible:        $  765.44  (61% límite)
Utilización:       39.16%     🟢 saludable

Ciclo actual (cierra en 5 días)
Cargos:           $  340.00
Pagos:            $  200.00

Último estado (junio)
Saldo:            $  856.00
Vence:            5 julio    ⚠️ 6 días
Para no generar intereses: $856.00
Pago mínimo:      $  42.80
[ Registrar pago ]
```

### CU-05 — Registrar pago a tarjeta
**Actor:** Usuario acaba de pagar en app del banco.
**Flujo:**
1. En detalle de tarjeta, tap "Registrar pago".
2. Modal: monto, fecha, cuenta origen del pago.
3. Sistema crea `transaction`:
   - `kind = 'cc_payment'` desde `account_id` (baja `accounts.balance`).
   - `card_id = <la tarjeta>` (baja `credit_cards.current_balance`).
4. Si pago cubre `payment_no_interest`: badge verde "Pago total, sin intereses".
5. Si cubre `minimum_payment` pero no total: badge amarillo "Se generarán intereses sobre $X".
6. Si menos que mínimo: badge rojo "Insuficiente, se aplicará cargo moratorio".

### CU-06 — Alerta de corte próximo
**Trigger:** job `detect-alerts` diario detecta tarjetas con `cut_day - today ≤ 3 días`.
**Flujo:**
1. Crea `finn_insight` de prioridad media: "Tu Visa BAC corta en 3 días con $856 acumulados".
2. Notificación in-app (y push si usuario aceptó).
3. Sugerencia: "¿Prefieres esperar al corte o hacer pago adelantado para reducir saldo?"

### CU-07 — Alerta de vencimiento
**Trigger:** job detecta `cc_statements` con `is_paid = false` y `due_date - today ≤ 5 días`.
**Escalada:**
- 5 días antes: prioridad media
- 3 días antes: prioridad alta
- Día del vencimiento: crítica
- Día después: crítica + FINN pregunta "¿Ya pagaste? Regístralo aquí"

### CU-08 — Cargo automático de anualidad
**Trigger:** job mensual verifica `credit_cards` con `annual_fee_month = EXTRACT(month FROM current_date)`.
**Flujo:**
1. Verifica si ya existe transaction de anualidad en el mes actual (evita duplicar).
2. Si no existe, crea `transaction`:
   - `kind = 'fee'`
   - `card_id = <tarjeta>`
   - `amount = credit_cards.annual_fee`
   - `description = 'Anualidad tarjeta <name>'`
   - `category_id = <Finanzas → Comisiones bancarias>`
3. Notifica al usuario.

### CU-09 — Programa de recompensas
**Flujo básico MVP:**
1. En detalle de tarjeta, tab "Recompensas".
2. Muestra: `rewards_balance` actual, tipo (puntos/cashback/millas), programa.
3. Usuario puede ajustar manualmente al recibir estado de cuenta.
4. Historial simple: cada ajuste queda registrado como línea en JSONB `rewards_history` (Fase 2 con tabla dedicada).

**Fase 2**: cálculo automático (1 punto por $1, cashback 1.5%, etc.).

### CU-10 — Múltiples tarjetas con visión unificada
**Actor:** Usuario tiene 3 tarjetas.
**Flujo:**
1. `/app/tarjetas` muestra grid con las 3.
2. Header con métricas agregadas:
   - Deuda total: $2,340
   - Utilización global: 42%
   - Próximo vencimiento: 5 julio (BAC $856)
3. Cada card resumida; tap para detalle.

### CU-11 — Tarjeta cerrada / archivada
**Actor:** Cerró Visa Cuscatlán.
**Flujo:**
1. Detalle → "Cerrar tarjeta".
2. Sistema pregunta: "¿Ya pagaste el saldo completo?"
3. Si sí: `status = 'closed'`, deja de aparecer.
4. Si no: no permite cerrar hasta que `current_balance = 0`.
5. Histórico se conserva; visible en filtro "Mostrar archivadas".

### CU-12 — Tarjeta en moneda distinta a USD
**Actor:** Tiene Visa en MXN por trabajos con cliente México.
**Flujo:**
1. Al crear tarjeta, `currency = 'MXN'`, `credit_limit` en MXN.
2. Cargos entran en MXN, `amount_base` en USD via `fill_amount_base`.
3. Reportes muestran ambos: "$15,600 MXN · ~$780 USD".
4. Pago desde cuenta USD: usuario captura monto MXN pagado + cuenta origen USD; FX se aplica al `cc_payment` transaction.

### CU-13 — Pago parcial y cálculo de intereses
**Escenario:** Usuario tenía saldo $856, pagó solo $200.
**Flujo:**
1. Al día siguiente del `due_date`, job calcula intereses sobre saldo NO cubierto:
   - `unpaid = 856 - 200 = 656`
   - `interest_amount = unpaid * interest_rate_monthly` (aprox mensual del CAT)
   - Crea transaction `kind = 'interest_paid'`, `card_id = <tarjeta>`, `amount = interest_amount`.
   - Aumenta `credit_cards.current_balance`.
2. FINN insight: "Pagaste parcialmente. Se cargó $X en intereses este ciclo. Si pagas $Y antes del próximo corte evitas más."

---

## 4. Modelo de datos

### 4.1 `credit_cards`
Ya definida en migración 8. Campos clave:

| Campo | Uso |
|---|---|
| `bank_name`, `card_name`, `card_brand`, `card_number_mask` | Identificación |
| `credit_limit` | Límite total en `currency` |
| `current_balance` | Saldo utilizado actual |
| `available_credit` (generated) | `credit_limit - current_balance` |
| `utilization_pct` (generated) | `current_balance / credit_limit * 100` |
| `cut_day` | Día del mes (1-31) del corte |
| `payment_due_day` | Día del mes del vencimiento |
| `interest_rate_annual` | CAT anual (decimal, ej. 0.36 = 36%) |
| `interest_rate_monthly` (generated) | `interest_rate_annual / 12` |
| `min_payment_pct` | % del saldo (default 5.00) |
| `annual_fee` | Anualidad (USD o currency) |
| `annual_fee_month` | Mes de cobro (1-12) |
| `rewards_program`, `rewards_balance` | Programa de recompensas |
| `status` | `active` / `closed` / `archived` |

### 4.2 `cc_statements`
Un registro por ciclo mensual:

| Campo | Uso |
|---|---|
| `cut_date`, `due_date` | Fechas clave del ciclo |
| `previous_balance`, `charges`, `payments`, `interest_charged`, `fees_charged`, `new_balance` | Composición del saldo |
| `minimum_payment`, `payment_no_interest` | Guía para el usuario |
| `is_paid`, `paid_at`, `amount_paid` | Estado del pago |
| `statement_pdf_url` | Adjunto opcional |
| `ocr_data` | Fase 2: parsing automático |

### 4.3 Reglas de integridad
- `cut_day BETWEEN 1 AND 31`
- `payment_due_day BETWEEN 1 AND 31`
- `credit_limit ≥ 0`
- `current_balance` puede ser negativo (crédito a favor por pagos adelantados)
- `interest_rate_annual ≥ 0`, warning si > 1.0 (100%)
- `min_payment_pct BETWEEN 0 AND 100`
- Al cerrar (`status = 'closed'`), `current_balance` debe ser 0 (o crédito a favor)

---

## 5. Reglas de negocio

### 5.1 Cálculo del ciclo de facturación

Si `cut_day = 15`:
- Ciclo actual: día 16 del mes anterior → día 15 del mes actual
- Compras del día 16 en adelante caen al siguiente ciclo

**Función SQL helper:**
```sql
create or replace function cc_cycle_range(p_card_id uuid, p_reference date)
returns table (period_start date, period_end date)
language sql stable as $$
  with card as (select cut_day from public.credit_cards where id = p_card_id)
  select
    (make_date(
      extract(year from p_reference)::int,
      extract(month from p_reference)::int,
      (select cut_day from card)
    ) + interval '1 day')::date - interval '1 month' as period_start,
    make_date(
      extract(year from p_reference)::int,
      extract(month from p_reference)::int,
      (select cut_day from card)
    )::date as period_end;
$$;
```

Manejar meses con menos días: si `cut_day = 31`, para febrero usa el último día del mes.

### 5.2 Cálculo de pago sin intereses
**Regla:** el `new_balance` del ciclo cerrado debe pagarse **completo** antes o durante `due_date` para no generar intereses.

**Excepciones (compras a meses sin intereses):** promociones que fraccionan el saldo. En MVP no las modelamos como categoría especial — el usuario captura como cargo normal y ajusta `payment_no_interest` manualmente si tiene planes MSI.

### 5.3 Cálculo de pago mínimo
```
minimum_payment = MAX(new_balance * min_payment_pct / 100, 10.00)
```
Configurable por tarjeta.

### 5.4 Cálculo de intereses (post-vencimiento)
**Función:** `apply_cc_interest(p_card_id, p_statement_id)`:
1. Al día siguiente del `due_date`:
2. Calcula `unpaid = statement.new_balance - statement.amount_paid`.
3. Si `unpaid > 0`:
   - `interest = unpaid * (interest_rate_annual / 365) * days_since_cut`
   - Crea `transaction` con `kind = 'interest_paid'`, `card_id`, `amount = interest`.
   - Aumenta `credit_cards.current_balance`.
   - Actualiza siguiente statement con este cargo.

**Nota:** cálculo simplificado en MVP (interés simple diario sobre saldo no pagado). Bancos reales usan métodos distintos (saldo promedio diario, etc.). Aprobado con imprecisión conocida — bandera "Cálculo aproximado".

### 5.5 Utilización y semáforo
- `utilization_pct < 30%`: 🟢 saludable
- `30% ≤ utilization_pct < 60%`: 🟡 moderado
- `utilization_pct ≥ 60%`: 🔴 alto (impacta score crediticio real)

FlowScore (transversal) usa esto como uno de los componentes.

### 5.6 Programa de recompensas MVP
- Sin cálculo automático — usuario captura `rewards_balance` cuando llega estado de cuenta.
- UI muestra "Última actualización: hace X días" con recordatorio para actualizar.
- Fase 2: reglas por categoría (ej. "cashback 3% en supermercados") calculan automáticamente.

---

## 6. API / Endpoints

| # | Tipo | Path / Función | Descripción |
|---|---|---|---|
| 1 | Supabase client | `from('credit_cards').select()` | Listar (RLS) |
| 2 | Edge Function POST | `/functions/v1/cc-create` | Crear tarjeta + validaciones |
| 3 | Supabase client | `from('credit_cards').update()` | Editar (excepto currency si tiene tx) |
| 4 | Edge Function POST | `/functions/v1/cc-register-payment` | Registrar pago a tarjeta |
| 5 | Edge Function POST | `/functions/v1/cc-generate-statement` | Manual + trigger por cron |
| 6 | Edge Function POST | `/functions/v1/cc-update-rewards` | Ajustar balance de puntos |
| 7 | Edge Function POST | `/functions/v1/cc-close` | Cerrar tarjeta (valida saldo=0) |
| 8 | Edge Function GET | `/functions/v1/cc-current-cycle` | Cargos del ciclo activo |
| 9 | Edge Function GET | `/functions/v1/cc-projections` | Proyecta saldo al próximo corte |

### 6.1 Schema request: `cc-register-payment`

```typescript
POST /functions/v1/cc-register-payment
Body:
{
  card_id: string,
  amount: number,
  payment_date: string,        // YYYY-MM-DD
  from_account_id: string,     // cuenta origen del pago
  statement_id?: string,       // opcional; si NULL, aplica al ciclo abierto
  notes?: string
}

Response 201:
{
  cc_payment_transaction: Transaction,
  new_card_balance: number,
  new_account_balance: number,
  statement_status: 'fully_paid' | 'minimum_covered' | 'partial' | 'below_minimum',
  interest_avoided?: number,
  interest_will_generate?: number
}
```

### 6.2 Schema request: `cc-generate-statement`

```typescript
POST /functions/v1/cc-generate-statement
Body:
{
  card_id: string,
  cut_date?: string    // opcional; default: cut_day del mes actual
}

Response 201:
{
  statement: CcStatement,
  transactions_reconciled: number
}
```

---

## 7. UI / UX

### 7.1 Pantallas
1. **Lista tarjetas** (`/app/tarjetas`) — grid + header con métricas agregadas.
2. **Detalle** (`/app/tarjetas/[id]`) — tabs: Resumen · Cargos · Estados · Recompensas · Configuración.
3. **Wizard nueva** — 3 pasos.
4. **Registrar pago** — modal.
5. **Reportes** — `/app/tarjetas/reportes`.

### 7.2 Card en lista
```
┌───────────────────────────────────┐
│ 🟦 BAC Visa Platinum       ⋮     │
│ ****1234 · Visa                   │
│                                   │
│ Deuda:      $1,234.56             │
│ Disponible: $  765.44             │
│ ▓▓▓▓░░░░░░ 62% utilización  🟡    │
│                                   │
│ Corte: 15 (5 días)                │
│ Vence: 5 julio                    │
└───────────────────────────────────┘
```

### 7.3 Detalle · tab Resumen
- Utilización con anillo de progreso
- Ciclo actual (días restantes)
- Próximo vencimiento con countdown
- Botón grande "Registrar pago"
- Insights de FINN si aplican

### 7.4 Detalle · tab Cargos
- Timeline de `transactions` con `card_id = <card>` del ciclo actual.
- Filtro por ciclo pasado.
- Suma agregada al fondo.

### 7.5 Detalle · tab Estados
- Lista de `cc_statements` por fecha.
- Cada uno con badge de estado (Pagado / Parcial / Vencido).
- Tap para expandir composición: previous + charges - payments + interest = new.

### 7.6 Estados vacíos
- Sin tarjetas: "Agrega tu primera tarjeta para trackear cargos y evitar intereses."

### 7.7 Confirmaciones críticas
- Cerrar tarjeta con saldo > 0: bloqueado.
- Cambiar `cut_day` con estados existentes: warning "Los ciclos futuros usarán nuevo día; los históricos no cambian".
- Eliminar tarjeta con transacciones: solo "Archivar", no eliminar.

---

## 8. Reportes del módulo

### MVP (4 reportes)
1. **Deuda total en tarjetas** — histórica 12 meses (line).
2. **Utilización por tarjeta** — bars con umbrales.
3. **Intereses pagados por año** — bar mensual.
4. **Puntos/rewards acumulados** — tabla por tarjeta.

### Fase 2
- Gastos por categoría con tarjeta (para elegir mejor tarjeta por rubro).
- Costo total de crédito (interés + anualidad + comisiones).
- Predicción de cuando saldarás con pago mínimo (deprimente pero útil).

---

## 9. RLS

Ya definido en migración 8:
```sql
create policy "cc_owner" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cc_stmt_owner" on public.cc_statements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Validaciones extra en Edge Functions:
- `cc-register-payment`: valida `card_id` y `from_account_id` pertenecen al user.
- `cc-generate-statement`: solo triggered by cron (service_role) o dueño manual.

---

## 10. Validaciones

| Campo | Regla |
|---|---|
| `bank_name` | NOT NULL, ≤100 chars |
| `card_name` | NOT NULL, ≤100 chars |
| `card_number_mask` | Regex `^[0-9]{0,4}$` |
| `credit_limit` | > 0 |
| `current_balance` | Sin restricción de signo (puede ser negativo) |
| `cut_day` | 1-31 |
| `payment_due_day` | 1-31 |
| `interest_rate_annual` | 0-2.0 (warning si >1.0) |
| `min_payment_pct` | 0-100 |
| `annual_fee` | ≥ 0 |
| `annual_fee_month` | 1-12 |
| `currency` | ISO 4217 en `currencies` |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| `cut_day = 31` en febrero | Usa último día del mes (28 o 29) |
| `payment_due_day < cut_day` | Vencimiento es en el mes siguiente (típico); documentar claramente en UI |
| `payment_due_day = cut_day` | Vencimiento el mismo día — permitido |
| Pago mayor al saldo (crédito a favor) | Permitido; `current_balance` queda negativo, warning "Crédito a favor $X" |
| Cargo que excede el límite | Permitido con warning "Sobregiro"; puede aplicar comisión según tarjeta (usuario captura manual) |
| Statement duplicado (mismo `cut_date`) | UNIQUE constraint bloquea; función `generate_statement` es idempotente |
| Registrar pago sin statement abierto | Aplica al `current_balance` directo sin vincular a statement |
| Tarjeta AmEx (charge card sin límite) | `credit_limit` opcional o valor placeholder; utilization no aplica |
| Tarjeta cerrada con statement no pagado | Statement queda en histórico como impago; se puede pagar después |
| Cambio de `interest_rate_annual` histórico | Solo afecta cálculos futuros; statements pasados mantienen su cálculo |
| Anualidad ya cobrada por banco antes de que la app la detecte | Usuario marca "Ya cobrada" y NO se crea la transaction automática |

---

## 12. Plan de tests

### 12.1 Unit
- `calculateMinimumPayment(balance, pct)`
- `calculateInterestForUnpaid(unpaid, rate, days)`
- `calculateCycleRange(cut_day, reference_date)` con edge cases (feb, cut_day=31)
- `classifyStatementPayment(new_balance, amount_paid, minimum)` → 4 estados
- Zod: `ccCreateSchema`, `ccPaymentSchema`

### 12.2 Integration
- `generate_statement()` con transactions del ciclo → composición correcta
- `cc-register-payment` → afecta ambos balances atómicamente
- Interés aplicado al día siguiente del vencimiento con pago parcial
- Generación automática con cron para tarjetas con corte ayer
- Anualidad auto en mes correspondiente, sin duplicar
- RLS entre usuarios
- Cerrar tarjeta con saldo > 0 → rechazado

### 12.3 E2E
- Registrar tarjeta → capturar cargos en MOD-04 → generar statement manual → registrar pago → statement marcado pagado
- Vencimiento con pago parcial → interés se aplica → nuevo saldo refleja
- Multi-tarjeta: 3 tarjetas → agregado en lista correcto
- Multi-moneda: crear MXN, cargo en MXN, ver conversión USD

### 12.4 Regression
- Corte día 31 en febrero → statement generado correctamente
- Cargos exactamente en `cut_day`: caen al ciclo que cierra ese día
- Pago exacto = `payment_no_interest`: statement pasa a `is_paid = true`, sin intereses

---

## 13. Telemetría

### 13.1 Eventos
- `cc_created` props: `bank_name`, `brand`, `currency`, `credit_limit_band`
- `cc_payment_registered` props: `coverage_pct`, `interest_avoided`, `days_before_due`
- `cc_statement_generated` props: `automatic`, `charges_count`, `new_balance_band`
- `cc_interest_applied` props: `amount`, `unpaid_amount`
- `cc_closed` props: `had_final_balance`
- `cc_alert_shown` props: `alert_kind`, `days_to_event`
- `cc_utilization_alert` props: `utilization_pct`

### 13.2 KPIs
- % usuarios con tarjeta que registran ≥1 pago/mes: ≥70%
- % pagos que cubren `payment_no_interest`: target ≥60%
- % que reciben alerta y pagan dentro de 24h: ≥50%
- Reducción de intereses pagados año a año (para usuarios continuos)

---

## 14. Out of scope (MVP)

- ❌ Import PDF de estado de cuenta con Gemini OCR (Fase 2)
- ❌ Cálculo automático de rewards por categoría (Fase 2)
- ❌ Sugerencia proactiva de qué tarjeta usar por gasto (Fase 3)
- ❌ Marketplace de tarjetas del mercado (Fase 3)
- ❌ Historial de crédito / score simulado
- ❌ Meses sin intereses (MSI) como sub-modelo (usuario captura manual)
- ❌ Cargos moratorios automáticos (usuario captura si aplican)
- ❌ Transferencia de saldo entre tarjetas
- ❌ Retiro de efectivo con comisión modelado (usuario captura como fee)

---

## 15. Dependencias

### 15.1 Bloqueadores
- ✅ Schema migración 8 aplicada
- ⏳ MOD-02 Cuentas (para cuenta origen de pagos)
- ⏳ MOD-04 Gastos (para captura de `cc_charge`)
- ⏳ `pg_cron` habilitado (para statement generation + interest apply)

### 15.2 Orden recomendado
1. Zod schemas y RPCs SQL
2. UI wizard + lista de tarjetas
3. Integración con MOD-04 (selector card_id)
4. Edge Function `cc-register-payment`
5. Edge Function `cc-generate-statement` (manual)
6. Trigger cron automático + tests
7. Cálculo de intereses (post-vencimiento)
8. Anualidad automática
9. UI detalle + tabs
10. Alertas (`alert_rules` + notifications)
11. Rewards básico
12. 4 reportes MVP
13. Tests

### 15.3 Estimación
- Schemas + RPCs: 2 días
- Wizard + lista: 1.5 días
- Integración MOD-04: 0.5 día
- Register payment: 1 día
- Generate statement (manual + cron): 2 días
- Cálculo intereses: 1.5 días
- Anualidad: 0.5 día
- UI detalle: 2 días
- Alertas: 1 día
- Rewards: 0.5 día
- Reportes: 1 día
- Tests: 1.5 días
- **Total estimado:** ~15 días (~3 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Cálculo intereses simplificado | ✅ Interés simple diario + banner | Función `apply_cc_interest` con comentario explícito de aproximación |
| 2 | Cuenta espejo CC | ✅ Opt-in (default OFF) | Toggle en wizard paso 3; crea `accounts` con `type='credit_card'` reflejo |
| 3 | Anualidad FINN preguntando | ✅ Sí | Detecta `fee > $25 USD` sin `annual_fee_month`, sugiere configurar |
| 4 | MSI en MVP | ✅ Ignorar | Usuario ajusta `payment_no_interest` manual; modelar en Fase 2 si emerge |
| 5 | Alertas utilización | ✅ Evento único + recordatorio semanal | 1 alert al cruzar 60%; luego 1 cada 7 días si sigue |

---

## 17. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ `packages/shared/src/schemas/credit-card.ts`
- ⏳ RPCs: `generate_cc_statement()`, `apply_cc_interest()`, `charge_annual_fee()`, `cc_cycle_range()`
- ⏳ Edge Functions (7)
- ⏳ pg_cron jobs: `cc-daily-statements`, `cc-daily-interest`, `cc-monthly-fees`
- ⏳ UI completa (wizard, lista, detalle 5 tabs)
- ⏳ 4 reportes MVP
- ⏳ Integración con `alert_rules` (kinds: `cc_cutoff`, `cc_payment_due`)
- ⏳ Tests unit + integration + 4 E2E
- ⏳ Eventos PostHog activos

---

## 18. Conexión con otros módulos

| Módulo | Interacción |
|---|---|
| **MOD-02 Cuentas** | Pagos a tarjeta salen de una cuenta (`cc_payment` transaction) |
| **MOD-04 Gastos** | Cada `cc_charge` afecta `credit_cards.current_balance` |
| **MOD-01 Dashboard** | Widget de próximo vencimiento + utilización |
| **MOD-03 Presupuesto** | Cargos a tarjeta cuentan hacia el presupuesto de su categoría |
| **MOD-16 Deudas** | Saldo de tarjetas contribuye al ratio deuda/ingreso |
| **MOD-17 Patrimonio** | `current_balance` de tarjetas es pasivo |
| **MOD-08 FINN** | Alertas de corte, vencimiento, utilización alta, intereses inminentes |
| **FlowScore** | `utilization_pct` es componente del score de deuda |
| **MOD-19 Fiscal** | Anualidad podría ser deducible dependiendo del régimen |
| **MOD-11 Colab** | Tarjeta puede tener cargos en `collab_space` (Fase 3) |
