# MOD-13 — Préstamos Familiares

> **Versión:** 1.1 — **APROBADA** (2026-07-12)
> **Fase:** 2
> **Tablas core:** `family_loans`, `family_loan_payments`, `transactions`, `credit_cards`, `accounts`
> **Status:** Módulo exclusivo LATAM — ninguna app de finanzas personales del mercado (Monarch, YNAB, Rocket Money) cubre préstamos informales a familia. Diferenciador clave del producto.

---

## Decisiones cerradas (2026-07-12)

1. ✅ **Nuevo `transaction_kind = 'cc_cash_advance'`** para retiro de efectivo con tarjeta, distinto de `'cc_charge'`. MOD-15 necesita saber con certeza cuál es cuál para proyectar intereses correctamente (sin período de gracia en este caso).
2. ✅ **`written_off` solo cambia `status`**, sin transacción de "pérdida". Simple y reversible para v1; se revisa si más adelante se necesita reflejar el impacto en patrimonio neto.
3. ✅ **Split parcial incluido desde v1** — ver mecanismo en §3. Se implementa vía `linked_amount` en `family_loans`, **no** creando transacciones hijas (para no arriesgar doble conteo de saldo en cuentas/tarjetas — ver razonamiento abajo).
4. ✅ **Moneda:** `currency DEFAULT 'USD'`, consistente con el resto del sistema (ya corregido respecto al doc original que tenía `'MXN'`).

---

## 1. Propósito y alcance

### 1.1 Qué hace
Registra dinero prestado (sin interés) a familiares o amigos: cuánto, a quién, cómo se entregó, y hace seguimiento de abonos hasta saldar. Cubre el patrón más común y menos servido en LATAM: prestar cash, transferir, o —el caso que motivó esta spec— pagar con tarjeta propia directamente a nombre del familiar.

### 1.2 Qué NO hace
- No cobra interés (eso es MOD-14 Mi Cartera — prestatario formal, con tasa).
- No es un gasto del usuario: el dinero prestado no cuenta en presupuesto ni en reportes de gasto personal.
- No es un ingreso confirmado cuando se cobra: los abonos son "ingreso contingente" hasta que se reciben de verdad (regla ya vigente en el sistema).
- No gestiona cobranza legal ni genera documentos con validez legal — es tracking personal, no un pagaré.

### 1.3 Alcance v1 (Fase 2) vs Fase 3

| Feature | v1 (Fase 2) | Fase 3 |
|---|---|---|
| Registro de préstamo (efectivo/transferencia/débito) | ✅ | — |
| Préstamo vía compra con tarjeta (`credit_purchase`) | ✅ genera `transactions.kind='cc_charge'` real | — |
| Préstamo vía retiro de efectivo con tarjeta (`credit_cash_advance`) | ✅ genera `transactions.kind='cc_cash_advance'` real | — |
| Vínculo retroactivo de un gasto ya registrado (monto completo o parcial) | ✅ | — |
| Split parcial de un gasto entre "mío" y "préstamo" | ✅ vía `linked_amount`, sin duplicar transacciones | — |
| Abonos con modalidad propia + comprobante | ✅ | — |
| Alertas de mora (sin abono >30 días) | ✅ | — |
| KPIs del módulo (7, ver §4) | ✅ | — |
| FINN advierte proactivamente sobre `credit_cash_advance` | ✅ | — |
| Recordatorios automáticos al deudor (WhatsApp/SMS) | ❌ | ✅ (requiere integración WhatsApp Business, Fase 3 general) |
| Refinanciar / convertir préstamo familiar a MOD-14 con interés | ❌ | ✅ |

---

## 2. Campos

### 2.1 Préstamo (`family_loans`)
| Campo | Tipo | Notas |
|---|---|---|
| `person_name` | text | Nombre del deudor |
| `relationship` | text | Libre — "hermano", "prima", "amigo de la universidad" |
| `original_amount` / `balance` | numeric | Balance baja con cada abono |
| `currency` | char(3) | Default USD |
| `delivery_date` | date | Cuándo se entregó el dinero |
| `delivery_method` | enum | Ver §2.3 |
| `origin_account_id` | uuid → accounts | Si `delivery_method` es cash/transfer/debit |
| `origin_card_id` | uuid → credit_cards | Si `delivery_method` es credit_purchase/credit_cash_advance |
| `transaction_id` | uuid → transactions | El cargo/retiro real (ver §3) |
| `linked_amount` | numeric, nullable | Solo se usa en vínculos parciales — ver §3. `NULL` = el préstamo es el monto completo de `transaction_id` |
| `category` | text | 12 categorías de destino (§2.4) |
| `evidence_url` | text | Foto/comprobante — reusa el sistema de adjuntos genérico ya construido |
| `agreed_payment_date` | date | Opcional |
| `status` | enum | `active` / `paid` / `written_off` |

### 2.2 Abono (`family_loan_payments`)
Fecha, monto, modalidad recibida (puede diferir de la entrega — ej. prestaste en efectivo, te devuelven por transferencia), cuenta destino, `transaction_id` del ingreso real, saldo resultante, comprobante.

### 2.3 `delivery_method` — por qué son 6 y no 4
```
'cash' | 'transfer' | 'debit' | 'credit_purchase' | 'credit_cash_advance' | 'bitcoin' | 'crypto'
```
Los primeros tres (+ cripto) son neutrales: el usuario ya tenía ese dinero disponible. Los dos de tarjeta son fundamentalmente distintos entre sí:
- **`credit_purchase`** — como cualquier compra normal, tiene período de gracia hasta el corte.
- **`credit_cash_advance`** — interés corre desde el minuto 1 (sin gracia) + comisión de retiro (3-5% + $2-5 fijo en SV). Es la forma más cara de prestar dinero que existe, y FINN debe decirlo explícitamente cuando el usuario elija esta opción (ver §5).

### 2.4 12 categorías de destino
Alimentos, reparación hogar, reparación carro, colegiatura, recibos/servicios, gastos médicos, deudas/créditos, ropa, evento/celebración, herramientas/negocio, viaje/transporte, otro.

---

## 3. Vínculo con transactions — el mecanismo central

Dos flujos posibles, ambos terminan en el mismo estado: una fila en `family_loans` con `transaction_id` apuntando a un movimiento real, y opcionalmente `linked_amount` si el préstamo es solo una porción de esa transacción.

**Por qué NO se crean transacciones "hijas" para el split parcial:** `transactions` ya tiene columnas `is_split`/`split_parent_id`/`split_details` pensadas para dividir un gasto entre categorías o personas — pero usarlas aquí crearía una fila adicional con su propio `amount`, y esa fila dispararía `transaction_balance_delta()`/`cc_balance_delta()` igual que cualquier otra, **descontando el dinero dos veces** del mismo saldo real (una vez por la transacción padre, otra por la hija). El movimiento de dinero real es uno solo — $80 salieron de la tarjeta, sin importar que $40 sean "míos" y $40 sean un préstamo. Por eso el split parcial se resuelve con un campo numérico simple (`linked_amount`) en `family_loans`, no con más filas en `transactions`.

**Flujo A — préstamo nuevo, entrega vía tarjeta o cuenta (monto completo):**
1. Usuario llena el formulario de nuevo préstamo, elige `delivery_method`.
2. Si es `credit_purchase` o `credit_cash_advance`: la app crea automáticamente la fila en `transactions` (`kind='cc_charge'` o `kind='cc_cash_advance'`, `card_id` obligatorio) — dispara los triggers existentes de saldo de tarjeta (`update_credit_card_balance()`) igual que cualquier cargo.
3. Si es `cash`/`transfer`/`debit`: mismo patrón pero contra `accounts` (`kind='transfer_out'`, `account_id` obligatorio) — dispara `update_account_balance()`.
4. `family_loans.transaction_id` guarda el id de esa transacción; `linked_amount` queda `NULL` (el préstamo es el 100% del monto).
5. Esa transacción se **excluye por completo de reportes de gasto personal** (MOD-04) y de `update_budget_spent()` — no es un gasto discrecional del usuario, es un préstamo.

**Flujo B — vínculo retroactivo, monto completo o parcial:**
1. Usuario ya registró un gasto normal en MOD-04 (ej. pagó $80 de súper con su tarjeta; $40 eran para su mamá).
2. Desde el detalle del gasto, usa "Vincular a préstamo MOD-13" — crea (o selecciona) un `family_loans`, le asigna `transaction_id` = el gasto existente, y opcionalmente especifica `linked_amount` si solo una parte es el préstamo (deja vacío si es el 100%).
3. Validación: `linked_amount`, si se especifica, no puede superar `transactions.amount` de la transacción vinculada.

**Regla de exclusión en `update_budget_spent()` y reportes de MOD-04** (aplica a ambos flujos, resuelve el split correctamente):
```
monto_excluido_de_gasto_personal = COALESCE(family_loans.linked_amount, transactions.amount)
```
Es decir: si `linked_amount` es `NULL`, se excluye el monto completo (préstamo = 100% de la transacción). Si tiene un valor, solo se excluye esa porción — el resto sigue contando como gasto normal del usuario. Una transacción puede tener **como máximo un préstamo vinculado** (v1) — no se soportan múltiples préstamos sobre la misma transacción.

**Abonos:** cuando el familiar paga, se crea una `transactions` (`kind='income'`, `income_type='loan_payment'` a través de `income_entries`) igual que cualquier cobro — pero por la regla ya vigente del sistema, nunca se cuenta como ingreso confirmado en presupuesto hasta que efectivamente se recibe.

---

## 4. KPIs (7)
Total prestado/año · total pendiente · deudor con mayor saldo (agregado por `person_name`) · préstamos sin abono >30 días · % del ingreso mensual expuesto en préstamos activos · costo de oportunidad (qué hubiera rendido ese dinero invertido) · tasa de recuperación histórica (% del monto prestado que históricamente se ha cobrado).

---

## 5. Integración FINN

Regla dura nueva: **si el usuario selecciona `delivery_method = 'credit_cash_advance'` al crear un préstamo, FINN interrumpe con una advertencia antes de guardar** (no bloquea, pero exige reconocimiento explícito):

> "Alerta: un retiro de efectivo con tarjeta no tiene período de gracia — los intereses corren desde hoy mismo, más la comisión de retiro. Es la forma más cara de prestar dinero. ¿Confirmas que no puedes usar transferencia o efectivo de tu cuenta de ahorro en su lugar?"

Consultas frecuentes que FINN debe poder responder con datos reales (vía tool calling, mismo patrón que MOD-04):
- "¿Cuánto me deben en total?"
- "¿Quién me debe más?"
- "¿Qué preso está atrasado?" *(sic — préstamo)*
- "¿Cuánto me ha costado en intereses prestarle a [persona] con mi tarjeta?"

---

## 6. Páginas / UI (a construir)

- `/app/prestamos` — lista de préstamos activos, agrupados por deudor, con saldo pendiente y estado (al día / sin abono >30 días en amarillo/rojo)
- `/app/prestamos/nuevo` — formulario (campos §2.1), con selector de `delivery_method` que muestra la advertencia de FINN inline si se elige `credit_cash_advance`
- `/app/prestamos/[id]` — detalle: historial de abonos, adjuntos (reusa `AttachmentsSection` ya construido), botón "Registrar abono"
- `/app/prestamos/[id]/editar` — editar términos (mismo patrón de edición ya establecido en el resto del sistema)
- Integración en Gastos (`/app/gastos/[id]`): botón "Vincular a préstamo" cuando la transacción no está ya vinculada
- Integración en Dashboard: tarjeta de resumen "Préstamos activos" si el usuario tiene alguno (mismo patrón que las tarjetas de resumen ya existentes)

---

## 7. Reglas de negocio (heredadas + nuevas)

1. Los abonos de préstamos familiares **nunca cuentan como ingreso confirmado** en presupuesto hasta recibirse (regla ya vigente, documentada en spec maestro).
2. El dinero prestado **nunca cuenta como gasto personal** del usuario en reportes de MOD-04 ni en `update_budget_spent()`.
3. Un préstamo vía tarjeta/cuenta **siempre** tiene una `transactions` real detrás — nunca se registra el monto "flotando" sin afectar el saldo real de donde salió.
4. `credit_cash_advance` requiere reconocimiento explícito del usuario ante la advertencia de FINN antes de guardar.
