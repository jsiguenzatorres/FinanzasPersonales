# MOD-16 — Deudas Propias

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `debts`, `debt_payments`, `v_net_worth_current` (se modifica)
> **Status:** El esqueleto de base de datos ya existe (migración `20260630121600`) — sin código de aplicación todavía.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Trackea deudas propias del usuario (préstamos personales, hipoteca, auto, estudiantil, otras) y calcula un simulador de estrategia de pago: **bola de nieve** (ataca primero la deuda con el saldo más pequeño — victorias rápidas, motivación) vs. **avalancha** (ataca primero la de tasa de interés más alta — matemáticamente óptima, ahorra más en intereses).

### 1.2 Qué NO hace (v1) — y una aclaración de alcance importante
- **No incluye deuda de tarjetas de crédito.** `debts.type` técnicamente permite `credit_card` (mismo enum `liability_type` que usa Patrimonio), pero esa deuda YA se trackea en el módulo Tarjetas (MOD-15, del MVP) y ya suma a patrimonio neto por su cuenta. Registrar la misma tarjeta también aquí duplicaría el pasivo en el patrimonio. La UI no lo bloquea a nivel de base de datos, pero el formulario y la copia dejan claro que esto es para préstamos personales/hipoteca/auto/estudiantil — tarjetas van en Tarjetas.
- **No genera una tabla de amortización pre-calculada** como Mi Cartera (MOD-14). Ahí el usuario ES quien presta y controla los términos exactos; aquí el usuario ES quien debe, y normalmente ya tiene una tabla de su banco — solo necesita trackear el saldo y simular estrategia. Cada abono estima el interés del período con una fórmula simple (`saldo_actual * tasa_anual / 12`), no sigue un cronograma fijo.
- El simulador de estrategia (§3) es una calculadora que corre **en el momento**, no un job en segundo plano — se recalcula cada vez que se visita la página, con los saldos actuales.

### 1.3 Alcance v1 vs. después

| Feature | v1 | Después |
|---|---|---|
| CRUD de deudas (préstamo personal, hipoteca, auto, estudiantil, otra) | ✅ | — |
| Registrar abono (con estimación de interés/capital) | ✅ | — |
| Simulador bola de nieve vs. avalancha vs. orden personalizado | ✅ | — |
| Deudas suman a patrimonio neto como pasivo | ✅ | — |
| Alerta de próximo pago | ✅ | — |
| Refinanciar con recálculo de términos | ❌ | ✅ si hace falta |
| Integración con tarjetas de crédito en el mismo simulador | ❌ | ✅ Fase 3, evaluar sin duplicar patrimonio |

---

## 2. Registrar un abono — estimación simple

A diferencia de Mi Cartera (MOD-14, con tabla de amortización exacta), aquí no hay cronograma pre-generado. Al registrar un abono:

```
interest_portion = round(current_balance * (interest_rate_annual / 100 / 12), 2)
principal_portion = amount - interest_portion   (si amount < interest_portion, todo es interés, principal_portion = 0)
current_balance -= principal_portion
```

Si `current_balance` llega a 0, `status` pasa a `'paid'`.

---

## 3. Simulador de estrategia — diseño

Página aparte (`/app/deudas/estrategia`) que corre esta simulación con los saldos actuales:

1. **Toma** todas las deudas activas (`saldo`, `tasa anual`, `pago mínimo mensual`) + un monto extra mensual que el usuario indica que puede destinar a pagar deuda más rápido de lo mínimo.
2. **Para cada estrategia** (bola de nieve: ordena por saldo ascendente; avalancha: ordena por tasa descendente), simula mes a mes: paga el mínimo a todas las deudas, y el monto extra completo a la deuda de mayor prioridad — cuando esa se salda, su pago mínimo se suma al monto extra disponible para la siguiente (el efecto "bola de nieve" real, aplica a ambas estrategias por igual, es el mecanismo de acumulación, no el nombre).
3. **Muestra lado a lado**: meses hasta quedar libre de deudas, interés total pagado, para que el usuario compare y decida.
4. **Al confirmar una estrategia**, se guarda `debts.strategy` (mismo valor en todas las deudas activas del usuario) y `debts.payoff_priority` (1, 2, 3... según el orden calculado) — así el dashboard y Neto pueden mostrar "tu próxima deuda a atacar" sin re-simular cada vez.

**Nota de diseño:** el esquema tiene `strategy` a nivel de fila (`debts.strategy`), pero conceptualmente la estrategia es una decisión de portafolio completo, no por deuda individual — por eso se escribe el mismo valor a todas las deudas activas al confirmar, en vez de permitir que cada una tenga una estrategia distinta (no tendría sentido: "bola de nieve" en una deuda y "avalancha" en otra no es una estrategia coherente).

---

## 4. Integración con patrimonio neto

`debts.current_balance` (WHERE `status = 'active'`) se suma a `v_net_worth_current` como un **nuevo bucket de pasivo** (`personal_debts`, distinto de `credit_cards`/`overdrafts`/`manual` que ya existen) — es dinero que el usuario debe, reduce su patrimonio neto.

## 5. Campos (ya existen, sin cambios de esquema)

| Campo | Tipo | Notas |
|---|---|---|
| `name` / `creditor` | text | "Préstamo Banco Agrícola", "Banco Agrícola" |
| `type` | enum `liability_type` | `personal_loan, mortgage, auto_loan, student_loan, other` en la práctica (ver §1.2 sobre `credit_card`) |
| `original_amount` / `current_balance` | numeric | |
| `interest_rate_annual` | numeric | anual, no mensual (distinto de Mi Cartera que usa tasa mensual) |
| `term_months` / `monthly_payment` | numeric | informativos, de referencia del banco |
| `next_payment_date` / `next_payment_amount` | date / numeric | para la alerta del dashboard |
| `strategy` | enum `debt_strategy` | `snowball, avalanche, custom` — se escribe al confirmar el simulador |
| `payoff_priority` | smallint | orden calculado por el simulador |

## 6. Decisiones cerradas (2026-07-20)

1. ✅ **Tarjetas fuera de este módulo** — solo aclaración en la UI, sin bloqueo a nivel de base de datos.
2. ✅ **Estimación automática de interés/capital** — saldo × tasa anual / 12.
3. ✅ **Simulador tal cual §3** — bola de nieve/avalancha con monto extra mensual, comparación lado a lado, confirmar escribe la estrategia a todas las deudas activas.
4. ✅ **Alerta condicional en dashboard** — próximo pago.
5. ✅ **`get_debts` se agrega en este mismo corte** — mismo patrón que los módulos anteriores.
