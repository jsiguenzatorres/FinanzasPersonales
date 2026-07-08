# MOD-00 — Módulo de Ingresos

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.1, semanas 4-7)
> **Tablas core:** `income_entries`, `recurrings`, `transactions`, `goals`, `tax_records`, `accounts`
> **Status:** Primer módulo del MVP. Fundacional: sin ingresos, ningún otro módulo es preciso.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Cálculo automático ISSS/AFP/ISR para El Salvador en MVP.** Función helper opcional que el usuario invoca con un botón.
2. ✅ **Adjuntar factura DTE: solo PDF en MVP.** XML diferido a Fase 3 si surge demanda.
3. ✅ **OCR de boleta de pago con Gemini: diferido a Fase 2.** En MVP captura manual.
4. ✅ **Sin tope de ingresos no cobrados.** Alerta de FINN a partir de 20 facturas pendientes.
5. ✅ **Fallback manual de FX cuando no hay tasa disponible.** UX simple: "No tenemos FX para esta fecha, ¿usar esta tasa?" con campo numérico.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Captura, almacena, clasifica y proyecta TODOS los ingresos del usuario. Es la fuente única de verdad para presupuesto (MOD-03), metas (MOD-05), patrimonio (MOD-17), fiscal (MOD-19) y simulador.

### 1.2 Qué NO hace
- No procesa pagos (eso es MOD-15 tarjetas, MOD-16 deudas, MOD-19 fiscal).
- No genera facturas — solo permite adjuntar PDF/XML de factura electrónica DTE.
- No declara impuestos — solo marca `is_tax_relevant` y guarda retenciones.
- No predice el ingreso futuro con ML — eso queda para Fase 2 (Prophet). En MVP las "proyecciones" son cálculos deterministas basados en historial.

### 1.3 Alcance MVP vs Fase 2

| Feature | MVP (Sub-fase 1.1) | Fase 2 |
|---|---|---|
| 8 tipos de ingreso | ✅ | — |
| Registro manual | ✅ | — |
| Recurrentes (cron) | ✅ | — |
| Multi-moneda (USD base, FX automático) | ✅ | — |
| Categorización IA con Gemini | ✅ Flash-Lite | Mejorada |
| Adjuntar factura (PDF) | ✅ | — |
| Asignación automática a metas (`goal_allocation`) | ✅ | — |
| 14 reportes del módulo | ✅ 7 críticos | Los otros 7 |
| Predicción ML (Prophet) | ❌ | ✅ |
| Detección de anomalías | ❌ | ✅ |
| Importación CSV/Excel bancario | ❌ | ✅ |
| Open Banking (Belvo) | ❌ | ✅ |

---

## 2. Casos de uso

### CU-01 — Registrar ingreso laboral mensual (nómina)
**Actor:** Usuario con salario fijo.
**Trigger:** Cobró su quincena/mes.
**Precondición:** Tiene al menos 1 cuenta creada (MOD-02).
**Flujo:**
1. Usuario tap "+ Nuevo ingreso" en MOD-00 o desde Dashboard.
2. Selecciona tipo `salary`.
3. Captura: empresa, monto bruto, deducciones (ISSS, AFP, ISR, otros), monto neto, fecha, cuenta destino.
4. (Opcional) Marca "Registrar como recurrente" → genera registro en `recurrings`.
5. (Opcional) Adjunta foto/PDF de boleta de pago → Supabase Storage.
6. Sistema valida, guarda en `income_entries`, crea `transaction` espejo en `transactions` (kind=`income`, monto=neto), actualiza `accounts.balance`.

**Postcondición:** Ingreso aparece en Dashboard, presupuesto del mes ajusta `total_income_expected`, balance de cuenta actualizado, FlowScore recalculado.

### CU-02 — Registrar pago freelance esperado (no cobrado aún)
**Actor:** Freelance con cliente que pagará en N días.
**Flujo:**
1. Crea ingreso tipo `freelance`, marca `is_collected = false`, define `expected_date`.
2. Captura cliente, monto bruto, número de factura, divisa (puede ser USD, MXN, EUR, etc.).
3. Sistema guarda en `income_entries` **sin** crear `transaction` (porque no se ha cobrado).
4. Aparece en Dashboard widget "Por cobrar" y en calendario MOD-20.
5. Cuando cobra: usuario abre el registro y tap "Marcar como cobrado" → crea `transaction`, actualiza saldo.

**Edge case:** Si `expected_date` pasa y sigue `is_collected = false`, FINN genera `finn_insight` con prioridad alta.

### CU-03 — Recibir ingreso en divisa diferente a la base
**Actor:** Freelance que cobra en EUR pero su base es USD.
**Flujo:**
1. Captura monto en EUR.
2. Sistema lee `users.currency_default = 'USD'`.
3. Trigger `fill_amount_base` consulta `fx_rates` con `get_fx_rate('EUR', 'USD', income_date)`.
4. Calcula `amount_base = gross * fx_rate`.
5. Reportes muestran ambos: EUR (original) y USD (consolidado).

**Edge case:** Si no hay FX disponible para la fecha, `amount_base` queda NULL. La app muestra "FX pendiente" y un retry job lo completa al día siguiente.

### CU-04 — Asignar ingreso a metas automáticamente
**Actor:** Usuario con 3 metas activas (fondo emergencia 50%, viaje 30%, libre 20%).
**Flujo:**
1. Al registrar ingreso, abre sección "Distribuir a metas".
2. Sistema sugiere distribución basada en `users.user_settings.auto_contribution_pct` y `goals.auto_contribution_pct`.
3. Usuario ajusta porcentajes o montos.
4. Al guardar, sistema:
   - Guarda `income_entries.goal_allocation = {goal_id: amount}`.
   - Crea `goal_contributions` para cada meta.
   - Crea `transaction` con `kind = 'transfer_out'` desde la cuenta receptora hacia la cuenta vinculada de cada meta (si la tiene), o solo registra contribución virtual.

### CU-05 — Generar ingreso recurrente automático (cron)
**Actor:** Usuario con `recurring` configurado para salario quincenal.
**Trigger:** Job `process-recurrings` corre diario a las 7am UTC.
**Flujo:**
1. Job busca `recurrings WHERE next_run_date = today AND is_active = true AND auto_create = true`.
2. Para cada registro `kind = 'income'`:
   - Crea `income_entries` con datos de la plantilla.
   - Crea `transaction` espejo.
   - Actualiza `accounts.balance`.
   - Calcula y guarda nueva `next_run_date` según `frequency`.
3. Si el usuario configuró `notify_before_days > 0`, genera notificación 1 día antes.

**Edge case:** Si `auto_create = false`, no crea el registro pero genera notificación: "Tu salario está pendiente de registrar".

### CU-06 — Categorización automática con Gemini
**Actor:** Usuario que registra ingreso eventual ("Vendí mi bicicleta en $300").
**Flujo:**
1. Usuario captura monto y descripción libre.
2. Antes de guardar, app llama Edge Function `classify-income` con el texto.
3. Edge Function llama Gemini 2.5 Flash-Lite con prompt:
   ```
   Clasifica este ingreso en uno de los tipos: salary, freelance, rental,
   investment_yield, loan_payment, business, eventual, other.
   Texto: "Vendí mi bicicleta en $300"
   Devuelve JSON: {type, confidence, reasoning}.
   ```
4. Gemini devuelve `{type: "eventual", confidence: 0.95, reasoning: "..."}`.
5. App pre-selecciona ese tipo en el form; usuario confirma o cambia.
6. Si usuario cambia, app envía corrección para mejorar prompt (cache de overrides).

**Costo estimado:** ~$0.0001 por clasificación con Flash-Lite. 1000 ingresos al mes = ~$0.10.

### CU-07 — Marcar ingreso como fiscal relevante
**Actor:** Freelance que factura como contribuyente.
**Flujo:**
1. Al registrar ingreso, marca `is_tax_relevant = true`.
2. Captura `tax_withheld` (retención de ISR si aplica).
3. Adjunta factura DTE (PDF/XML) → Supabase Storage.
4. Sistema crea registro en `tax_records` con `type = 'income_declaration'`, vinculado al `income_entry_id`.
5. En MOD-19 (Fase 3) el usuario verá todos sus ingresos declarables del año fiscal.

### CU-08 — Editar y eliminar ingresos
**Actor:** Usuario que registró un ingreso incorrectamente.
**Flujo editar:**
1. Abre el registro, tap editar.
2. Cambia campos. Si cambia monto o moneda, trigger recalcula `amount_base`.
3. Si tenía `transaction` vinculada, esta se actualiza en cascada (UPDATE en ambas).

**Flujo eliminar:**
1. Tap eliminar → confirma.
2. Soft delete: `income_entries.deleted_at = now()`.
3. Si tenía `transaction` vinculada, también soft delete (`transactions.deleted_at`).
4. Trigger `log_delete_audit` registra el evento en `audit_log`.
5. Usuario puede restaurar desde "Papelera" (30 días).
6. Job `purge-soft-deletes` borra físicamente después de 30 días.

### CU-09 — Ingreso de renta de inmueble (vinculado a MOD-07 Inversiones)
**Actor:** Propietario que renta un inmueble (en Fase 2 cuando MOD-07 esté activo).
**Flujo Fase 2:**
1. Tipo `rental`, selecciona inmueble desde `investments` (type=`real_estate`).
2. Inquilino, monto mensual.
3. Gastos deducibles del inmueble (mantenimiento, predial, agua) — vinculados como `is_tax_deductible` en transacciones futuras.
4. ROI neto = (ingresos − gastos − impuestos) / valor inmueble.

**Status MVP:** captura el ingreso sin vincular a inmueble (campo `source_name` lo describe). El cálculo de ROI llega en Fase 2.

### CU-10 — Abono de préstamo otorgado (vinculado a MOD-13/14)
**Actor:** Usuario que prestó dinero a un familiar (en Fase 2).
**Flujo Fase 2:** Tipo `loan_payment`, selecciona préstamo desde `family_loans` o `loan_portfolio`. El sistema crea `family_loan_payments` o `loan_payments` automáticamente y actualiza balance del préstamo.

**Status MVP:** captura el ingreso libre. La vinculación llega con MOD-13/14.

---

## 3. Modelo de datos

### 3.1 Tabla principal: `income_entries`
Ya definida en `supabase/migrations/20260630121100_income_entries.sql`. Campos clave:

| Campo | Tipo | Uso |
|---|---|---|
| `type` | `income_type` enum | 1 de 8 tipos |
| `source_name` | text | "Empresa X" / "Cliente Y" / "Vendí bici" |
| `gross_amount` | numeric(15,2) | Monto bruto antes de deducciones |
| `net_amount` | numeric(15,2) | Monto neto recibido (gross - deductions) |
| `deductions` | jsonb | `[{name, amount, type:'isss'|'afp'|'isr'|'other'}]` |
| `currency` | char(3) | Moneda del ingreso (puede ser distinta a USD base) |
| `amount_base` | numeric(15,2) | Llenado por trigger; en moneda base del usuario |
| `is_collected` | boolean | Si ya se cobró (false = facturado pendiente) |
| `expected_date` | date | Si no cobrado, fecha esperada |
| `is_tax_relevant` | boolean | Si entra a declaración |
| `tax_withheld` | numeric(15,2) | Retención de ISR |
| `goal_allocation` | jsonb | `{goal_uuid: amount, ...}` |
| `invoice_url` | text | PDF/XML factura DTE en Storage |
| `transaction_id` | uuid | FK a transaction espejo (NULL si no cobrado) |
| `recurring_id` | uuid | FK al template si vino de cron |
| `deleted_at` | timestamptz | Soft delete |

### 3.2 Tablas relacionadas

| Tabla | Relación | Cuándo |
|---|---|---|
| `transactions` | 1-1 vía `income_entries.transaction_id` | Se crea al cobrar (`is_collected = true`) |
| `recurrings` | N-1 vía `income_entries.recurring_id` | Si el ingreso fue generado por cron |
| `accounts` | N-1 vía `income_entries.account_id` | Cuenta donde se depositó |
| `goal_contributions` | 1-N vía `goal_contributions.income_entry_id` | Si hubo `goal_allocation` |
| `tax_records` | 1-N vía `tax_records.income_entry_id` | Si `is_tax_relevant = true` |

### 3.3 Reglas de integridad

- `net_amount <= gross_amount` (constraint en BD)
- `gross_amount >= 0` y `net_amount >= 0` (constraint)
- Si `is_collected = false`, entonces `transaction_id` debe ser NULL.
- Si `currency = users.currency_default`, entonces `fx_rate = 1.0` y `amount_base = net_amount`.
- Si `is_tax_relevant = true`, debe existir al menos un campo de identificación fiscal (issuer_tax_id O invoice_number).
- `goal_allocation` JSONB: la suma de valores no puede exceder `net_amount`.

---

## 4. Reglas de negocio clave

### 4.1 Cálculo bruto → neto

```
deductions[] = [
  {name: "ISSS",  amount: D1, type: "isss"},
  {name: "AFP",   amount: D2, type: "afp"},
  {name: "ISR",   amount: D3, type: "isr"},
  {name: "Otros", amount: D4, type: "other"}
]
net_amount = gross_amount - SUM(deductions[].amount)
```

**Validación:** si el usuario captura `net_amount` directamente, la app calcula `deductions[0] = {name: "Deducciones globales", amount: gross - net, type: "other"}` para mantener consistencia.

### 4.2 Deducciones laborales en El Salvador (helper opcional)
Cuando el usuario captura `type = 'salary'` y país = SV, app ofrece auto-calcular deducciones:

| Concepto | Tasa | Tope mensual (USD) |
|---|---|---|
| ISSS (salud) | 3% del salario | $1,000 |
| AFP (pensión) | 7.25% del salario | $7,471.92 |
| Renta (ISR) | Tabla escalonada DGII | — |

Tabla ISR mensual SV (vigente 2025-2026, **ajustar al desplegar**):
| Tramo (USD) | % | Sobre exceso |
|---|---|---|
| 0 - 472 | 0% | — |
| 472.01 - 895.24 | 10% | + $17.67 |
| 895.25 - 2,038.10 | 20% | + $60.00 |
| 2,038.11+ | 30% | + $288.57 |

**Implementación:** función PL/pgSQL `calculate_sv_payroll_deductions(gross)` opcional. NO se aplica automáticamente — solo es una sugerencia que el usuario acepta o ignora.

### 4.3 Multi-moneda y FX
- Toda captura conserva `currency` y `gross_amount`/`net_amount` en esa moneda.
- Trigger `fill_amount_base` (migración 22) llena `amount_base` automáticamente.
- Si `get_fx_rate()` devuelve NULL, `amount_base = NULL` (UI muestra "FX pendiente").
- Job `sync-fx-rates` corre diario y reintenta cálculos pendientes.

### 4.4 Sincronización con `transactions`
**Cuándo se crea la transaction espejo:**
- `is_collected = true` Y `account_id IS NOT NULL` → crea `transaction`.
- `is_collected = false` → NO crea transaction.

**Datos de la transaction espejo:**
```sql
INSERT INTO transactions (
  user_id, account_id, kind, amount, currency,
  transaction_date, description, capture_source, ...
) VALUES (
  income.user_id,
  income.account_id,
  'income',
  income.net_amount,         -- neto (lo que entra en la cuenta)
  income.currency,
  income.income_date,
  income.source_name,
  CASE income.recurring_id
    WHEN NOT NULL THEN 'recurring'
    ELSE 'manual'
  END,
  ...
);
-- Luego:
UPDATE income_entries SET transaction_id = <new_tx_id> WHERE id = income.id;
```

**Operación atómica:** se hace en una función PL/pgSQL `create_income_entry()` con `BEGIN ... COMMIT`.

### 4.5 Recurrentes
Cuando `is_recurring = true` se crea un registro en `recurrings`:
```sql
INSERT INTO recurrings (
  user_id, account_id, name, kind, amount, currency,
  frequency, start_date, next_run_date, auto_create,
  source_type, source_metadata
) VALUES (
  income.user_id, income.account_id, income.source_name,
  'income', income.net_amount, income.currency,
  <freq>, income.income_date, <next_date>, true,
  'salary' | 'rental' | 'subscription' | ...,
  jsonb_build_object('income_type', income.type, 'gross_amount', income.gross_amount, ...)
);
```

Job `process-recurrings` lee esta plantilla y genera ingresos nuevos.

### 4.6 Asignación a metas
Si `goal_allocation = {"goal-uuid-1": 100, "goal-uuid-2": 50}`:
- App valida: `SUM(values) <= net_amount`.
- Para cada par, crea `goal_contributions` con:
  - `goal_id`, `income_entry_id`, `amount`, `currency`, `contribution_date = income_date`, `source = 'auto_income'`.
- Actualiza `goals.current_amount += amount` (vía trigger o lógica de app).

---

## 5. API / Edge Functions

### 5.1 Convención
- Usar **Supabase client directo** (TypeScript) para CRUD simple desde el front (validado por RLS).
- Usar **Edge Functions** (Deno) solo cuando hay lógica multi-tabla, llamadas externas (Gemini, FX), o validaciones complejas.

### 5.2 Endpoints / RPC del módulo

| # | Tipo | Path / Función | Descripción |
|---|---|---|---|
| 1 | Edge Function POST | `/functions/v1/income-create` | Crea income_entries + transaction espejo + goal_contributions + tax_record (atómico) |
| 2 | Edge Function POST | `/functions/v1/income-mark-collected` | Marca un freelance como cobrado, crea transaction |
| 3 | Edge Function POST | `/functions/v1/income-classify` | Llama Gemini Flash-Lite para sugerir `type` |
| 4 | Supabase client | `from('income_entries').select()` | Listar/filtrar (RLS owner) |
| 5 | Supabase client | `from('income_entries').update()` | Editar campos simples |
| 6 | Edge Function DELETE | `/functions/v1/income-delete` | Soft delete + cascada a transaction + audit |
| 7 | Edge Function POST | `/functions/v1/income-restore` | Restaura desde papelera (30 días) |
| 8 | Edge Function GET | `/functions/v1/income-projections` | Calcula proyecciones 3/6/12 meses (determinista MVP) |
| 9 | Edge Function POST | `/functions/v1/income-import-csv` | (Fase 2) importar CSV bancario |

### 5.3 Schema de request: `income-create`

```typescript
POST /functions/v1/income-create
Authorization: Bearer <user_jwt>
Body:
{
  type: 'salary' | 'freelance' | 'rental' | ...,
  source_name: string,
  gross_amount: number,
  net_amount: number,
  deductions?: Array<{name: string, amount: number, type: string}>,
  currency: string,                        // ISO 4217
  income_date: string,                     // ISO date
  account_id: string,                      // uuid
  is_collected: boolean,
  expected_date?: string,
  invoice_number?: string,
  invoice_file?: string,                   // upload path en Storage
  is_tax_relevant?: boolean,
  tax_withheld?: number,
  is_recurring?: boolean,
  recurrence?: {
    frequency: 'monthly' | 'biweekly' | ...,
    day_of_month?: number,
    end_date?: string
  },
  goal_allocation?: Record<string, number>, // {goal_id: amount}
  notes?: string,
  tags?: string[]
}

Response 201:
{
  income_entry: IncomeEntry,
  transaction?: Transaction,     // si is_collected = true
  recurring?: Recurring,         // si is_recurring = true
  goal_contributions?: GoalContribution[],
  tax_record?: TaxRecord
}

Response 400: validación
Response 401: no autorizado
Response 422: regla de negocio violada
```

### 5.4 Implementación de `income-create` (pseudocódigo)
```typescript
// supabase/functions/income-create/index.ts
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(/* service_role para transacción */);
  const body = await req.json();
  const user = await getUser(req);

  // Validaciones
  if (body.net_amount > body.gross_amount) return err(422, 'net > gross');
  if (body.goal_allocation && sum(body.goal_allocation) > body.net_amount)
    return err(422, 'goal_allocation excede neto');

  // Comenzar transacción PL/pgSQL
  const { data, error } = await supabase.rpc('create_income_entry', {
    p_user_id: user.id,
    p_payload: body
  });

  if (error) return err(500, error.message);
  return ok(201, data);
});
```

Función SQL `create_income_entry` hace:
1. INSERT income_entries
2. Si `is_collected`: INSERT transactions + UPDATE accounts.balance
3. Si `is_recurring`: INSERT recurrings
4. Si `goal_allocation`: INSERT goal_contributions + UPDATE goals.current_amount
5. Si `is_tax_relevant`: INSERT tax_records
6. RETURN JSON con todos los registros creados

---

## 6. UI / UX

### 6.1 Pantallas del módulo
1. **Lista de ingresos** (`/app/ingresos`) — tabla/cards con filtros por tipo, fecha, estado (cobrado/pendiente).
2. **Detalle de ingreso** (`/app/ingresos/[id]`) — vista completa con timeline, asignaciones a metas, transacción vinculada.
3. **Formulario nuevo/editar** (`/app/ingresos/nuevo`) — wizard de 3 pasos (Tipo + Monto · Fecha + Cuenta · Avanzado).
4. **Recurrentes** (`/app/ingresos/recurrentes`) — gestión de plantillas.
5. **Pendientes de cobro** (`/app/ingresos/pendientes`) — solo `is_collected = false`.
6. **Reportes** (`/app/ingresos/reportes`) — 14 reportes.

### 6.2 Formulario nuevo ingreso — wizard 3 pasos

**Paso 1: Tipo y monto**
- 8 chips de tipo (con íconos)
- Campo "Describe brevemente" (opcional) → si se llena, llama Gemini para sugerir tipo
- Bruto y Neto (con switch "Solo neto" si no aplica desglose)
- Si `salary` + país SV → botón "Calcular deducciones SV" auto-rellena ISSS/AFP/ISR
- Moneda (default `users.currency_default`)

**Paso 2: Fecha y cuenta**
- Date picker (default hoy)
- Switch "Ya lo cobré" (default ON)
- Si OFF: muestra `expected_date`
- Selector de cuenta destino (solo cuentas activas del usuario)

**Paso 3: Avanzado (colapsado por defecto)**
- Recurrente: switch + frecuencia
- Es fiscal: switch + retención + adjuntar factura
- Asignar a metas: lista de metas activas con sliders
- Notas y tags

**Botón guardar:** muestra "Resumen" antes de confirmar.

### 6.3 Componentes shadcn/ui requeridos
- `<Card>`, `<Button>`, `<Input>`, `<Select>`, `<Tabs>`, `<Sheet>` (drawer móvil), `<Dialog>`, `<DatePicker>`, `<Slider>`, `<Switch>`, `<Badge>`, `<DropdownMenu>`, `<Tooltip>`, `<Skeleton>` para loading.

### 6.4 Estados vacíos
- Sin ingresos: ilustración + CTA "Registra tu primer ingreso" + sugerencia "FINN puede ayudarte a importarlos por mensaje".

### 6.5 Confirmaciones críticas
- Eliminar: confirmación con mención "Se moverá a la papelera. Puedes recuperarlo en 30 días."
- Editar monto de ingreso ya con `goal_contributions`: advertir "Esto recalculará tus aportes a metas. Confirma."

---

## 7. Categorización con Gemini

### 7.1 Cuándo
- Cuando el usuario captura `source_name` o `notes` con texto libre.
- Cuando importa CSV (Fase 2).

### 7.2 Prompt template (Gemini Flash-Lite)

```
Eres un clasificador de ingresos personales para usuarios en El Salvador.

Clasifica el siguiente ingreso en EXACTAMENTE uno de estos tipos:
- salary: nómina/sueldo de empresa
- freelance: proyecto/cliente como independiente
- rental: renta de inmueble
- investment_yield: dividendos, intereses, cupones, cripto
- loan_payment: alguien me pagó un préstamo que le di
- business: ganancia de mi negocio propio
- eventual: venta de activo, premio, herencia, reembolso (no recurrente)
- other: ninguno de los anteriores

Descripción del ingreso: "{source_name}"
Notas adicionales: "{notes}"
Monto: {amount} {currency}

Responde SOLO con JSON válido:
{
  "type": "<tipo>",
  "confidence": <0.0-1.0>,
  "reasoning": "<una frase breve>"
}
```

**Parámetros:**
- `temperature: 0.1` (deterministic)
- `max_output_tokens: 100`
- `response_mime_type: 'application/json'`

### 7.3 Manejo de respuesta
- Si `confidence >= 0.85`: pre-seleccionar tipo.
- Si `confidence < 0.85`: pre-seleccionar pero mostrar "FINN sugiere {type} ({confidence}%)" con opción de ver razonamiento.
- Si el usuario cambia el tipo: guardar override en tabla `finn_classification_overrides` (NO en schema actual, se agrega en Fase 2 si hace falta).

### 7.4 Costo y rate limit
- Flash-Lite: ~$0.075 input / $0.30 output por 1M tokens.
- ~150 tokens por clasificación → ~$0.00005 por ingreso.
- Rate limit por plan: Free 5 clasificaciones/día, Starter 50, Pro 500, Elite ilimitado.

---

## 8. Reportes del módulo (14)

Los 14 reportes están descritos en el doc maestro. Priorizo cuáles van en MVP:

### MVP (7 reportes)
1. **Ingreso total del mes por fuente** — bar chart por `type`
2. **Distribución % por tipo** — pie chart
3. **Evolución histórica 12 meses** — line chart
4. **Recurrentes vs variables** — donut chart
5. **Esperados vs reales (brechas)** — tabla con delta y %
6. **Ingreso neto después de compromisos fijos** — KPI card
7. **Calendario de ingresos esperados** — calendar view

### Fase 2 (7 reportes)
8. Ingresos en divisas extranjeras (multi-currency breakdown)
9. Ratio ingreso / gasto (semáforo)
10. Historial de cobranza freelance
11. Avance hacia meta de ingreso (si usuario define meta)
12. Ingreso por hora trabajada (requiere captura de horas)
13. Resumen IA semanal FINN (texto generado)
14. Proyección a 3/6/12 meses con ML (Prophet)

### Implementación
- Cada reporte = query SQL parametrizada + componente React con Recharts.
- Endpoint: `/app/api/income/reports/<slug>` retorna JSON estructurado para el chart.
- Cache en cliente con React Query, TTL 5 minutos.

---

## 9. RLS y seguridad

Ya definido en migración 12 (`income_entries`):
```sql
create policy "income_owner" on public.income_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Sin acceso colaborativo** en MVP — los ingresos son personales. Si en Fase 3 quieres ingresos compartidos en `collab_space`, agregar `collab_space_id` y policy análoga.

**Validaciones adicionales:**
- Edge Function `income-create` verifica que `account_id` pertenezca al `user.id`.
- Edge Function verifica que `goal_allocation` solo contenga metas del propio usuario.
- Storage: `invoice_url` debe estar en bucket `private-receipts/<user_id>/`.

---

## 10. Validaciones (resumen)

| Campo | Regla |
|---|---|
| `type` | Debe estar en enum `income_type` |
| `source_name` | NOT NULL, 1-200 chars |
| `gross_amount` | >= 0 |
| `net_amount` | >= 0 y <= gross_amount |
| `deductions` | Si presente, `SUM(amounts) = gross - net` (±0.01 tolerancia) |
| `currency` | ISO 4217 válida (existe en `currencies`) |
| `income_date` | No futuro > 1 día (excepto si `is_collected = false`) |
| `account_id` | Pertenece al user (RLS) y activa (`status = 'active'`) |
| `is_collected = false` | Requiere `expected_date NOT NULL` |
| `expected_date` | Debe ser >= income_date |
| `goal_allocation` | `SUM(values) <= net_amount`; todos los goals deben pertenecer al user |
| `is_tax_relevant = true` | Requiere `issuer_tax_id OR invoice_number` |
| `invoice_url` | Si presente, formato válido (PDF/XML), max 5MB |
| `tags` | Max 10 tags, cada uno max 30 chars |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| Usuario crea ingreso con fecha futura > 1 día | Validation error. Sugerir "¿Lo quieres marcar como esperado/no cobrado?" |
| Usuario crea ingreso con `currency` que no existe en `currencies` | Error 422. UI debe usar solo monedas del catálogo |
| FX rate no disponible para la fecha | `amount_base = NULL`, badge "FX pendiente", job nocturno lo completa |
| Usuario elimina cuenta con ingresos | RESTRICT en FK `income_entries.account_id` → bloquea borrado de cuenta hasta resolver |
| Usuario elimina meta con `goal_contributions` | CASCADE → contribuciones se borran, pero `income_entries.goal_allocation` queda como histórico inconsistente. **Decisión: dejar el goal_allocation como referencia histórica con `_deleted` en el id.** |
| Recurring genera ingreso pero la cuenta está archivada | Saltar generación + notificar usuario |
| Importa CSV con duplicados (Fase 2) | Detectar por hash de (`amount`, `date`, `source_name`) y marcar como duplicado |
| Usuario captura `gross = net` sin deducciones | Permitido — solo asume que no hubo deducciones |
| Ingreso recurrente quincenal cae en fin de semana | Generar igual; depende del calendario del usuario |
| Edición de ingreso ya con `transaction` vinculada cambia monto | Cascade UPDATE a `transactions.amount` y reajustar `accounts.balance` (diff) |

---

## 12. Plan de tests

### 12.1 Unit tests (Vitest)
- Validación de schema Zod (`incomeCreateSchema`)
- Cálculos: `calculateDeductionsSV(gross)`, `sumDeductions(deductions)`, `validateGoalAllocation(amount, net)`
- Helpers de fecha y FX
- Serializers/deserializers

### 12.2 Integration tests (Vitest + Supabase local)
- `create_income_entry()` RPC con escenarios:
  - Cobrado simple
  - No cobrado (no crea transaction)
  - Multi-moneda con FX disponible
  - Multi-moneda sin FX
  - Con goal_allocation
  - Con recurrence
  - Con tax_record
  - Edición que dispara recálculo de amount_base
- RLS:
  - Usuario A no puede leer ingresos de usuario B
  - Usuario A no puede vincular ingreso a cuenta de usuario B
- Soft delete y restore
- Trigger `log_delete_audit` se ejecuta

### 12.3 E2E tests (Playwright)
- Onboarding crea primer ingreso
- Editar ingreso refleja cambio en dashboard
- Recurrente quincenal crea nuevo registro tras correr cron manual
- Importar PDF de boleta de pago con OCR (cuando se implemente en MVP)
- Flujo de "no cobrado" → "marcar como cobrado"

### 12.4 Casos de regresión clave
- Crear ingreso de $1,000 USD con base USD → `amount_base = 1000`, `fx_rate = 1`
- Crear ingreso de €500 EUR con base USD y FX = 1.08 → `amount_base = 540`
- Crear ingreso sin FX disponible → `amount_base = NULL`, badge en UI
- Eliminar ingreso → soft delete + transaction soft delete + audit log entry

---

## 13. Telemetría y métricas del módulo

### 13.1 Eventos a trackear (PostHog)
- `income_created` con props: `type`, `currency`, `is_recurring`, `has_goal_allocation`, `capture_source`
- `income_classified_by_finn` con props: `confidence`, `was_overridden`
- `income_marked_collected`
- `income_deleted`, `income_restored`
- `income_recurring_auto_created`
- `income_report_viewed` con `report_slug`

### 13.2 KPIs de adopción
- % de usuarios que registran ≥1 ingreso en primeros 7 días (target: 80%)
- % que crea recurrente para salario (target: 60% de los `salary`)
- % de ingresos con tipo cambiado vs. sugerencia FINN (target: <20% override = clasificador bueno)
- Tiempo promedio de captura de un ingreso (target: <30 segundos)

---

## 14. Out of scope (explícito)

- ❌ Predicción ML con Prophet (Fase 2)
- ❌ Detección de anomalías de ingresos (Fase 2)
- ❌ Import CSV bancario (Fase 2)
- ❌ Open Banking via Belvo (Fase 2)
- ❌ Vinculación con inmueble específico para `rental` (Fase 2 con MOD-07)
- ❌ Vinculación con préstamo otorgado para `loan_payment` (Fase 2 con MOD-13/14)
- ❌ Cálculo automático de ISR anual (Fase 3 con MOD-19)
- ❌ Parser CFDI/DTE XML (nunca — confirmado por usuario)
- ❌ Soporte multi-país para deducciones (solo SV en MVP)
- ❌ Captura por voz / dictado (Fase 2)
- ❌ Compartir ingresos con `collab_space` (no en roadmap salvo demanda)

---

## 15. Dependencias y orden de implementación

### 15.1 Bloqueadores (deben existir antes)
- ✅ Schema completo aplicado (migraciones 1-22)
- ⏳ Sistema de Auth funcionando (Fase 0.4)
- ⏳ Design system con shadcn/ui (Fase 0.5)
- ⏳ MOD-02 Cuentas (debe existir para que `account_id` tenga datos válidos)

### 15.2 Orden recomendado dentro del módulo
1. Schema Zod compartido (`packages/shared/schemas/income.ts`)
2. RPC SQL `create_income_entry()` + tests
3. Edge Function `income-create` + tests
4. UI lista de ingresos + filtros
5. UI formulario wizard
6. Integración Gemini para clasificación
7. Recurrentes + cron job `process-recurrings`
8. Reportes (los 7 críticos)
9. Importación PDF de boleta con OCR (opcional MVP)

### 15.3 Estimación de tiempo (1 dev)
- Schema Zod + RPC: 1 día
- Edge Functions: 1 día
- UI lista + filtros: 1 día
- UI wizard: 2 días
- Integración Gemini: 0.5 día
- Recurrentes + cron: 1 día
- 7 reportes: 2 días
- Tests: 1.5 días
- **Total estimado:** ~10 días (2 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

Las 5 decisiones se aprobaron tal como las recomendé. Resumen consolidado:

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Deducciones SV automáticas | ✅ Implementar en MVP | Función `calculate_sv_payroll_deductions(gross)` + botón "Calcular deducciones SV" en wizard paso 1 |
| 2 | Factura DTE: PDF vs PDF+XML | ✅ Solo PDF en MVP | UI valida `.pdf` únicamente, max 5MB. XML postergado |
| 3 | OCR boleta de pago | ✅ Diferido a Fase 2 | El form de ingresos en MVP es 100% manual |
| 4 | Tope de ingresos no cobrados | ✅ Sin tope | FINN genera `finn_insight` cuando `count(is_collected=false) >= 20` |
| 5 | Fallback FX manual | ✅ Implementar | Cuando `get_fx_rate()` devuelve NULL, UI muestra prompt: "No tenemos tasa {currency}→{base} para {date}. ¿Usar esta tasa?" con campo `numeric(15,6)` editable. La tasa manual NO se guarda en `fx_rates` (puede ser inexacta) — solo se aplica al registro actual |

---

## 17. Artefactos entregables del módulo

Al cerrar el desarrollo de MOD-00, debe existir:
- ✅ Esta spec aprobada
- ⏳ Schema Zod en `packages/shared/schemas/income.ts`
- ⏳ Función SQL `create_income_entry()` y tests
- ⏳ Edge Function `income-create` desplegada
- ⏳ Edge Function `income-classify` desplegada
- ⏳ Edge Function `process-recurrings` (compartida con otros módulos)
- ⏳ UI completa (`/app/ingresos/*`)
- ⏳ 7 reportes funcionales
- ⏳ Tests unit + integration + 3 E2E críticos
- ⏳ Documentación en `apps/web/app/ingresos/README.md`
- ⏳ Evento de telemetría `income_created` reportando a PostHog
