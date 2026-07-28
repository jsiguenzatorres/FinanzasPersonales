# MOD-14 — Mi Cartera (Préstamos con Interés)

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `loan_portfolio`, `loan_payments`, `v_net_worth_current` (se modifica)
> **Status:** El esqueleto de base de datos ya existe (migración `20260630121500`, confirmado como el esquema real y vigente — no fue tocado por la migración que sí reconstruyó `family_loans` después) — sin código de aplicación todavía.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Trackea dinero que el usuario presta **cobrando interés** — distinto de Préstamos Familiares (MOD-13, sin interés). Genera una tabla de amortización al crear el préstamo, registra abonos contra las cuotas, calcula mora y muestra cuánto le deben en total (capital + interés pendiente).

### 1.2 Qué NO hace (v1)
- No calcula IRR con un solver real (Newton-Raphson u otro método iterativo). Para interés compuesto (sistema francés de cuota fija), la tasa mensual configurada **es** matemáticamente la IRR del flujo, así que se guarda igual — no hace falta resolver nada. Para interés simple, calcular una IRR equivalente real es un problema numérico aparte sin mucho valor práctico para este caso de uso; queda en `null` en v1.
- No reestructura préstamos automáticamente (status `restructured` existe en el enum, se puede marcar a mano, pero no recalcula una tabla de amortización nueva sobre la marcha).
- No genera recordatorios automáticos al deudor (WhatsApp/SMS) — igual que MOD-13, eso es Fase 3.

### 1.3 Alcance v1 vs. después

| Feature | v1 | Después |
|---|---|---|
| Crear préstamo con tabla de amortización generada | ✅ | — |
| Interés compuesto (cuota fija, sistema francés) | ✅ | — |
| Interés simple (cuota fija, interés lineal) | ✅ | — |
| Registrar abono contra la siguiente cuota pendiente | ✅ | — |
| Mora automática (cuota vencida sin abonar) | ✅ | — |
| Préstamos suman a patrimonio neto como cuenta por cobrar | ✅ | — |
| IRR real (solver numérico) | ❌ | ✅ si hace falta |
| Reestructuración con recálculo de tabla | ❌ | ✅ Fase 3 |
| Recordatorios automáticos | ❌ | ✅ Fase 3 |

---

## 2. Cálculo de amortización — diseño

Al crear el préstamo (`principal`, `interest_rate_monthly`, `term_months`, `interest_type`), se genera la tabla completa de una vez y se guarda en `amortization` (jsonb, array de cuotas) — no se recalcula en cada pago, solo se marca qué cuotas ya se cobraron.

### 2.1 Interés compuesto (`interest_type='compound'`) — sistema francés, cuota fija
Fórmula estándar de amortización con cuota constante:

```
r = interest_rate_monthly / 100
M = principal * r * (1+r)^term_months / ((1+r)^term_months - 1)
```

Por cada cuota `i` (1 a `term_months`): `interest_portion = saldo_actual * r`, `principal_portion = M - interest_portion`, `saldo_nuevo = saldo_actual - principal_portion`. `irr = interest_rate_monthly` (por construcción, es la tasa exacta del flujo).

### 2.2 Interés simple (`interest_type='simple'`) — interés lineal, cuota fija
```
total_interest = principal * (interest_rate_monthly / 100) * term_months
M = (principal + total_interest) / term_months
```
Cada cuota tiene `interest_portion = total_interest / term_months` y `principal_portion = principal / term_months` constantes (no varían con el saldo). `irr` queda `null` (ver §1.2).

### 2.3 Ambos casos
`monthly_payment = M` (redondeado a 2 decimales, la última cuota ajusta el redondeo acumulado para que la suma cuadre exacto), `total_to_collect = principal + total_interest`, `payment_day` fija el día del mes de cada cuota desde `start_date`.

---

## 3. Registrar un abono

A diferencia de MOD-13 (un solo balance que baja), aquí un abono se aplica contra **la siguiente cuota pendiente** de la tabla de amortización — permite pagos parciales o completos, calcula mora si `payment_date > scheduled_date` de esa cuota (`days_late`, y si `late_fee_rate > 0` se suma un cargo por mora simple: `balance_pendiente_de_esa_cuota * late_fee_rate`). `loan_portfolio.amount_collected` sube, `balance_pending` baja, y si todas las cuotas quedan pagadas, `status` pasa a `'paid'`.

## 4. Integración con patrimonio neto

Mismo patrón que se aplicó para `family_loans` en MOD-07: `loan_portfolio.balance_pending` (WHERE `status = 'active'`) se suma a `v_net_worth_current` como cuenta por cobrar — dinero que otros te deben, con o sin interés, es un activo. Se agrega en la misma migración que ya tiene el bucket `receivables`.

## 5. Decisiones cerradas (2026-07-20)

1. ✅ **Fórmulas de §2 tal cual** — francés/cuota fija para compuesto, lineal para simple.
2. ✅ **Sin IRR real en v1** — compuesto = tasa configurada, simple = null.
3. ✅ **Alerta condicional en dashboard** — cuota vencida sin abonar.
4. ✅ **`get_loan_portfolio` se agrega en este mismo corte.**
