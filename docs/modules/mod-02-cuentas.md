# MOD-02 — Cuentas Bancarias

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.1, semanas 4-7)
> **Tablas core:** `accounts`, `transactions`, `credit_cards`, `recurrings`
> **Status:** Columna vertebral del sistema. Sin cuentas, ningún módulo de captura tiene anclaje.

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Bitcoin nativo en MVP.** Captura manual de saldo BTC, conversión USD via CoinGecko en job diario. Sin integración API Chivo Wallet en MVP.
2. ✅ **Bolsillos virtuales en JSONB.** `accounts.virtual_buckets` (más simple que tabla separada). Migrar a tabla en Fase 2 si emerge necesidad real.
3. ✅ **Saldo almacenado con trigger.** `accounts.balance` se mantiene actualizado vía `update_account_balance()` PL/pgSQL en INSERT/UPDATE/DELETE de transactions. Función `reconcile_account_balance()` corre semanal para detectar drift.
4. ✅ **Cuentas NO colaborativas.** Un solo dueño por cuenta. Lo colaborativo vive en `collab_space` (espacios compartidos) — las transacciones se etiquetan, pero las cuentas son personales.
5. ✅ **Conciliación opcional con recordatorios.** FINN sugiere conciliar cuando han pasado >60 días sin reconciliación en una cuenta activa.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Gestiona TODAS las cuentas financieras del usuario: dónde está su dinero, en qué moneda, con qué saldo, con qué historial. Es el contenedor que da contexto a cada transacción, ingreso, gasto, pago y meta.

### 1.2 Qué NO hace
- No procesa transacciones (eso es MOD-04 Gastos / MOD-00 Ingresos / MOD-15 Tarjetas).
- No otorga ni gestiona crédito (eso es MOD-15 / MOD-16).
- No conecta directamente con bancos en MVP (Open Banking via Belvo llega en Fase 2).
- No invierte ni cotiza activos (eso es MOD-07 Inversiones).

### 1.3 Alcance MVP vs Fase 2

| Feature | MVP | Fase 2 |
|---|---|---|
| 8 tipos de cuenta | ✅ | — |
| Saldo en tiempo real | ✅ | — |
| Multi-moneda (USD base + variables) | ✅ | — |
| **Bitcoin nativo** (SV es bimonetario) | ✅ tipo `digital_wallet` con currency `BTC` | Integración Chivo / Bitcoin Beach Wallet |
| Bolsillos virtuales (`virtual_buckets`) | ✅ básico (JSONB) | UI drag-drop |
| Cuentas hijas (sub-accounts) | ✅ `parent_account_id` | — |
| Conciliación bancaria manual | ✅ | — |
| Proyección de saldo 90 días (determinista) | ✅ | ML-mejorada (Prophet) |
| Importar CSV bancario | ❌ | ✅ 6 bancos SV |
| Open Banking (Belvo) | ❌ | ✅ |
| Conexión Chivo Wallet API | ❌ | ✅ (si Chivo expone API) |
| OCR de estado de cuenta PDF | ❌ | ✅ via Gemini |

---

## 2. Tipos de cuenta soportados (8)

| `type` | Nombre UX | Uso típico | Currency típica | Notas |
|---|---|---|---|---|
| `checking` | Cuenta corriente | Salario, gastos del día | USD | Banco Agrícola, Cuscatlán, Davivienda... |
| `savings` | Cuenta de ahorro | Reserva, fondo emergencia | USD | Soporta `interest_rate` |
| `cash` | Efectivo | Dinero en la cartera | USD | Sin banco; ajustes manuales frecuentes |
| `credit_card` | Tarjeta de crédito | Pagos a crédito | USD | Vinculada a registro en `credit_cards` (MOD-15) |
| `investment` | Cuenta de inversión | Brokerage, CETES | USD/MXN | Vinculada a `investments` (MOD-07 Fase 2) |
| `digital_wallet` | Billetera digital | Hugo, N1co, Chivo, Tigo Money, Bitcoin Beach | USD o BTC | Para SV: nativo Bitcoin |
| `fx` | Cuenta en divisas | EUR, GBP para freelance | EUR/GBP/etc | Conversión automática en reportes |
| `virtual` | Bolsillo virtual | Sub-cuenta de ahorro programado | USD | `parent_account_id` apunta a cuenta real |

### 2.1 Bancos SV preset
Lista pre-poblada en UI (auto-completar `bank_name`):
- Banco Agrícola
- Banco Cuscatlán
- Davivienda
- BAC Credomatic
- Banco Hipotecario
- Promerica
- Azul
- Banco Atlántida
- Banco Industrial

### 2.2 Billeteras digitales SV preset
- Hugo App
- N1co
- Tigo Money
- Chivo Wallet (USD + BTC)
- Bitcoin Beach Wallet (BTC)
- PayPal

---

## 3. Casos de uso

### CU-01 — Crear primera cuenta en onboarding
**Actor:** Usuario recién registrado.
**Trigger:** Wizard de onboarding (paso 2) o llegada a Dashboard vacío.
**Flujo:**
1. FINN pregunta: "¿En qué cuenta recibes tu salario o ingresos principales?"
2. Usuario selecciona tipo `checking` o `savings`.
3. Captura: nombre ("BAC corriente"), banco (autocompletar), últimos 4 dígitos opcionales, saldo actual.
4. Confirma moneda (default USD para SV).
5. Sistema crea registro en `accounts` con `initial_balance = saldo capturado`, `balance = initial_balance`.
6. Onboarding avanza al paso 3.

**Postcondición:** Cuenta visible en Dashboard. Usuario puede registrar ingresos/gastos.

### CU-02 — Crear cuenta secundaria desde MOD-02
**Actor:** Usuario que ya tiene 1+ cuenta.
**Flujo:**
1. Va a `/app/cuentas`, tap "Agregar cuenta".
2. Selecciona tipo desde grilla con íconos.
3. Captura datos. Para `credit_card`, redirige al wizard de MOD-15.
4. Confirma color e ícono.
5. Guarda. Cuenta aparece en lista y se incluye en patrimonio.

### CU-03 — Crear bolsillo virtual dentro de cuenta de ahorro
**Actor:** Usuario que ahorra para meta específica.
**Flujo:**
1. Abre detalle de cuenta `savings`.
2. Tap "Crear bolsillo virtual".
3. Captura: nombre ("Vacaciones Costa Rica"), meta ($800), monto inicial ($120), color.
4. Sistema:
   - Opción A (simple, MVP): agrega entrada al JSONB `accounts.virtual_buckets`: `[{name, target, current, color}]`.
   - Opción B (avanzada): crea registro hijo en `accounts` con `type = 'virtual'`, `parent_account_id = parent.id`.
5. MVP usa **Opción A** (JSONB) — más simple. Opción B queda como migración futura si la complejidad lo amerita.

**Postcondición:** Detalle de cuenta muestra "Total: $1,500 · Disponible libre: $1,380 · En bolsillos: $120".

### CU-04 — Registrar saldo de efectivo
**Actor:** Usuario que retiró $200 del cajero.
**Flujo:**
1. Crea cuenta `cash` "Cartera" si no existe.
2. Para registrar retiro: usa MOD-04 Gastos → transferencia (`kind = 'transfer_out'` desde checking, `kind = 'transfer_in'` a cash). Sistema crea par vinculado con `transfer_pair_id`.
3. Saldo de cash sube +$200, checking baja -$200.

### CU-05 — Ajuste manual de saldo (desviación)
**Actor:** Usuario nota que su saldo real difiere del calculado.
**Flujo:**
1. Detalle de cuenta → "Ajustar saldo".
2. Captura saldo real y opcionalmente razón ("Comisión bancaria no registrada").
3. Sistema crea `transaction` con `kind = 'adjustment'`, monto = diferencia, descripción auto.
4. Saldo se reconcilia.

**Edge case:** Si diferencia > 5% del saldo, mostrar warning "Diferencia grande, ¿seguro?".

### CU-06 — Conciliación bancaria mensual
**Actor:** Usuario que recibe estado de cuenta del banco.
**Flujo MVP (manual):**
1. Abre detalle de cuenta → "Conciliar mes".
2. UI muestra lista de transacciones del periodo agrupadas por día.
3. Usuario captura saldo de cierre según banco.
4. Si coincide con suma de transactions del periodo → marca todas como `status = 'reconciled'`.
5. Si NO coincide → resalta delta, pide al usuario marcar transactions que faltan o crear ajuste.

**Flujo Fase 2 (CSV):** Importa CSV → matching automático por (amount, date) → resalta discrepancias.

### CU-07 — Cuenta en moneda extranjera (FX)
**Actor:** Usuario con cuenta en EUR (por trabajos freelance).
**Flujo:**
1. Crea cuenta `fx` con `currency = 'EUR'`.
2. Saldo siempre en EUR.
3. En Dashboard, sistema convierte a USD usando `get_fx_rate('EUR', 'USD', today)`.
4. Reportes de patrimonio muestran "$1,200 USD equivalente" + indicador moneda original.
5. Cuando registra transacción, captura monto en EUR; trigger `fill_amount_base` calcula USD.

### CU-08 — Cuenta de Bitcoin (Chivo Wallet)
**Actor:** Salvadoreño con saldo en BTC.
**Flujo:**
1. Crea cuenta `digital_wallet`, banco "Chivo Wallet", `currency = 'BTC'`.
2. Captura saldo en BTC (ej. `0.005`).
3. Sistema usa `numeric(20,8)` heredado de schema — soporta cripto.
4. Reportes muestran ambos: `0.005 BTC` y `$320 USD` (usando `get_fx_rate('BTC', 'USD', today)`).
5. `fx_rates` debe poblarse con BTC/USD diario via job `sync-fx-rates`.

**Limitación MVP:** sin conexión API a Chivo. Usuario actualiza saldo manualmente cuando hace tx. Fase 2 explorar API.

### CU-09 — Archivar cuenta cerrada
**Actor:** Usuario cerró cuenta del Banco X.
**Flujo:**
1. Detalle de cuenta → "Archivar".
2. Confirma: "Las transacciones históricas se conservan. La cuenta deja de aparecer en flujos nuevos."
3. Sistema setea `is_archived = true`, `status = 'closed'`.
4. Cuenta no aparece en selectores ni en patrimonio.
5. Aún visible en reportes históricos y filtro "Mostrar archivadas".

### CU-10 — Proyectar saldo a 90 días
**Actor:** Usuario quiere saber si llega al fin de mes.
**Flujo:**
1. Detalle de cuenta → tab "Proyección".
2. Sistema toma:
   - Saldo actual
   - Ingresos recurrentes activos hasta hoy+90 (de `recurrings WHERE kind='income'`)
   - Gastos recurrentes activos hasta hoy+90
   - Transacciones programadas con `status='pending'`
3. Genera línea de tiempo día-por-día con saldo proyectado.
4. Resalta días donde proyección cruza saldo mínimo configurado.
5. FINN comenta: "El 18 de cada mes tu cuenta baja a $80. Considera ajustar débitos."

**Implementación:** función PL/pgSQL `project_account_balance(account_id, days)` retorna `TABLE(date, balance, source)`.

### CU-11 — Eliminar cuenta con transacciones
**Caso:** RESTRICT en FK `transactions.account_id` → sistema bloquea.
**UX:** dialog "No puedes eliminar esta cuenta porque tiene 247 transacciones. Puedes archivarla en su lugar." con botones "Archivar" / "Cancelar".

### CU-12 — Transferencia entre cuentas propias
**Actor:** Usuario mueve $500 de checking a savings.
**Flujo:**
1. En MOD-02 o desde Dashboard, tap "Transferir".
2. Selecciona origen, destino, monto, fecha.
3. Sistema crea 2 transactions vinculadas:
   - origen: `kind = 'transfer_out'`, amount=500, `transfer_pair_id = tx2.id`
   - destino: `kind = 'transfer_in'`, amount=500, `transfer_pair_id = tx1.id`
4. Saldos se actualizan atomicamente vía RPC `transfer_between_accounts()`.
5. Si las monedas difieren (USD → EUR), aplica `get_fx_rate` y captura tasa usada.

---

## 4. Modelo de datos

### 4.1 Tabla `accounts`
Ya definida en `supabase/migrations/20260630120600_accounts.sql`. Campos clave:

| Campo | Tipo | Uso |
|---|---|---|
| `type` | `account_type` enum | 8 tipos |
| `status` | `account_status` enum | `active` / `closed` / `archived` |
| `bank_name` | text | Banco / billetera (preset autocomplete) |
| `account_number_mask` | text | Últimos 4 dígitos opcionales |
| `currency` | char(3) | ISO 4217 (USD default, soporta BTC) |
| `balance` | numeric(15,2) | Saldo actual — derivado de transacciones |
| `initial_balance` | numeric(15,2) | Saldo inicial al crear cuenta |
| `interest_rate` | numeric(7,4) | Tasa anual (para `savings`) |
| `credit_limit` | numeric(15,2) | Solo para virtual con tope (raro) |
| `parent_account_id` | uuid | Para sub-cuentas reales (no para JSONB buckets) |
| `virtual_buckets` | jsonb | `[{name, target, current, color, icon}]` |
| `is_included_in_net_worth` | boolean | Excluir cuentas "vacaciones grupales" del patrimonio personal |
| `is_archived` | boolean | Soft hide |
| `belvo_account_id` | text | Fase 2 |
| `last_sync_at` | timestamptz | Fase 2 |
| `version` | integer | Optimistic concurrency |

### 4.2 Campo `virtual_buckets` JSONB — schema

```json
[
  {
    "id": "uuid",
    "name": "Vacaciones Costa Rica",
    "target": 800.00,
    "current": 120.00,
    "color": "#00E5A0",
    "icon": "🏖️",
    "created_at": "2026-06-30T12:00:00Z"
  }
]
```

**Validación al guardar:** `SUM(buckets.current) <= accounts.balance` — los bolsillos son parte del saldo, no adicionales.

### 4.3 Reglas de integridad
- `balance` es **derivado de transacciones**, pero almacenado por rendimiento. Trigger lo actualiza en cada INSERT/UPDATE/DELETE de `transactions`.
- `currency` no se puede cambiar después de tener transacciones (constraint via función).
- `type = 'credit_card'` requiere que exista registro espejo en `credit_cards`.
- `type = 'virtual'` requiere `parent_account_id IS NOT NULL`.
- `parent_account_id` debe tener mismo `currency` que el hijo.
- No permitir eliminar cuenta con transacciones activas (RESTRICT en FK).
- No permitir eliminar cuenta con `family_loans` / `loan_portfolio` / `debts` vinculados.

---

## 5. Reglas de negocio

### 5.1 Cálculo de saldo
**Fuente de verdad:** suma de transacciones cleared/reconciled + initial_balance.

**Estrategia:** balance se mantiene en `accounts.balance` por performance, actualizado vía trigger PL/pgSQL:

```sql
create or replace function update_account_balance()
returns trigger as $$
declare
  v_account_id uuid;
  v_delta numeric(15,2);
begin
  -- INSERT: sumar amount según kind
  if TG_OP = 'INSERT' then
    v_account_id := new.account_id;
    v_delta := case new.kind
      when 'income'           then new.amount
      when 'transfer_in'      then new.amount
      when 'refund'           then new.amount
      when 'interest_earned'  then new.amount
      when 'expense'          then -new.amount
      when 'transfer_out'     then -new.amount
      when 'cc_payment'       then -new.amount
      when 'fee'              then -new.amount
      when 'interest_paid'    then -new.amount
      when 'adjustment'       then new.amount   -- puede ser +/-
      else 0
    end;
  -- UPDATE: revertir old + aplicar new
  elsif TG_OP = 'UPDATE' then
    -- ... (similar lógica con old y new)
  -- DELETE: revertir
  elsif TG_OP = 'DELETE' then
    v_account_id := old.account_id;
    v_delta := -delta_for_kind(old.kind, old.amount);
  end if;

  update public.accounts
     set balance = balance + v_delta,
         version = version + 1
   where id = v_account_id;
  return coalesce(new, old);
end;
$$ language plpgsql;
```

**Excepciones:**
- Transacciones con `status = 'pending'` NO afectan balance hasta que pasen a `cleared`.
- Transacciones con `status = 'void'` se ignoran.
- Soft-deleted (`deleted_at IS NOT NULL`) se ignoran.

### 5.2 Conciliación manual

Estado del flujo:
- `pending`: ingresada por usuario, no confirmada en banco
- `cleared`: confirmada (default)
- `reconciled`: usuario marcó como matched contra estado de cuenta
- `void`: anulada (mantiene registro pero no afecta saldo)

**Endpoint:** `POST /functions/v1/account-reconcile`
```json
{
  "account_id": "uuid",
  "period_start": "2026-06-01",
  "period_end": "2026-06-30",
  "bank_closing_balance": 1234.56,
  "transaction_ids_to_reconcile": ["uuid1", "uuid2", ...]
}
```

**Lógica:** verifica que `bank_closing_balance = initial_balance + SUM(matched txs)`. Si match, marca todas como `reconciled`. Si no, devuelve delta.

### 5.3 Proyección 90 días

Función PL/pgSQL `project_account_balance(p_account_id uuid, p_days int)` retorna:

```sql
returns table (
  projection_date date,
  starting_balance numeric(15,2),
  income_today numeric(15,2),
  expense_today numeric(15,2),
  ending_balance numeric(15,2),
  source text  -- 'recurring' | 'scheduled' | 'baseline'
)
```

**Algoritmo:**
1. Toma `accounts.balance` como punto de partida.
2. Para cada día desde hoy hasta hoy+p_days:
   - Lista `recurrings` activos con `next_run_date <= día` y aplica el monto.
   - Avanza `next_run_date` según `frequency` para iteraciones futuras.
   - Lista `transactions` con `status='pending'` y `transaction_date = día`.
3. Acumula y devuelve día por día.

**Output UI:** gráfica line chart 90 días + tabla expandible + alertas en días <umbral.

### 5.4 Multi-moneda en cuentas

**Regla:** cada cuenta tiene UNA moneda; no se puede cambiar después de tener transacciones.

**Para reportes consolidados (Dashboard, Patrimonio):**
- Convertir cada balance a moneda base del usuario usando `get_fx_rate(account.currency, user.currency_default, today)`.
- Si no hay FX, mostrar "$X.XX (sin FX)" y badge ámbar.

**Para transacciones cross-currency:**
- Captura monto en moneda de la cuenta.
- Trigger `fill_amount_base` calcula `amount_base` en moneda del usuario.

### 5.5 Bitcoin específicamente
- Usar `currency = 'BTC'`, `numeric(20,8)` (compatible con schema).
- `fx_rates` debe tener entradas BTC→USD diarias. Fuente: CoinGecko free tier (60 calls/min).
- En UI mostrar siempre ambos: `0.00512 BTC ($328.45 USD)`.
- Como BTC es legal tender en SV, las cuentas BTC sí entran a patrimonio. Configurable por usuario en settings.

---

## 6. API / Endpoints

| # | Tipo | Path / Función | Descripción |
|---|---|---|---|
| 1 | Supabase client | `from('accounts').select()` | Listar (RLS owner) |
| 2 | Supabase client | `from('accounts').insert()` | Crear cuenta simple |
| 3 | Edge Function POST | `/functions/v1/account-create` | Crea cuenta + balance trigger + audit |
| 4 | Supabase client | `from('accounts').update()` | Editar campos no críticos |
| 5 | Edge Function POST | `/functions/v1/account-adjust-balance` | Ajuste manual con transacción auto |
| 6 | Edge Function POST | `/functions/v1/account-reconcile` | Conciliación periodo |
| 7 | Edge Function POST | `/functions/v1/account-archive` | Archiva (soft hide) |
| 8 | Edge Function DELETE | `/functions/v1/account-delete` | Solo si sin transacciones; sino sugiere archivar |
| 9 | Edge Function GET | `/functions/v1/account-projection` | Proyección 90 días |
| 10 | Edge Function POST | `/functions/v1/account-transfer` | Transferencia entre cuentas (par atómico) |
| 11 | Edge Function POST | `/functions/v1/account-bucket-create` | Agrega bucket virtual al JSONB |
| 12 | Edge Function POST | `/functions/v1/account-bucket-move` | Mueve fondos a/desde bucket |
| 13 | Edge Function POST | `/functions/v1/account-import-csv` | (Fase 2) parser CSV bancario |

### 6.1 Schema de request: `account-create`

```typescript
POST /functions/v1/account-create
Authorization: Bearer <user_jwt>
Body:
{
  name: string,                                // "BAC corriente"
  type: 'checking' | 'savings' | 'cash' | ...,
  bank_name?: string,
  account_number_mask?: string,                // últimos 4 dígitos
  currency: string,                            // ISO 4217
  initial_balance: number,
  interest_rate?: number,                      // anual decimal, ej 0.045
  parent_account_id?: string,                  // si type=virtual
  color?: string,
  icon?: string,
  is_included_in_net_worth?: boolean
}

Response 201:
{
  account: Account,
  audit_event_id: string
}
```

### 6.2 Schema de request: `account-transfer`

```typescript
POST /functions/v1/account-transfer
Body:
{
  from_account_id: string,
  to_account_id: string,
  amount: number,                              // monto en moneda de from
  transfer_date: string,                       // YYYY-MM-DD
  fx_rate_manual?: number,                     // si monedas difieren y no hay FX
  description?: string
}

Response 201:
{
  transfer_out_tx: Transaction,
  transfer_in_tx: Transaction,
  from_account_new_balance: number,
  to_account_new_balance: number
}
```

### 6.3 Schema de request: `account-bucket-move`
```typescript
POST /functions/v1/account-bucket-move
Body:
{
  account_id: string,
  from_bucket_id: string | "free",            // "free" = saldo no asignado
  to_bucket_id: string | "free",
  amount: number,
  reason?: string
}
```
NO crea transacción — solo recompone JSONB. Audit log captura.

---

## 7. UI / UX

### 7.1 Pantallas
1. **Lista de cuentas** (`/app/cuentas`) — grid de tarjetas por cuenta, agrupadas por tipo.
2. **Detalle de cuenta** (`/app/cuentas/[id]`) — tabs: Movimientos · Bolsillos · Proyección · Configuración.
3. **Wizard nuevo** (`/app/cuentas/nueva`) — 3 pasos: Tipo · Datos · Apariencia.
4. **Transferir** (modal global, accesible desde Dashboard).
5. **Conciliar** (`/app/cuentas/[id]/conciliar`) — flujo wizard.
6. **Archivadas** (`/app/cuentas/archivadas`).

### 7.2 Card de cuenta (lista)
```
┌────────────────────────────────────┐
│  💰 BAC Corriente          ⋮      │
│  Cuenta corriente · USD            │
│                                    │
│  $1,234.56                         │
│  ↑ +$340 esta semana               │
│                                    │
│  3 bolsillos · 18 movimientos      │
└────────────────────────────────────┘
```

### 7.3 Detalle: tab Bolsillos
```
Saldo total:   $1,234.56
En bolsillos:  $   620.00
Libre:         $   614.56
─────────────────────────────────────
🏖️  Vacaciones CR    $120 / $800  ▓░░░░ 15%
🎓  Curso UX         $400 / $400  ▓▓▓▓▓ ✓
🛟  Emergencia       $100 / $1,000 ▓░░░░ 10%

[+ Crear bolsillo]   [Mover fondos]
```

### 7.4 Wizard nuevo (3 pasos)
1. **Tipo**: grid de 8 tarjetas con íconos.
2. **Datos**:
   - Nombre (campo libre, sugerencia auto)
   - Banco (combobox con presets SV)
   - Últimos 4 dígitos (opcional)
   - Moneda (default USD, dropdown con BTC visible para `digital_wallet`)
   - Saldo actual
   - Solo si `savings`: tasa de interés anual
3. **Apariencia**: color (paleta 8) + ícono (emoji).

### 7.5 Estados vacíos
- Sin cuentas: ilustración + "Empieza agregando dónde guardas tu dinero" + CTA "Crear primera cuenta" + atajo "FINN puede ayudarte" (chat sugerido).

### 7.6 Confirmaciones críticas
- Eliminar cuenta sin transacciones: confirmación simple.
- Eliminar cuenta con transacciones: diálogo bloqueante → opción "Archivar".
- Cambiar moneda con transacciones: bloqueado (no editable).
- Ajuste de saldo > 5% del saldo: warning + razón obligatoria.

---

## 8. Reportes del módulo

Reportes propios de MOD-02 (visibles en `/app/cuentas/reportes`):

1. **Distribución de saldo por cuenta** — pie chart
2. **Evolución del saldo total** — line chart 12 meses
3. **Liquidez disponible vs comprometida** — barras (saldo libre - bolsillos - próximos vencimientos)
4. **Proyección 90 días** — line chart con baseline + escenarios
5. **Inactividad de cuentas** — tabla cuentas sin movimientos > 60 días
6. **Comisiones bancarias** — suma `kind='fee'` por cuenta/mes
7. **Intereses ganados** — suma `kind='interest_earned'` por cuenta

### MVP (3 reportes)
1, 2, 4 — los más críticos para el dashboard.

### Fase 2 (4 reportes)
3, 5, 6, 7.

---

## 9. RLS y seguridad

Ya definido en migración 7:
```sql
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Validaciones extra en Edge Functions:**
- `account-create`: validar `parent_account_id` pertenece al user y tiene misma moneda.
- `account-transfer`: validar AMBAS cuentas pertenecen al user.
- `account-delete`: validar 0 transacciones vinculadas activas.
- Nunca exponer `belvo_link_id` al cliente — solo a Edge Functions.

**Storage:**
- Si en Fase 2 importamos CSV/PDF, guardarlos en bucket `bank-statements/<user_id>/` con RLS por path.

---

## 10. Validaciones

| Campo | Regla |
|---|---|
| `name` | NOT NULL, 1-100 chars, único por usuario |
| `type` | enum válido |
| `currency` | ISO 4217 existente en `currencies` |
| `initial_balance` | numeric con 2 decimales (8 para BTC) |
| `interest_rate` | 0 ≤ rate ≤ 100 (porcentaje anual) |
| `credit_limit` | requerido si `type = 'virtual'` con tope, opcional sino |
| `bank_name` | max 100 chars |
| `account_number_mask` | regex `^[0-9]{0,4}$` (solo últimos 4) |
| `parent_account_id` | si presente, debe ser cuenta del mismo user y misma moneda |
| `virtual_buckets` | JSONB array, schema validado en Zod, `SUM(current) <= balance` |
| `is_included_in_net_worth` | boolean (default true) |

---

## 11. Edge cases

| Caso | Manejo |
|---|---|
| Usuario crea cuenta con saldo negativo (sobregirado) | Permitido — informativo, no bloquea |
| Cambio de moneda con transacciones existentes | Bloqueado en backend; UI deshabilita campo |
| Transferencia a cuenta archivada | Error 422 "Cuenta destino archivada" |
| Bolsillo virtual con `current > parent.balance` | Validación rechaza |
| Eliminar bolsillo con fondos asignados | Sugerir "Mover a otro bolsillo" o "Devolver al saldo libre" |
| BTC FX no disponible | `amount_base = NULL`; UI muestra "BTC sin tasa" + retry diario |
| Cuenta con `belvo_account_id` (Fase 2) editada manualmente | Permitir, pero advertir "Esto se sobrescribirá en próxima sync" |
| Cierre de cuenta con saldo > 0 | Pedir confirmación: "¿Transferir saldo a otra cuenta antes de archivar?" |
| Cuenta cash con saldo negativo | Permitido (deuda en efectivo); FINN sugiere ajuste |
| `parent_account_id` apunta a cuenta archivada | Rechazar |

---

## 12. Plan de tests

### 12.1 Unit (Vitest)
- `accountCreateSchema` Zod
- `virtualBucketsSchema` Zod
- `calculateTotalBucketsUsed(buckets)` helper
- `validateTransferAmounts(from, to, amount, fx)`
- `formatAccountBalance(account, locale)` multi-currency

### 12.2 Integration
- RPC `update_account_balance()` con escenarios:
  - INSERT expense → balance baja
  - INSERT income → balance sube
  - UPDATE amount → diff aplicado
  - DELETE → revertido
  - Transferencia → ambas cuentas afectadas
- RPC `project_account_balance(id, 90)` con recurrings activos
- RLS: usuario A no ve cuentas de B
- Bolsillos virtuales: sum invariant
- Archivar cuenta: filtros excluyen archivadas en queries por defecto

### 12.3 E2E (Playwright)
- Onboarding → crear primera cuenta → registrar primer ingreso → balance visible
- Crear cuenta de ahorro con bolsillos → registrar ingreso con allocation a bolsillo
- Transferencia entre 2 cuentas USD → balances reflejan
- Transferencia cross-currency USD↔EUR → fx aplicado
- Ajuste manual con razón → audit log entry
- Archivar cuenta con transacciones → confirmación + soft hide

### 12.4 Regression
- Crear cuenta USD con balance 0 → consistente
- Crear cuenta BTC con balance 0.001 → 8 decimales preservados
- Eliminar cuenta sin transacciones → succeed
- Eliminar cuenta con transacciones → RESTRICT + sugerencia

---

## 13. Telemetría

### 13.1 Eventos
- `account_created` props: `type`, `currency`, `has_bank_name`, `initial_balance_band`
- `account_archived` props: `type`, `had_transactions_count`
- `account_transferred` props: `from_currency`, `to_currency`, `cross_currency`
- `account_reconciled` props: `period_days`, `matched_count`, `delta`
- `account_balance_adjusted` props: `delta_amount`, `reason_provided`
- `bucket_created` props: `bucket_count`
- `projection_viewed` props: `days`, `had_negative_days`

### 13.2 KPIs
- ≥80% de usuarios crean ≥2 cuentas en primera semana
- ≥40% de usuarios crean al menos 1 bolsillo virtual
- ≥30% revisa la proyección de 90 días al menos 1 vez/mes
- ≥10% concilia mensualmente

---

## 14. Out of scope (MVP)

- ❌ Open Banking via Belvo (Fase 2)
- ❌ Importación CSV de bancos SV (Fase 2)
- ❌ OCR de estados de cuenta PDF con Gemini (Fase 2)
- ❌ Conexión API Chivo Wallet (Fase 2 — depende de disponibilidad oficial)
- ❌ Cuentas hijas con datos propios y RLS independiente (queda como `parent_account_id` simple, sin features avanzadas)
- ❌ Recategorización automática de transacciones al cambiar tipo de cuenta
- ❌ Multi-currency wallets (una cuenta = una moneda)
- ❌ ML para detectar cuentas duplicadas
- ❌ Integración con apps de pago (Wise, Revolut)
- ❌ Cuentas colaborativas (un solo dueño por cuenta; uso colaborativo via `collab_space` queda para MOD-11)

---

## 15. Dependencias y orden

### 15.1 Bloqueadores
- ✅ Schema migración 7 aplicada
- ⏳ Auth y onboarding funcionando (Fase 0.4)
- ⏳ Design system con shadcn (Fase 0.5)
- ⏳ `currencies` seed activo (✅ ya en migración 3)

### 15.2 Orden recomendado de implementación
1. Zod schemas + RPC `update_account_balance()` (trigger)
2. Edge Function `account-create` + tests
3. Edge Function `account-transfer` (atómico)
4. UI lista de cuentas + card components
5. UI wizard nuevo (3 pasos)
6. UI detalle: movimientos
7. Bolsillos virtuales (UI + bucket-create/move)
8. Edge Function `account-adjust-balance`
9. Edge Function `account-reconcile` + UI conciliación
10. RPC `project_account_balance()` + UI proyección
11. 3 reportes MVP
12. Soporte BTC (job sync-fx-rates incluye BTC/USD)
13. Tests

### 15.3 Estimación de tiempo (1 dev)
- Triggers + RPC balance: 1.5 días
- Edge Functions (5 endpoints): 2 días
- UI lista + wizard: 2 días
- UI detalle + movimientos: 1.5 días
- Bolsillos virtuales (back + front): 1.5 días
- Conciliación: 1 día
- Proyección 90d (back + UI): 1.5 días
- 3 reportes MVP: 1 día
- Soporte BTC + FX job adaptado: 0.5 día
- Tests: 1.5 días
- **Total estimado:** ~14 días (~3 semanas con buffer)

---

## 16. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Bitcoin nativo en MVP | ✅ Sí, captura manual | Soporte `currency='BTC'`, job diario CoinGecko BTC/USD, sin API Chivo en MVP |
| 2 | Bolsillos: JSONB vs tabla | ✅ JSONB | `accounts.virtual_buckets` con invariant validado en app + Zod |
| 3 | Saldo: derivado vs almacenado | ✅ Almacenado con trigger | Trigger `update_account_balance()` + job `reconcile_account_balance()` semanal |
| 4 | Cuentas colaborativas | ✅ NO — un dueño | Colaborativo solo vía `collab_space` con tags en transacciones |
| 5 | Conciliación obligatoria | ✅ Opcional con recordatorios | FINN insight a partir de 60 días sin conciliar |

---

## 17. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ Zod schemas en `packages/shared/src/schemas/account.ts`
- ⏳ Trigger `update_account_balance()` en nueva migración
- ⏳ RPC `project_account_balance()` en nueva migración
- ⏳ 8+ Edge Functions desplegadas
- ⏳ UI completa (`/app/cuentas/*`)
- ⏳ 3 reportes funcionales
- ⏳ Soporte multi-currency + BTC validado E2E
- ⏳ Tests unit + integration + 4 E2E críticos
- ⏳ Eventos PostHog activos
- ⏳ `docs/modules/mod-02-cuentas.md` aprobado

---

## 18. Conexión con otros módulos

| Módulo | Cómo MOD-02 lo afecta | Cuándo |
|---|---|---|
| **MOD-00 Ingresos** | Cada ingreso `is_collected` se vincula a un `account_id` | Inmediato |
| **MOD-04 Gastos** | Cada gasto debita un `account_id` o `card_id` | Inmediato |
| **MOD-01 Dashboard** | Saldo total = suma de `accounts.balance * fx_to_base` | Inmediato |
| **MOD-15 Tarjetas** | `credit_cards.account_id` apunta a una cuenta espejo opcional | Sub-fase 1.1 |
| **MOD-17 Patrimonio** | Activos = `accounts.balance` * fx, excluyendo `is_included_in_net_worth = false` | Sub-fase 1.2 |
| **MOD-05 Metas** | `goals.account_id` vincula meta a cuenta o bolsillo | Fase 2 |
| **MOD-13/14 Préstamos** | `family_loans.account_id` para registrar de qué cuenta salió | Fase 2 |
| **MOD-07 Inversiones** | `investments.account_id` para asociar posiciones a brokerage | Fase 2 |
| **MOD-11 Colaborativas** | Transacciones con `collab_space_id` aún viven en cuentas personales | Fase 3 |
