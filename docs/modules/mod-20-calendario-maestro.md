# MOD-20 — Calendario Financiero Maestro

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** ninguna nueva — es una vista de agregación de lectura sobre tablas ya existentes.
> **Status:** Sin código de aplicación todavía. A diferencia de los últimos 5 módulos, este no tiene esqueleto de base de datos propio — es 100% agregación.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Junta en una sola vista cronológica todo lo que tiene fecha en el futuro y afecta el dinero del usuario: ingresos esperados, cobros de suscripciones, pagos de tarjeta, cuotas de deudas y préstamos, y fechas límite de metas — para que el usuario vea de un vistazo "qué se viene" sin entrar módulo por módulo.

### 1.2 Alcance real vs. la visión del doc maestro
El doc maestro (`MD/FLOWFINANCE-SPEC.md` §3.14) describe 8 tipos de evento y 4 vistas (mensual, semanal, lista, flujo de caja) — visión completa de Fase 3+. De esos 8 tipos, 2 no existen todavía como datos reales (viajes planeados es MOD-18, no construido; obligaciones fiscales no se trackean en ningún módulo hoy) y "alertas proactivas de Neto" ya es el sistema de alertas del dashboard, no algo nuevo que agregar al calendario. v1 se queda con las **8 fuentes de datos que sí existen y ya están construidas**:

| # | Fuente | Campo de fecha |
|---|---|---|
| 1 | Ingresos esperados (pendientes de cobro) | `income_entries.expected_date` |
| 2 | Gastos/ingresos recurrentes automáticos | `recurrings.next_run_date` |
| 3 | Pago de tarjeta de crédito | `credit_cards.payment_due_day` (se calcula la próxima ocurrencia) |
| 4 | Cobro de suscripción | `subscriptions.next_charge_date` |
| 5 | Pago de deuda propia | `debts.next_payment_date` |
| 6 | Cuota de Mi Cartera (préstamo con interés que diste) | siguiente cuota pendiente de `loan_portfolio.amortization` |
| 7 | Pago acordado de préstamo familiar | `family_loans.agreed_payment_date` (si sigue activo) |
| 8 | Fecha límite de meta | `goals.target_date` |

### 1.3 Vista: solo lista cronológica en v1
El doc maestro pide 4 vistas. v1 hace **solo la vista de lista** (agrupada por fecha, próximos 60 días) — es la que más valor da con menos esfuerzo de UI, y ya cubre el caso de uso principal ("¿qué me viene esta semana/mes?"). Vista mensual tipo calendario-grid, semanal, y flujo de caja proyectado quedan para después — son mucho más trabajo de interfaz sin agregar datos nuevos, solo otra forma de mostrarlos.

## 2. Diseño de la agregación

Página `/app/calendario` (Server Component) hace 8 queries en paralelo (una por fuente de la tabla de §1.2), normaliza cada resultado a una forma común:

```ts
interface CalendarEvent {
  date: string;           // ISO
  type: 'income' | 'expense' | 'card_payment' | 'subscription' | 'debt' | 'loan_portfolio' | 'family_loan' | 'goal_deadline';
  title: string;
  amount: number | null;
  currency: string;
  href: string;            // link al módulo correspondiente
}
```

Junta todo, ordena por fecha, agrupa por día para el render (encabezado "Lunes 15 de agosto" con sus eventos debajo).

## 3. Qué NO hace (v1)

- No genera un flujo de caja proyectado (sumar/restar todo para predecir saldo futuro) — es un cálculo real pero más complejo (necesita saldo actual + todos los eventos con signo), queda para cuando se pida explícitamente.
- No es interactivo (no se puede arrastrar/reprogramar eventos desde el calendario) — cada evento linkea al módulo real donde se gestiona.
- No incluye viajes (MOD-18, no construido) ni obligaciones fiscales (no hay módulo de impuestos).

## 4. Decisiones cerradas (2026-07-20)

1. ✅ **8 fuentes de §1.2 tal cual** — sin viajes ni fiscal.
2. ✅ **Vista de lista cronológica** agrupada por día para v1.
3. ✅ **Ventana de 60 días** hacia adelante.
