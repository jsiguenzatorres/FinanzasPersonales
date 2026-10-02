# Feature — Recordatorios de Cobro por Correo

> **Versión:** 1.0 — **APROBADA** (2026-10-01)
> **Toca:** `family_loans` (MOD-13), `loan_portfolio` (MOD-14), tabla `notifications` (ya existía en el esquema, sin usar)
> **Tipo:** Feature transversal, no un módulo numerado nuevo.

---

## 1. Propósito

Hoy, el titular solo se entera de que un préstamo (familiar o con interés) está vencido cuando
entra a la app — y tiene que escribirle él mismo a la persona para cobrar. Esta feature envía
recordatorios automáticos **por correo directamente a quien debe**, sin que el titular tenga que
hacer nada:

- **Preventivo:** 3 días y 2 días antes de la fecha de pago acordada.
- **Posterior:** cada 5 días mientras el préstamo siga `active` y vencido, hasta que se marque
  como pagado (o se detiene si se marca `written_off`/`restructured`/`defaulted` — ya no tiene
  sentido seguir insistiendo automáticamente en esos estados).
- El titular recibe copia oculta (BCC) de cada correo enviado, para saber qué se mandó y cuándo.

Aplica a **ambos** tipos de préstamo que el usuario le da a terceros:
- `family_loans` (Préstamos Familiares, MOD-13) — sin interés.
- `loan_portfolio` (Mi Cartera, MOD-14) — con interés, por cuotas.

## 2. Hallazgo clave: tabla `notifications` ya existía

El esquema de Supabase ya tenía una tabla `notifications` genérica, nunca conectada a nada:

```
channel: 'in_app' | 'email' | 'push' | 'whatsapp' | 'sms'
status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
kind: alert_kind (incluye 'loan_overdue', ya anticipado)
related_entity_id / related_entity_type
scheduled_for, sent_at, delivered_at, failed_reason
title, body, action_label, action_url, metadata (jsonb)
```

Se usa como la bitácora de cada recordatorio enviado (o fallido), en vez de inventar columnas
sueltas de "último recordatorio" en cada tabla de préstamos. Esto también deja la puerta abierta
a mover ahí, más adelante, las demás alertas que hoy solo se calculan al vuelo en el dashboard
(`apps/web/src/lib/dashboard/alerts.ts`) — pero eso es trabajo futuro, no parte de esta feature.

## 3. Cambios de esquema

- `family_loans`: agrega columna `person_email text null` (no existía; `loan_portfolio` ya tenía
  `borrower_email`/`borrower_phone`).
- Ninguna otra migración — la tabla `notifications` ya está lista tal cual.

## 4. Lógica de elegibilidad (por préstamo activo, corre 1 vez al día)

Para `family_loans` la fecha de referencia es `agreed_payment_date`. Para `loan_portfolio` es la
fecha de vencimiento de la **próxima cuota no pagada**, derivada de la columna `amortization`
(jsonb) con `packages/shared/src/utils/amortization.ts`.

```
days_until = fecha_referencia - hoy

si days_until == 3 o days_until == 2  → recordatorio preventivo (una vez por cada hito)
si days_until <= 0                     → recordatorio de vencido, cada 5 días desde el último
```

Para no duplicar envíos el mismo día, antes de enviar se verifica si ya existe una fila en
`notifications` con `related_entity_id = <id del préstamo>` y `metadata->>'trigger'` igual al
hito correspondiente (`preventive_3d`, `preventive_2d`, u `overdue`) creada **hoy**. Para el caso
`overdue`, además se exige que la última notificación de ese tipo tenga más de 5 días.

Se omite cualquier préstamo sin correo de contacto (`person_email` / `borrower_email` nulo) —
no hay a quién escribirle.

## 5. Disparo

Vercel Cron (`vercel.json`) llama una vez al día (8:00am hora El Salvador = 14:00 UTC) a
`GET /api/cron/loan-reminders`, protegido con el header `Authorization: Bearer $CRON_SECRET`.
La ruta recorre todos los préstamos activos con correo de contacto, evalúa elegibilidad, inserta
la notificación en estado `pending`, envía el correo vía Resend, y actualiza el estado a `sent`
o `failed` (con `failed_reason`).

## 6. Envío de correo

Vía Resend (`RESEND_API_KEY` / `EMAIL_FROM`, ya reservados en `.env.local` desde el inicio del
proyecto pero sin usar). Mientras `RESEND_API_KEY` sea el placeholder, el envío real falla
silenciosamente y queda registrado como `failed` en `notifications` — el usuario necesita una
cuenta real de Resend con un dominio verificado para que esto funcione en producción.

Asunto y cuerpo en español latino, tono amable y directo, con el monto, la fecha, y quién
presta (para que la persona sepa de qué trata sin tener que adivinar).
