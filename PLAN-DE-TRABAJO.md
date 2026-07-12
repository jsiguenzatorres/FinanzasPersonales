# FlowFinance — Plan de Trabajo Completo

> **Stack confirmado:** Supabase (BDD + Auth + Storage + Edge Functions) · Hostinger VPS (cómputo pesado y jobs) · Gemini 2.5 Flash / Flash-Lite (asistente FINN, OCR, ML conversacional) · Next.js 15 (web) · React Native + Expo (móvil, Fase 2)
>
> **Doc de producto fuente:** `flowfinance-maestro-completo-1.html` (20 módulos)
> **País de lanzamiento:** El Salvador (USD nativo). LATAM (MX/GT/HN/CO/AR/ES/BR) en Fase 3.
> **Última actualización:** 2026-07-09

---

## Cambios estratégicos respecto al doc maestro

1. **Gemini 2.5 Flash** reemplaza a Claude API en todo FINN, OCR, dictado y categorización ML conversacional.
   - **Gemini 2.5 Flash-Lite** para tareas simples (clasificación de transacciones, daily brief breve).
   - **Gemini 2.5 Flash** para conversación, análisis, simulador y multimodal (recibos).
2. **Sin Open Banking en MVP.** Entrada manual + importación CSV/Excel + OCR de recibos (Gemini Vision). Belvo se integra en Fase 2.
3. **Web primero, móvil después.** PWA instalable con `next-pwa` cubre el 80% del valor. React Native llega en Fase 2.
4. **Sin FastAPI/Celery en MVP.** Supabase Edge Functions (Deno) + `pg_cron` + Realtime cubren MVP completo. El VPS Hostinger entra cuando necesitemos ML pesado (Fase 2).
5. **MVP reducido a 7 módulos** (vs. 9 propuestos): MOD-00, 01, 02, 03, 04, 15, 17. MOD-08 FINN entra al final del MVP en versión básica.
6. **Schema completo (~28 tablas) desde Fase 0.** Migrar schema con datos reales es brutalmente costoso.
7. **Solo México en MVP.** Catálogo fiscal, formato de fechas/moneda, validaciones RFC.

---

## Estructura del repositorio (decisión arquitectónica)

```
flowfinance/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   └── mobile/                 # React Native + Expo (Fase 2)
├── packages/
│   ├── ui/                     # shadcn/ui + tema FlowFinance
│   ├── shared/                 # tipos TS, schemas Zod, utilidades
│   └── finn/                   # cliente Gemini + prompts + tools
├── supabase/
│   ├── migrations/             # SQL versionado
│   ├── functions/              # Edge Functions (Deno)
│   ├── seed.sql
│   └── policies/               # RLS por tabla
├── vps/                        # Fase 2: FastAPI + Docker compose
│   ├── api/
│   ├── workers/
│   └── docker-compose.yml
└── docs/                       # specs técnicas por módulo
```

Monorepo con **pnpm workspaces** + **Turborepo**.

---

# FASE 0 — Cimientos (Semanas 1-3)

> **Objetivo:** todo lo que no se ve pero sin lo cual no se puede construir nada.

## 0.1 Setup de infraestructura (Semana 1)
- [ ] Crear repo Git (GitHub privado) + monorepo con pnpm + Turborepo
- [ ] Proyecto Supabase: `flowfinance-dev` y `flowfinance-prod`
- [ ] Configurar Supabase CLI local + migraciones versionadas
- [ ] **VPS Hostinger (deploy desde día 1):**
  - Ubuntu 24.04 LTS
  - Docker + Docker Compose
  - Nginx reverse proxy
  - Let's Encrypt (certbot) con renovación automática
  - UFW firewall (solo 22, 80, 443)
  - Fail2ban
  - Usuario non-root con sudo, deshabilitar login root, SSH key only
  - Dominio `flowfinance.app` apuntando al VPS (A record)
  - Subdominios: `app.flowfinance.app` (web), `api.flowfinance.app` (Fase 2)
- [ ] Cuenta Google AI Studio + API key Gemini (variable de entorno, NUNCA en repo)
- [ ] Cuenta Stripe México (modo test)
- [ ] Cuenta Resend (emails transaccionales)
- [ ] GitHub Actions:
  - Lint + test + build en cada PR
  - Deploy a VPS vía SSH al hacer merge a `main`
  - Secrets en GitHub Actions: `VPS_SSH_KEY`, `VPS_HOST`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`
- [ ] **Pipeline de deploy:** GitHub Actions build → `docker build` → push imagen a GHCR → SSH al VPS → `docker compose pull && up -d` → health check
- [ ] Next.js corriendo en VPS:
  - Build modo `standalone` (Next.js 15)
  - Imagen Docker basada en `node:22-alpine`
  - Variables de entorno desde `.env` montado vía volumen o Docker secrets
  - PM2 NO necesario si usamos Docker (Docker maneja restart)

## 0.2 Schema completo de base de datos (Semana 1-2)
Diseñar y migrar **las 28 tablas** del sistema completo. Aunque solo se usen 12 en MVP, el schema debe contemplar el resto para evitar migraciones destructivas después.

**Tablas core (12):**
`users`, `accounts`, `categories`, `subcategories`, `transactions`, `income_entries`, `budgets`, `budget_categories`, `credit_cards`, `cc_statements`, `recurrings`, `audit_log`

**Tablas avanzadas (16):**
`goals`, `goal_contributions`, `subscriptions`, `investments`, `family_loans`, `family_loan_payments`, `loan_portfolio`, `loan_amortizations`, `debts`, `debt_payments`, `net_worth_snapshots`, `trips`, `trip_expenses`, `tax_records`, `flow_scores`, `finn_conversations`, `simulations`, `notifications`, `gamification_events`, `collab_spaces`, `collab_members`

## 0.3 Row Level Security (Semana 2)
- [ ] Policy template: cada tabla con `user_id` filtra por `auth.uid()`
- [ ] Tablas colaborativas: política basada en `collab_members`
- [ ] Función `is_member(space_id)` reutilizable
- [ ] Tests de RLS con dos usuarios cruzando datos (deben fallar)

## 0.4 Auth + Onboarding base (Semana 2-3)
- [ ] Supabase Auth: email/password + Google OAuth + Apple (Fase 2)
- [ ] Flujo de signup con verificación de email
- [ ] Tabla `users` con trigger que crea fila al registrarse
- [ ] Onboarding wizard básico (3 pasos: perfil, primer ingreso, primera cuenta)
- [ ] Reset password
- [ ] Sesión persistente + refresh tokens

## 0.5 Design system (Semana 3)
- [ ] shadcn/ui instalado + tema custom FlowFinance (dark + light)
- [ ] Tokens de diseño según paleta del doc (`--g: #00E5A0`, etc.)
- [ ] Fuentes Syne + DM Sans + DM Mono
- [ ] Componentes base: Button, Input, Card, Modal, Toast, Sheet, Table
- [ ] Layout base con sidebar y mobile bottom-nav
- [ ] Storybook (opcional, recomendado)

## 0.6 i18n + formato regional (Semana 3)
- [ ] `next-intl` configurado, locale `es-MX` por defecto
- [ ] Helpers de formato: moneda USD, fechas, números (locale es-SV)
- [ ] Catálogo de strings en JSON (preparar estructura multi-locale)

## 0.7 Observabilidad (Semana 3)
- [ ] Sentry web + Sentry para Edge Functions
- [ ] Logs estructurados (Pino)
- [ ] Health check endpoint
- [ ] Status page interna `/admin/status`

**Entregable Fase 0:** Usuario puede registrarse, hacer login, ver dashboard vacío con sidebar. Todo el schema existe. RLS funciona. Pipeline de deploy verde.

---

# FASE 1 — MVP Web (Semanas 4-16, ~4 meses)

> **Objetivo:** un usuario mexicano puede registrarse, capturar sus ingresos y gastos, ver presupuesto en tiempo real, controlar tarjetas, y tener un FINN básico que le habla cada mañana. Pagar suscripción.

## Sub-fase 1.1 — Captura de datos (Semanas 4-7)

### MOD-00 — Ingresos
- 8 tipos de ingreso (laboral, freelance, renta, rendimientos, abonos préstamos, eventuales, negocio, otros)
- Bruto vs neto, deducciones fiscales
- Recurrentes con cron de creación automática
- Multi-moneda con conversión automática (ExchangeRate-API)
- 14 reportes del módulo según doc
- **Spec técnica detallada antes de codear** (`docs/mod-00-ingresos.md`)

### MOD-02 — Cuentas bancarias
- 8 tipos de cuenta (débito, crédito, efectivo, ahorro, inversión, billetera digital, divisas, virtual)
- Bolsillos virtuales (JSONB en `accounts.virtual_buckets`)
- Conciliación bancaria manual
- Proyección de saldo a 90 días (cálculo determinista, no ML aún)
- Importación CSV (BBVA, Banorte, Santander, Citibanamex)

### MOD-04 — Gastos
- Registro manual rápido (≤ 3 taps)
- OCR de recibos con **Gemini 2.5 Flash multimodal** (subir foto → JSON estructurado)
- Categorización automática (Gemini Flash-Lite por costo)
- Categorías predefinidas (8 grupos × 5 subcategorías del doc)
- Edición masiva, búsqueda, filtros
- Adjuntar foto en Supabase Storage

### MOD-15 — Tarjetas de crédito
- Día de corte y día de pago
- Saldo actual, límite, % uso
- Cálculo de pago para no generar intereses
- Estados de cuenta importables (PDF parseado por Gemini)

## Sub-fase 1.2 — Visión y control (Semanas 8-11)

### MOD-01 — Dashboard principal
- 8 widgets personalizables (drag & drop con `dnd-kit`)
- Patrimonio neto live, flujo del mes, alertas, metas, presupuesto, liquidez, FINN brief, FlowScore
- KPIs visibles directamente
- Realtime subscriptions de Supabase para actualizar al instante

### MOD-03 — Presupuesto híbrido
- 3 modos: zero-based, flexible, 50/30/20
- Flujo de creación en 5 pasos según doc
- 8 categorías con subcategorías
- 10 KPIs en tiempo real
- Alertas configurables por umbral (50%, 80%, 100%, sobregirado)
- Rollover automático mes a mes

### MOD-17 — Patrimonio neto
- Cálculo automático: activos (cuentas + inversiones + cartera) − pasivos (tarjetas + deudas + préstamos recibidos)
- Snapshot semanal con `pg_cron`
- Gráfica histórica 12 meses

## Sub-fase 1.3 — Inteligencia + monetización (Semanas 12-16)

### MOD-08 — FINN básico (Gemini 2.5 Flash)
- Daily brief generado cada mañana 7am vía `pg_cron` + Edge Function
- Chat libre con context-window de últimos 30 días del usuario
- Function calling: FINN puede consultar tablas, no inventar
- Sistema de prompts versionado en `packages/finn/prompts/`
- Tools que FINN puede invocar: `get_budget_status`, `get_recent_transactions`, `get_account_balance`, `calculate_savings_rate`
- Personalidad y capacidades de FINN escaladas por plan (ver `docs/modules/mod-08-finn.md`): Free "FINN Básico" · Starter "Tu Compañero" · Pro "Tu Asesor Personal" (ejecuta acciones, memoria de contexto) · Elite "Tu Socio Estratégico" (+ protocolo de bienestar financiero)

### Onboarding conversacional con FINN
- Reemplazar wizard estático por conversación guiada
- FINN pregunta: ¿cuánto ganas?, ¿qué tarjetas tienes?, ¿metas?, etc.
- Crea registros en BDD mientras conversa

### Monetización (Stripe)
- 4 planes: Free (gratis) · Starter $4.99 USD · Pro $11.99 USD · Elite $24.99 USD
- Stripe Checkout + Customer Portal
- Webhooks en Edge Function para actualizar `users.plan`
- Trial 14 días sin tarjeta
- Política de degradación al downgrade

### Seguridad y UX final MVP
- WebAuthn (biometría web con Touch ID / Windows Hello)
- 2FA por TOTP
- Modo privacidad (oculta montos con blur)
- Exportación de datos en CSV y PDF
- PWA instalable

### Lanzamiento beta cerrada
- 20-50 usuarios beta seleccionados
- Form de feedback in-app
- Métricas: activación (primera transacción), retención D7/D30, NPS

**Entregable Fase 1:** Producto vendible con primeros usuarios pagando. 7 módulos funcionales + FINN básico + Stripe + PWA.

---

# FASE 2 — Expansión y móvil (Meses 5-8)

> **Objetivo:** módulos diferenciadores LATAM, app móvil nativa, ML propio, Open Banking.

## 2.1 Infraestructura adicional
- [ ] Levantar VPS Hostinger con FastAPI + Celery + Redis + Postgres-réplica (para ML)
- [ ] Docker Compose con servicios: `api`, `worker`, `beat`, `redis`
- [ ] Nginx reverse proxy `api.flowfinance.app`

## 2.2 Módulos
- **MOD-05** Metas financieras (con aportes automáticos desde ingresos)
- **MOD-06** Suscripciones recurrentes (detección automática vía Gemini sobre transacciones)
- **MOD-07** Inversiones (CETES, Cetesdirecto, acciones, cripto vía CoinGecko)
- **MOD-13** Préstamos familiares sin interés (exclusivo LATAM)
- **MOD-14** Mi Cartera — préstamos con interés (cálculo de IRR, amortización)
- **MOD-16** Deudas propias (estrategia bola de nieve vs avalancha)
- **MOD-18** WanderFinance — planificador de viajes con Gemini (itinerario IA)
- **MOD-20** Calendario maestro (vencimientos, ingresos esperados, pagos)

## 2.3 Simulador de 24 escenarios
- Cálculos en FastAPI (Python con NumPy)
- 24 escenarios: ¿qué pasa si pierdo trabajo?, ¿si pago tarjeta hoy?, ¿si invierto X?, etc.
- Cada simulación se guarda en `simulations` con `computed_impacts` JSONB
- FINN explica el resultado en lenguaje natural

## 2.4 ML propio
- Categorización con scikit-learn entrenado con datos del usuario (privado por usuario)
- Predicción de gasto mensual con Prophet
- Detección de anomalías (gastos atípicos)

## 2.5 App móvil React Native
- Expo SDK más reciente, EAS Build
- Offline-first con SQLite local + sync con Supabase
- Push notifications con Expo Notifications
- Biometría (Face ID, fingerprint)
- Widget nativo iOS/Android (liquidez del día)
- Dictado de voz con Gemini multimodal (audio → transacción)

## 2.6 Open Banking
- **Belvo** para México (sandbox primero)
- Conexión OAuth, sync de transacciones cada 6h
- Conciliación automática con transacciones manuales

**Entregable Fase 2:** App móvil en stores, 15 módulos totales, ML propio, Open Banking funcional.

---

# FASE 3 — Diferenciación (Meses 9-12)

> **Objetivo:** features que ningún competidor tiene + expansión multi-país.

## 3.1 Módulos finales
- **MOD-09** Gamificación completa (FlowScore, logros, rachas, niveles)
- **MOD-10** Reportes & analítica avanzada (custom reports, exportar a Excel/PDF)
- **MOD-11** Finanzas colaborativas (parejas, familias, roomies)
- **MOD-12** Salud financiera & alertas inteligentes
- **MOD-19** Control fiscal & deducibles (RFC, CFDI, pre-llenado declaración anual MX)

## 3.2 FINN proactivo
- **WhatsApp Business API** (vía proveedor como Twilio o Gupshup)
- FINN escribe al usuario: "tu tarjeta cierra en 3 días", "tu meta va atrasada"
- Comandos por WhatsApp: registrar gasto, consultar saldo

## 3.3 Features innovadores
- Benchmark anónimo (comparar tus métricas vs. usuarios similares)
- Modo asesor B2B (asesor financiero ve N clientes)
- Marketplace transparente (recomendación de tarjetas/inversiones sin comisiones ocultas)
- Tu Yo Ideal (visualización a 5/10/20 años)
- Aniversario financiero anual con resumen tipo "Spotify Wrapped"

## 3.4 Multi-país
- Colombia (Belvo CO), Argentina (Belvo AR), España (TrueLayer), Brasil (Belvo BR)
- i18n completo (es-MX, es-CO, es-AR, es-ES, pt-BR)
- Catálogos fiscales por país
- Multi-moneda con tipo de cambio histórico

**Entregable Fase 3:** Producto completo según doc maestro, presencia en 5 países.

---

# FASE 4 — Optimización y crecimiento (Mes 13+)

- Optimización de costos Gemini (caching, RAG con embeddings, prompt compression)
- A/B testing de pricing
- Programa de referidos
- Integraciones contables (Conduit, Bind ERP, Aspel)
- API pública para terceros
- Marketplace de plantillas de presupuesto

---

## Decisiones técnicas confirmadas (2026-06-29)

| Decisión | Elección |
|---|---|
| Hosting web frontend | **Hostinger VPS desde día 1** (Docker + Nginx + Let's Encrypt) |
| Metodología por módulo | **Spec-first** — `docs/mod-XX-nombre.md` redactado y aprobado ANTES de codear |
| Nombre y dominio | **FlowFinance** (dominio lo compra el usuario) |
| Base de datos | **Supabase** (cloud) — Postgres + Auth + RLS + Storage + Edge Functions |
| Asistente IA | **Gemini 2.5 Flash** (conversación, multimodal) + **Flash-Lite** (clasificación, daily brief) |

## Decisiones técnicas pendientes

| Decisión | Opciones | Recomendación |
|---|---|---|
| ORM/SQL | Drizzle · Prisma · Supabase client puro | **Drizzle** (type-safe, ligero, compatible RLS) |
| Validación | Zod | **Zod** (estándar TS) |
| Estado cliente | Zustand + React Query | Confirmado |
| Tests | Vitest + Playwright | Confirmado |
| Email | Resend con React Email | Confirmado |
| Push notifications | Web Push (Fase 1.3) + Expo Notifications (Fase 2) | Confirmado |
| Analytics | PostHog cloud free tier · Plausible self-hosted en VPS | **PostHog cloud** (cambiar a self-hosted si crece) |
| Sistema de logs en VPS | Docker logs + Loki + Grafana · solo Docker logs · journald | **Docker logs + rotación** (simple), Loki en Fase 2 si hace falta |
| Backup BDD | Supabase backup automático (incluido) + dump diario manual a VPS | Confirmado |

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| MVP toma >4 meses | Alta | Cortar features antes que extender tiempo. MOD-17 Patrimonio es candidato a recorte si urge. |
| Costo Gemini se dispara | Media | Flash-Lite para tareas simples · prompt caching · límites por plan estrictos |
| OCR no funciona bien con recibos mexicanos | Media | Probar con 50 recibos reales en Semana 4. Plan B: tesseract OCR + post-proceso |
| Usuarios no confían en app de finanzas nueva | Alta | Sección de seguridad muy visible · open source partes no críticas · auditoría externa Fase 3 |
| Stripe México fricciones | Baja | Tener MercadoPago como respaldo |
| Schema necesita cambios mayores | Media-alta | Diseño revisado por 2da persona antes de Fase 1 |

---

## Métricas de éxito por fase

**Fase 1 (MVP):**
- Activación: ≥40% de signups registran ≥1 transacción
- Retención D7: ≥30%
- Retención D30: ≥20%
- Conversión free → paid: ≥3%
- NPS ≥30

**Fase 2:**
- DAU/MAU ≥20%
- Sesiones móvil/web: ≥50/50
- Open Banking adoption: ≥50% de Pro users

**Fase 3:**
- ARR: $50K USD/mes
- Presencia en 3+ países
- Churn mensual <5%

---

## Próximos pasos inmediatos (esta semana)

1. ✅ Plan validado (2026-06-29)
2. ✅ Hosting: Hostinger VPS desde día 1
3. ✅ Dominio: FlowFinance (usuario lo compra)
4. ✅ Metodología: spec-first por módulo
5. **Comprar dominio FlowFinance** (`.app` recomendado para webapps, `.mx` si quieres anclar mercado MX)
6. **Acceso al VPS Hostinger** — IP, credenciales SSH, plan contratado
7. **Crear cuenta Google AI Studio** y generar API key Gemini
8. **Crear proyectos Supabase** dev y prod (free tier alcanza para arrancar)
9. Cuando los 4 anteriores estén listos → **arrancar Fase 0.1**

---

## Especificaciones técnicas pendientes (a redactar antes de cada módulo)

Cada módulo necesita su `docs/mod-XX-nombre.md` con:
- Casos de uso completos
- Endpoints (path, método, request/response)
- Tablas y campos involucrados
- RLS policies específicas
- Edge cases y validaciones
- Fórmulas exactas (cuando aplique)
- Mockups o wireframes (Figma o descripción visual)
- Plan de tests (unit + integration)

**Las specs se redactan justo antes de empezar cada módulo, no todas al inicio** — para incorporar aprendizajes de módulos anteriores.
