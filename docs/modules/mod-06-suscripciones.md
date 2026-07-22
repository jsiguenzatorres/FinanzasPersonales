# MOD-06 — Suscripciones Recurrentes

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `subscriptions`, `transactions`, `categories`
> **Status:** El esqueleto de base de datos ya existe (migración `20260630121300`, tabla `subscriptions`) — sin código de aplicación todavía.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Detecta y trackea los cargos recurrentes del usuario (Netflix, gimnasio, Spotify, etc.): cuánto paga, cada cuándo, cuándo se renueva. Dos formas de entrar una suscripción: **detección automática** analizando el historial de transacciones, o **registro manual**. El objetivo es que el usuario vea de un vistazo cuánto se le va en suscripciones al mes — algo que normalmente nadie suma hasta que ya es tarde.

### 1.2 Qué NO hace (v1)
- **No se conecta al motor de `recurrings`** (la tabla que genera transacciones automáticas). Investigué: el cron `process-recurrings` ya está programado pero apunta a una Edge Function que **no existe** todavía (`supabase/functions/` está vacío) — vincular suscripciones a eso hoy no generaría nada, solo daría una falsa sensación de automatización. `subscriptions` queda autocontenida: tiene su propio `next_charge_date` que se actualiza directamente, sin depender de esa tubería.
- No cancela suscripciones por ti ni abre `cancel_url` automáticamente — es informativo, la acción la hace el usuario.
- No calcula `usage_score` con IA en v1 — es un campo manual (1-5, "¿qué tanto la usas?") para ayudar a decidir qué cancelar.
- La detección es **bajo demanda** (botón "Analizar mis gastos"), no un cron en segundo plano — coherente con cómo ya funciona OCR/clasificación de gastos en el resto de la app, sin infraestructura nueva.

### 1.3 Alcance v1 vs. después

| Feature | v1 | Después |
|---|---|---|
| CRUD manual de suscripciones | ✅ | — |
| Detección automática bajo demanda (§3) | ✅ | — |
| Confirmar/descartar sugerencias detectadas | ✅ | — |
| `usage_score` manual | ✅ | IA la sugiere sola |
| Alerta "se renueva en N días" | ✅ | — |
| Detección automática en segundo plano (cron) | ❌ | ✅ cuando exista `process-recurrings` |
| Auto-generar la transacción del cargo cada mes | ❌ | ✅ cuando exista el Edge Function |
| Sugerir cancelación por bajo uso | ❌ | ✅ Fase 3 |

---

## 2. Detección automática — diseño

Dos pasos, para no gastar tokens de Gemini analizando cada transacción una por una:

### 2.1 Filtro determinístico (sin IA, gratis)
Sobre las transacciones de gasto de los últimos 4 meses (`kind IN ('expense','cc_charge')`, no eliminadas), agrupa por `merchant_name` normalizado (minúsculas, sin espacios extra). De cada grupo con **2 o más cargos**, calcula: monto promedio, variación del monto (¿son consistentes, dentro de ~10%?), e intervalo promedio entre fechas en días. Descarta grupos donde el intervalo es muy irregular (ej. compras esporádicas al mismo súper no son una "suscripción").

### 2.2 Confirmación con Gemini (solo para los candidatos que pasan el filtro)
Para cada grupo candidato, se le pregunta a Gemini (mismo patrón que `classifyExpenseCategory`): dado el nombre del comercio, los montos y el intervalo detectado, ¿es razonable que sea una suscripción real? Si sí, que sugiera nombre de servicio limpio (ej. "netflix.com" → "Netflix") y la frecuencia más probable (`weekly`/`monthly`/`yearly`).

### 2.3 Resultado: sugerencias, nunca automático de verdad
Los candidatos confirmados por Gemini aparecen en `/app/suscripciones` como **sugerencias** — el usuario las revisa una por una: "Sí, es una suscripción" (crea la fila en `subscriptions` con `detected_automatically=true`) o "No, descartar". Nunca se crea nada en la tabla sin que el usuario lo confirme — mismo principio que el resto de la app.

---

## 3. Campos (ya existen, sin cambios de esquema)

| Campo | Tipo | Notas |
|---|---|---|
| `service_name` | text | "Netflix", "Gimnasio Body Fitness" |
| `plan` | text | opcional — "Premium", "Mensual" |
| `amount` / `currency` | numeric / char(3) | |
| `frequency` | enum `recurrence_freq` | reutiliza el enum ya usado en `recurrings` |
| `next_charge_date` | date | se recalcula manualmente al confirmar un cargo (§4) |
| `category_id` | uuid → categories | opcional |
| `card_id` / `account_id` | uuid | de dónde sale el cargo |
| `detected_automatically` | boolean | true si vino de §2, false si se agregó a mano |
| `is_active` | boolean | |
| `cancel_url` | text | opcional, informativo |
| `usage_score` | numeric | 1-5 manual |
| `free_trial_until` | date | opcional |

## 4. Avanzar `next_charge_date`

Sin cron que lo haga solo (§1.2), el usuario avanza la fecha manualmente con un botón "Ya se cobró" en el detalle de la suscripción: suma `frequency` a `next_charge_date` (mensual +1 mes, anual +1 año, etc.) — no crea ninguna transacción, solo mantiene la fecha de referencia al día para la alerta de §5.

## 5. Decisiones cerradas (2026-07-20)

1. ✅ **Detección de §2 tal cual** — filtro determinístico + confirmación con Gemini, siempre como sugerencia a aprobar.
2. ✅ **Alerta condicional en dashboard** — mismo patrón que Préstamos/Metas, aparece solo si hay una suscripción por cobrarse en los próximos 3 días.
3. ✅ **`get_subscriptions` se agrega en este mismo corte.**
