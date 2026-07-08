# FlowFinance

> Plataforma de finanzas personales para LATAM. Lanzamiento **El Salvador** (USD), expansión a 5 países en Fase 3.
> 20 módulos · Asistente IA "FINN" con Gemini · Web PWA primero, móvil React Native después.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| **Frontend web** | Next.js 15 (App Router) · React 19 · Tailwind + shadcn/ui · Zustand · React Query · Recharts |
| **Móvil (Fase 2)** | React Native + Expo · SQLite offline · Expo Notifications |
| **Backend** | Supabase (Postgres + Auth + RLS + Storage + Edge Functions + Realtime) |
| **IA / FINN** | Gemini 2.5 Flash (conversación, multimodal) + Flash-Lite (clasificación) |
| **Hosting** | Hostinger VPS (Docker + Nginx + Let's Encrypt) desde día 1 |
| **Pagos** | Stripe (USD + MXN cuando expandamos) |
| **Email** | Resend |
| **Telemetría** | PostHog · Sentry |

---

## Estructura del monorepo

```
flowfinance/
├── apps/
│   └── web/                    Next.js 15 app principal
├── packages/
│   ├── shared/                 Zod schemas, types, utils (sv-payroll, money)
│   ├── ui/                     Design system shadcn + tokens FlowFinance
│   └── finn/                   Cliente Gemini + prompts versionados
├── supabase/
│   ├── migrations/             23 archivos SQL (39 tablas + RLS + triggers)
│   ├── functions/              Edge Functions (Deno) — se llenan en Fase 0.7
│   └── config.toml
├── vps/                        Docker + Nginx + scripts deploy
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx/
│   └── scripts/
│       ├── bootstrap-vps.sh    Setup inicial del VPS (correr una vez)
│       └── deploy.sh           Llamado por GitHub Actions
├── docs/
│   ├── schema/                 SCHEMA-COMPLETO.md (v1.1 aprobado)
│   └── modules/                Specs por módulo (MOD-00 listo)
├── .github/workflows/          CI + deploy
├── flowfinance-maestro-completo-1.html    Doc de producto fuente (20 módulos)
├── PLAN-DE-TRABAJO.md          Plan de 4 fases — fuente operativa
└── package.json                pnpm + Turborepo
```

---

## Setup local

### Prerrequisitos
- Node.js 22 (`.nvmrc` incluido)
- pnpm 9.12+
- Docker Desktop (opcional, para Supabase local)
- Supabase CLI: `npm i -g supabase`

### Pasos
```bash
# 1. Instalar deps
pnpm install

# 2. Copiar env
cp .env.example .env.local
# editar .env.local con tus claves Supabase + Gemini

# 3. Levantar Supabase local (opcional)
pnpm db:start
pnpm db:push          # aplica las 23 migraciones

# 4. Dev server
pnpm dev              # arranca apps/web en http://localhost:3000
```

---

## Comandos clave

| Comando | Acción |
|---|---|
| `pnpm dev` | Levanta el dev server (web) |
| `pnpm build` | Build de producción (todos los workspaces) |
| `pnpm lint` | ESLint en todo |
| `pnpm typecheck` | TypeScript en todo |
| `pnpm test` | Vitest |
| `pnpm test:e2e` | Playwright |
| `pnpm format` | Prettier write |
| `pnpm db:push` | Aplica migraciones SQL al Supabase enlazado |
| `pnpm db:reset` | Reinicia Supabase local + reaplica todo |
| `pnpm db:types` | Genera tipos TS desde el schema actual |
| `pnpm docker:build` | Build de imagen Docker para deploy |
| `pnpm deploy:prod` | Deploy a VPS (lo invoca GitHub Actions, no manualmente normal) |

---

## Deploy a producción (Hostinger VPS)

### Setup inicial del VPS (una sola vez)
```bash
# En el VPS Ubuntu 24.04, como root:
curl -fsSL https://raw.githubusercontent.com/<owner>/flowfinance/main/vps/scripts/bootstrap-vps.sh \
  | bash -s -- flowfinance.app admin@flowfinance.app
```

Esto instala Docker, Nginx via Docker, firewall, fail2ban, certificado Let's Encrypt y crea usuario `flowfinance` sin root.

### Deploy continuo
Cada merge a `main` dispara `.github/workflows/deploy.yml`:
1. Build de imagen Docker → push a GHCR
2. SSH al VPS → `bash vps/scripts/deploy.sh`
3. Pull imagen + aplica migraciones + recrea contenedor + reload Nginx
4. Sentry release notification

### Secrets en GitHub Actions
- `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`

---

## Documentos vivos

| Doc | Propósito |
|---|---|
| [`PLAN-DE-TRABAJO.md`](./PLAN-DE-TRABAJO.md) | Fases, módulos, decisiones técnicas |
| [`docs/schema/SCHEMA-COMPLETO.md`](./docs/schema/SCHEMA-COMPLETO.md) | Schema PostgreSQL (39 tablas, v1.1 aprobado) |
| [`docs/modules/mod-00-ingresos.md`](./docs/modules/mod-00-ingresos.md) | Spec MOD-00 Ingresos (v1.0 aprobada) |
| [`supabase/README.md`](./supabase/README.md) | Guía de migraciones SQL |
| [`flowfinance-maestro-completo-1.html`](./flowfinance-maestro-completo-1.html) | Doc de producto v4.0 — 20 módulos |

---

## Estado actual (2026-06-30)

- ✅ Fase 0.1 — Monorepo + configs + Docker + CI/CD listos para ejecutar
- ✅ Fase 0.2 — Schema completo (39 tablas) en 23 migraciones SQL
- ✅ Spec MOD-00 Ingresos aprobada
- ⏳ Pendiente accesos: dominio, VPS Hostinger, API key Gemini, proyectos Supabase
- ⏳ Próximo: spec MOD-02 Cuentas Bancarias

---

## Licencia
Proprietary — FlowFinance © 2026
