# FlowFinance — Especificación Técnica del Proyecto

> **Documento de referencia para desarrollo con Claude Code**
> Stack: Next.js 15 · React Native/Expo · Supabase (PostgreSQL) · Hostinger VPS (FastAPI) · Claude API
> Versión: 4.0 · Mercado objetivo: LATAM (México, Colombia, Argentina) + España

---

## 1. Visión del Producto

FlowFinance es una plataforma de finanzas personales con IA diseñada específicamente para la realidad económica de LATAM. Resuelve problemas que ninguna app del mercado cubre: préstamos informales a familiares, alto uso de efectivo, multi-moneda real, planificación fiscal y un asistente conversacional (**Neto**) con acceso completo al contexto financiero del usuario.

**Propuesta de valor en una frase:** *"Toma control total de tu dinero en 5 minutos. Neto hace el trabajo difícil por ti."*

### Diferenciadores clave vs. competencia (Monarch, YNAB, Cleo, PocketGuard, Wealthfront, Qapital, Credit Karma, Rocket Money)

1. Multi-moneda real (USD, EUR, BTC, monedas LATAM)
2. IA contextual (Claude conoce los datos reales del usuario, no respuestas genéricas)
3. Préstamos familiares sin interés (efectivo, tarjeta, transferencia, cripto)
4. Simulador de impacto financiero (24 escenarios)
5. Planificador de viajes integrado con contexto financiero (WanderFinance)
6. OCR + dictado de voz + importación PDF bancario
7. Modo crisis financiera automático
8. Control fiscal multi-país (deducibles, alertas, reportes)
9. Calendario financiero maestro unificado
10. Patrimonio neto real (Activos − Pasivos) en tiempo real
11. Importación de PDF sin requerir Open Banking
12. Sin publicidad, sin venta de datos, sin comisiones ocultas

---

## 2. Stack Tecnológico

### Frontend Web
- **Next.js 15** (App Router) — framework + SSR
- **Tailwind CSS + shadcn/ui** — sistema de diseño
- **Recharts + D3.js** — visualizaciones
- **Zustand + React Query** — estado y manejo de datos

### App Móvil
- **React Native + Expo**
- Offline-first con SQLite local
- Expo Notifications (push)
- Widgets nativos iOS/Android

### Backend — Supabase
- **PostgreSQL** como base de datos principal
- **Supabase Auth** + Row Level Security (RLS) en todas las tablas
- **Supabase Realtime** para actualizaciones en vivo
- **Supabase Storage** para recibos, PDFs y comprobantes
- **Edge Functions (Deno)** para lógica serverless ligera

### Servidor — Hostinger VPS
- **FastAPI (Python)** — API de servicios de IA/ML
- **Celery + Redis** — jobs asíncronos y colas
- **Docker + Nginx** — contenedores y reverse proxy
- **Let's Encrypt SSL** — HTTPS automático

### Inteligencia Artificial
- **Claude API (Anthropic)** — modelo `claude-sonnet-4-20250514` — Neto, resúmenes, itinerarios, desafíos
- **XGBoost** — categorización automática de transacciones
- **Prophet / LSTM** — predicción de gastos
- **Isolation Forest** — detección de anomalías/fraude
- **Google Vision AI** — OCR de recibos
- **Whisper API (OpenAI)** — dictado de voz
- **Claude Code** — asistente de desarrollo

### Integraciones Externas
- **Plaid / Belvo / TrueLayer** — Open Banking
- **ExchangeRate-API** — tipos de cambio en vivo
- **Stripe** — pagos de subscripción
- **Resend** — emails transaccionales
- **WhatsApp Business API** — notificaciones Neto (Fase 2+)
- **CoinGecko API** — precios de criptomonedas

### Seguridad
- Encriptación AES-256 en datos bancarios
- Row Level Security (RLS) en Supabase
- Biometría (Face ID / huella) + PIN de emergencia con datos ficticios
- 2FA obligatorio para acciones críticas
- Session timeout + JWT con expiración corta
- Audit log inmutable de acciones del usuario

---

## 3. Arquitectura de Módulos (20 módulos)

| # | Módulo | Prioridad de desarrollo |
|---|---|---|
| MOD-00 | Ingresos | Fase 1 |
| MOD-01 | Dashboard Principal | Fase 1 |
| MOD-02 | Cuentas Bancarias | Fase 1 |
| MOD-03 | Presupuesto Híbrido | Fase 1 |
| MOD-04 | Control de Gastos | Fase 1 |
| MOD-05 | Metas Financieras | Fase 2 |
| MOD-06 | Suscripciones y Facturas | Fase 2 |
| MOD-07 | Inversiones y Portafolio | Fase 2 (básico) / Fase 3 (alternativo) |
| MOD-08 | Neto — Asistente IA | Fase 1 (básico) / escalado en Fase 2-3 |
| MOD-09 | Gamificación + FlowScore | Fase 2 |
| MOD-10 | Reportes y Analítica | Fase 2-3 |
| MOD-11 | Finanzas Colaborativas | Fase 3 |
| MOD-12 | Salud Financiera y Alertas | Fase 3 |
| MOD-13 | Préstamos Familiares | Fase 2 |
| MOD-14 | Mi Cartera (préstamos con interés) | Fase 3 |
| MOD-15 | Tarjetas de Crédito | Fase 1 |
| MOD-16 | Deudas Propias | Fase 2 |
| MOD-17 | Patrimonio Neto | Fase 1 (básico) |
| MOD-18 | WanderFinance (Planificador de Viajes) | Fase 2 |
| MOD-19 | Control Fiscal | Fase 3 |
| MOD-20 | Calendario Financiero Maestro | Fase 2 |

### 3.1 MOD-00 — Ingresos

8 tipos soportados: Laboral, Freelance/Proyectos, Renta de Inmuebles, Rendimientos/Inversiones, Ingreso por Préstamos (vinculado a MOD-13/14), Ingresos Eventuales, Pensión/Jubilación, Negocio Propio.

Campos: tipo, subcategoría, fuente, monto bruto/neto, moneda, tipo de cambio, fecha, recurrencia, cuenta destino, asignación a meta, evidencia, marcador fiscal, tags.

14 reportes: total del mes, distribución por fuente, evolución 12 meses, ingresos en divisas, ratio ingreso/gasto, recurrentes vs. variables, esperado vs. real, ingreso neto post-compromisos, historial cobranza freelance, avance meta de ingreso, ingreso por hora, calendario de ingresos, resumen IA semanal, proyección 3/6/12 meses.

### 3.2 MOD-01 — Dashboard Principal

8 widgets personalizables: Patrimonio Neto Live, Flujo del Mes, Top 5 Alertas, Metas Top 3, Semáforo Presupuesto, Liquidez Libre Hoy, **Neto Daily Brief**, FlowScore + Racha.

El Neto Daily Brief se genera cada mañana vía Claude API con: liquidez actual, alertas de presupuesto, vencimientos próximos, estado de préstamos otorgados, y **1 acción concreta recomendada**.

### 3.3 MOD-02 — Cuentas Bancarias

8 tipos de cuenta: Corriente, Ahorro (con bolsillos virtuales), Nómina, Divisa Extranjera, Efectivo/Cartera, Billetera Digital (PayPal/MercadoPago/CoDi), Inversión, Mancomunada/Familiar.

Features clave:
- **Bolsillos virtuales**: sub-asignaciones dentro de una cuenta de ahorro sin abrir cuentas reales adicionales
- **Transferencias internas**: nunca se registran como gasto/ingreso (evita doble conteo)
- **Conciliación bancaria**: marcar transacciones revisadas, detectar discrepancias
- **Importación PDF**: extracción de transacciones vía Claude + Vision sin requerir Open Banking
- **Liquidez real**: saldo total − comprometido a metas − gastos fijos pendientes
- **Proyección de saldo**: a 30/60/90 días

### 3.4 MOD-03 — Presupuesto Híbrido (módulo crítico — máximo detalle)

**3 modos de presupuesto:**
1. **Zero-Based**: cada peso recibe asignación antes de gastarse. Rollover automático.
2. **Flexible**: límites por categoría, tracking automático.
3. **50/30/20**: necesidades/deseos/ahorro con auto-clasificación IA.

**8 grupos de categorías** (40+ subcategorías):
- Vivienda (renta, servicios, internet, mantenimiento, seguro)
- Alimentación (supermercado, restaurantes, delivery, cafeterías, alcohol)
- Transporte (gasolina, público, Uber/taxi, mantenimiento, seguro)
- Salud (médico, medicamentos, seguro médico, dentista, gimnasio)
- Educación (colegiatura, cursos, útiles, libros, uniformes)
- Entretenimiento (streaming, cine, videojuegos, salidas, vacaciones)
- Ropa & Personal (ropa, accesorios, peluquería, cosméticos, tintorería)
- Finanzas (ahorro, deudas, tarjetas, inversiones, préstamos otorgados)

**Flujo de creación**: Neto detecta ingreso → propone distribución basada en historial → usuario ajusta → presupuesto confirmado → KPIs y alertas activas.

**10 KPIs en tiempo real:**
1. % Ejecución global
2. Días de presupuesto restante
3. Categorías en rojo (≥100%)
4. Categorías en amarillo (80-99%)
5. Tasa de ahorro real
6. Varianza vs. mes anterior
7. Proyección de cierre
8. Rollover acumulado
9. Índice de consistencia (componente del FlowScore)
10. Gasto diario promedio

**Semáforo visual**: verde (<80%) / amarillo (80-99%) / rojo (≥100%) por categoría.

**12 tipos de alertas**: categoría al 70%, al 90%, sobregirada, predictiva (proyección de agotamiento), gasto inusual, presupuesto cumplido, oportunidad de ahorro, inicio de mes nuevo, gasto mayor que mes anterior, racha de presupuesto, rollover disponible, modo crisis activado.

**8 reportes propios**: ejecución mensual, histórico de cumplimiento, categorías problemáticas, proyección de cierre, análisis de rollover, distribución 50/30/20, varianza mensual, reporte Neto del mes.

**4 períodos soportados**: mensual, quincenal, semanal, por evento.

### 3.5 MOD-04 — Control de Gastos

4 métodos de captura: manual (quick-entry), foto/PDF (Google Vision OCR), dictado de voz (Whisper + NLP), sincronización bancaria.

20 campos disponibles agrupados en: básicos (fecha, monto, categoría, modalidad, concepto), contexto (establecimiento, geolocalización, cuenta, tarjeta, persona), avanzados (etiquetas, proyecto, deducible, comprobante, referencia), split (división entre personas, recuperable, vinculación a préstamo).

12 reportes: resumen mensual, comparativa mes anterior, tendencia 12 meses, top 10 establecimientos, gasto por modalidad, días con más gasto, hora con más gasto, categorías sobregiradas, patrones de consumo, gastos por etiqueta, flujo de caja semanal, proyección mes en curso.

### 3.6 MOD-08 — Neto (Asistente IA — el diferenciador principal)

Neto recibe el **contexto financiero completo del usuario** en cada llamada a Claude API: saldos de cuentas, gastos, ingresos, préstamos otorgados/recibidos, metas, fechas de corte de tarjetas, portafolio de inversiones, suscripciones, deudas propias.

**Principio de diseño no negociable**: Neto nunca da respuestas genéricas. Toda respuesta debe basarse en los datos reales del usuario consultados en tiempo real desde Supabase antes de construir el prompt para Claude.

Capacidades:
- Responde preguntas en lenguaje natural sobre los datos del usuario
- Ejecuta acciones directamente (registrar gasto, agregar abono a préstamo, ajustar presupuesto)
- Genera el Daily Brief cada mañana
- Genera resumen narrativo semanal cada domingo
- Detecta patrones de comportamiento y los comunica proactivamente
- Hace re-engagement sin culpa cuando el usuario deja de usar la app
- Genera desafíos de ahorro personalizados (no genéricos)

**Personalidad escalada por plan de suscripción** (ver sección 6).

### 3.7 MOD-13 — Préstamos Familiares (módulo exclusivo, alta prioridad)

Sin interés. Control de dinero prestado a familia/amigos.

Campos: nombre del deudor, relación, monto, moneda, fecha de entrega, modalidad de entrega, cuenta u origen, categoría destino, foto de comprobante, notas, fecha de pago acordada.

**Modalidad de entrega (`delivery_method`) — 6 opciones, dos de ellas requieren distinguir tarjeta:**
- `cash`, `transfer`, `debit`, `bitcoin`, `crypto` — entrega directa, sin implicación de intereses para el usuario.
- `credit_purchase` — el usuario paga algo con su tarjeta directamente para el familiar (ej. supermercado, colegiatura). Tiene período de gracia, como cualquier compra normal de MOD-15.
- `credit_cash_advance` — el usuario retira efectivo con su tarjeta para dárselo al familiar. **Sin período de gracia — interés desde el día 1**, más comisión de retiro (3-5% + $2-$5 fijo en SV). Neto advierte activamente cuando detecta este patrón: es la forma más cara de prestar dinero.

**Vínculo con MOD-04/MOD-15:** cada préstamo entregado vía tarjeta o cuenta genera automáticamente su `transaction_id` real (`cc_charge` para compra, tipo dedicado para retiro de efectivo) — el saldo de la tarjeta en MOD-15 y el préstamo en MOD-13 son la misma operación, nunca se duplica el monto ni se cuenta como gasto personal del usuario. Alternativamente, un gasto ya registrado en MOD-04 se puede vincular retroactivamente a un préstamo existente o nuevo vía el campo "Vincular a préstamo MOD-13" (categoría "Campos de Split").

Abonos: fecha, monto, modalidad recibida (puede diferir de la entrega), cuenta destino, saldo resultante, foto comprobante. Cada abono genera su propia `transaction_id` (`income_type = 'loan_payment'`), tratado como **ingreso contingente** — nunca se cuenta en el presupuesto hasta recibirse de verdad (regla ya establecida en §Reglas de negocio).

12 categorías de destino: alimentos, reparación hogar, reparación carro, colegiatura, recibos/servicios, gastos médicos, deudas/créditos, ropa, evento/celebración, herramientas/negocio, viaje/transporte, otro.

KPIs: total prestado/año, total pendiente, deudor con mayor saldo, préstamos sin abono >30 días, % ingreso mensual expuesto, costo de oportunidad, tasa de recuperación histórica.

### 3.8 MOD-14 — Mi Cartera (préstamos con interés)

El usuario actúa como prestamista. Campos: prestatario, monto, plazo, tasa de interés (mensual/anual), tasa de mora, destino, garantía opcional.

Tabla de amortización generada automáticamente: cuota, fecha, pago total, capital, interés, saldo, estado (al día/en mora/pagada).

Aplicación de pagos: interés primero, luego capital, luego mora. Estados: Al día / En mora N días / Saldado / Castigado.

KPIs: TIR del portafolio, interés ganado acumulado, mora cobrada, comparativa vs. CETES/fondos.

### 3.9 MOD-15 — Tarjetas de Crédito

Por tarjeta: banco, últimos 4 dígitos, límite, saldo actual, día de corte, día límite de pago, tasa de interés mensual.

Dashboard: % utilización, días para el corte, estimado del corte, cuánto pagar para no generar interés.

Alertas críticas configurables por umbral de utilización y días antes del corte.

### 3.10 MOD-16 — Deudas Propias

Tipos: hipoteca, crédito auto, préstamo personal, tarjetas, deuda familiar.

Dos estrategias: **Avalancha** (mayor tasa primero, minimiza interés total) y **Bola de Nieve** (menor saldo primero, genera motivación con victorias rápidas).

Semáforo Ratio Deuda/Ingreso: <28% excelente, 28-36% manejable, 36-43% precaución, >43% peligro.

### 3.11 MOD-17 — Patrimonio Neto

Activos: cuentas bancarias, portafolio de inversiones, inmuebles, vehículos, cartera de préstamos (MOD-14), negocio propio.

Pasivos: hipoteca, crédito auto, saldo de tarjetas, préstamos personales, deuda a familiares.

Patrimonio Neto = Σ Activos − Σ Pasivos, recalculado con cada movimiento.

### 3.12 MOD-18 — WanderFinance (Planificador de Viajes)

4 fases:
1. **Planificación financiera**: conecta con meta de ahorro del viaje, calcula presupuesto disponible, modo "¿Cuándo puedo ir?", comparador de destinos
2. **Paquete de destino con IA (Claude)**: historia del lugar, moneda y tipo de cambio, clima, visa/documentos, electricidad/SIM, seguridad, propinas
3. **Itinerario día a día**: lugares con descripción/horario/precio, restaurantes por categoría de precio, logística de traslados, presupuesto desglosado por día, guía de emergencias, funciona offline
4. **Control de gastos en viaje**: registro rápido en moneda local con conversión automática, mapa de gastos, semáforo de presupuesto, división de gastos en grupo

Post-viaje: integración automática al MOD-04, comparativa presupuestado vs. real, resumen Neto.

### 3.13 MOD-19 — Control Fiscal

Marcador de deducibles por transacción con categoría fiscal específica (auto-sugerido por IA). Soporta México (SAT), Colombia (DIAN), España (IRPF), Argentina (AFIP).

Resumen anual exportable en PDF para el contador. Alertas de fechas límite de declaración.

### 3.14 MOD-20 — Calendario Financiero Maestro

8 tipos de eventos en una sola vista: ingresos esperados, gastos fijos, tarjetas (corte/pago), metas, inversiones, obligaciones fiscales, viajes planeados, alertas proactivas de Neto.

4 vistas: mensual, semanal, lista, flujo de caja.

---

## 4. Simulador de Impacto Financiero

Herramienta estratégica con 24 escenarios en 3 categorías:

**Préstamos (8):** préstamo familiar sin interés, compra con tarjeta para familiar, retiro de efectivo con tarjeta, deudor no paga (impago total), ¿yo presto vs. financiera?, múltiples préstamos simultáneos, pago tardío 15/30/60/90 días, costo de oportunidad del préstamo.

**Ingresos & Gastos (8):** aumento de sueldo (distribución óptima), pérdida de ingresos, nuevo gasto fijo, pago mínimo vs. total de tarjeta, nueva deuda (impacto en metas), consolidar deudas, gasto extraordinario, inflación.

**Largo Plazo (8):** comprar vs. rentar casa, auto efectivo vs. crédito, nuevo hijo, pagar estudios, fondo de emergencia ideal, proyección 5/10 años, retiro anticipado (FIRE), impacto financiero de separación.

Cada simulación: variables de entrada → impacto calculado → recomendación de Neto con lenguaje claro y accionable.

---

## 5. FlowScore — Sistema de Gamificación

Score 0-1000 compuesto de 6 indicadores ponderados:

| Componente | Peso | Criterio |
|---|---|---|
| % Tasa de Ahorro | 25 pts | Meta: ≥20% del ingreso |
| Ratio Deuda/Ingreso | 20 pts | Ideal: <28% |
| Fondo de Emergencia | 20 pts | 3-6 meses de gastos fijos |
| Diversificación | 15 pts | Múltiples fuentes de ingreso/activos |
| Consistencia Presupuesto | 10 pts | Semanas sin sobregirar |
| Pagos a Tiempo | 10 pts | Sin interés ni mora generada |

Niveles: 0-200 Inicio · 201-400 Principiante · 401-600 Consciente · 601-800 Ordenado · 801-950 Próspero · 951-1000 Libre.

Recalculado semanalmente. 30 badges desbloqueables. Desafíos adaptativos generados por Claude basados en hábitos reales del usuario.

---

## 6. Modelo de Suscripción — 4 Planes

Organizados por **etapa de vida financiera**, no por cantidad de features. Todos los precios en USD (moneda base del sistema). Fuente de verdad en código: [`packages/shared/src/config/plans.ts`](../packages/shared/src/config/plans.ts) — si estos números cambian, cambian ahí primero.

### ⚪ Free — $0
**Perfil:** Prueba el producto antes de comprometerse.
**Neto — "Neto Básico":** 5 mensajes/día · 15/mes, funcional y directo, sin ejecutar acciones.
**Incluye:** Dashboard, registro de gastos/ingresos (manual, foto, voz), 3 escaneos OCR/día, 20 adjuntos de respaldo (100MB total), presupuesto modo Flexible, alertas básicas, FlowScore visible.
**No incluye:** Préstamos familiares, inversiones, simulador, viajes, modo offline, multi-cuenta, Daily Brief automático.

### 🟢 Starter — "Claridad Financiera" — $4.99/mes ($47.90/año)
**Perfil:** El que sobrevive quincena a quincena, sin presupuesto formal.
**Neto — "Tu Compañero":** 30 mensajes/mes (máx 5/día), tono cálido y empático, sin tecnicismos, sin juzgar.
**Incluye todo lo de Free más:** Neto Daily Brief bajo demanda, 30 escaneos OCR/día, 100 adjuntos de respaldo (500MB total), 5 alertas básicas, 1 cuenta + 2 tarjetas, 3 fuentes de ingreso, 2 metas, 4 reportes, historial 6 meses.
**No incluye:** Préstamos familiares, inversiones, simulador, viajes, modo offline, multi-cuenta.

### 🔵 Pro — "Control y Crecimiento" — $11.99/mes ($115.10/año) — Plan más popular
**Perfil:** El que ya controla lo básico y quiere optimizar.
**Neto — "Tu Asesor Personal":** Mensajes ilimitados (50/día anti-abuso), ejecuta acciones directamente, brief diario + resumen semanal automático, recuerda contexto de conversaciones previas, re-engagement sin culpa.
**Incluye todo lo de Starter más:** 6 cuentas bancarias, tarjetas ilimitadas, los 3 modos de presupuesto completos (12 alertas, 10 KPIs, 8 reportes), 300 escaneos OCR/día, 500 adjuntos de respaldo (2GB total), **MOD-13 Préstamos Familiares completo**, inversiones básicas, **Simulador 16 escenarios** (Préstamos + Ingresos&Gastos, 20/día), **WanderFinance completo**, deudas propias con estrategias, metas ilimitadas, gamificación completa, modo offline, widget, exportación CSV.

### 💎 Elite — "Libertad Financiera" — $24.99/mes ($239.90/año)
**Perfil:** El que construye riqueza, múltiples ingresos, negocio propio.
**Neto — "Tu Socio Estratégico":** Mensajes ilimitados (100/día anti-abuso) + sesión mensual de planificación profunda, análisis de portafolio con recomendaciones, protocolo de bienestar financiero emocional (detecta estrés sostenido y acompaña sin presión).
**Incluye todo lo de Pro más:** OCR y simulaciones sin límite práctico, 2,000 adjuntos de respaldo (10GB total), **MOD-14 Mi Cartera con interés**, portafolio alternativo completo (inmuebles, negocio, proyectos), **Simulador 24 escenarios completo** + comparación en paralelo, **MOD-19 Control Fiscal multi-país**, patrimonio neto avanzado + proyección 10 años, hasta 4 usuarios (familia), Modo Asesor B2B (hasta 5 clientes), exportación PDF/Excel/JSON, soporte prioritario <2h.

**Descuento anual: 20% en todos los planes de pago.**

### Análisis de costos (COGS) — por qué estos precios son sostenibles

Los dos costos variables reales del sistema son Gemini API (OCR + chat Neto) y Supabase Storage (adjuntos + recibos). Con precios vigentes a jul-2026:

- **Gemini 2.5 Flash:** $0.30 / 1M tokens de entrada, $2.50 / 1M tokens de salida. Una imagen comprimida (~2000px) consume ~1,300-2,500 tokens de entrada. Un escaneo OCR completo (imagen + respuesta JSON estructurada) cuesta **~$0.0015 USD** — un mensaje de chat Neto típico, aún menos.
- **Supabase Storage:** ~$0.021 / GB / mes en overage (el plan Pro de Supabase ya incluye 100GB). El cupo más alto (Elite: 10GB/usuario) cuesta en el peor caso **~$0.21 USD/mes** si un usuario individual llegara a llenarlo por completo.
- **Peor caso teórico Pro** (300 OCR/día × 30 días, el techo, no el uso esperado): ~$13.50/mes en Gemini — un escenario de abuso extremo, no el comportamiento real de un usuario de finanzas personales (que escanea unos pocos recibos por semana). El techo existe para limitar abuso, no representa el costo esperado.
- **Conclusión:** con uso real (no el techo máximo), el costo variable por usuario activo es de centavos, muy por debajo de cualquiera de los precios propuestos — el margen viene principalmente de infraestructura fija (Supabase, Vercel) que se amortiza entre todos los usuarios, no de estos costos variables. Los precios existentes ($4.99 / $11.99 / $24.99) se mantienen sin cambios; se valida que son sostenibles.

*Nota: precios de Gemini y Supabase verificados vía búsqueda web en jul-2026 — revalidar si pasa mucho tiempo, las APIs de IA cambian de precio con frecuencia.*

### Estrategia de upgrade vía Neto (sin presionar al usuario)

- **Día 45 (Starter→Pro)**: Neto menciona el FlowScore que subió y sugiere organizar préstamos familiares que el usuario tiene pendientes.
- **Día 90 (Pro→Elite)**: Neto menciona los ingresos pasivos generados y sugiere evaluar la cartera de préstamos con interés y la optimización fiscal.

### Fuentes de ingreso adicionales (Fase 3)
- Marketplace transparente (comisión solo cuando genuinamente conviene al usuario)
- Reporte fiscal premium ($5-10 USD por generación)
- Plan Asesor B2B expandido (+5 clientes, $79 USD/mes hasta 20)
- Conexión con fintechs para usuarios con historial de cartera de préstamos (con consentimiento)

---

## 7. Schema de Base de Datos (PostgreSQL / Supabase)

Todas las tablas implementan **Row Level Security (RLS)**.

```sql
-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  currency_default text DEFAULT 'MXN',
  flow_score integer DEFAULT 0,
  plan text CHECK (plan IN ('starter','pro','elite')) DEFAULT 'starter',
  country text,
  language text DEFAULT 'es',
  crisis_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ACCOUNTS (MOD-02)
-- ============================================
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('checking','savings','payroll','foreign_currency','cash','digital_wallet','investment','joint')),
  balance numeric DEFAULT 0,
  currency text DEFAULT 'MXN',
  interest_rate numeric,
  plaid_account_id text,
  virtual_buckets jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INCOME_ENTRIES (MOD-00)
-- ============================================
CREATE TABLE income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('salary','freelance','rental','investment_return','loan_payment','occasional','pension','business')),
  subcategory text,
  source_name text,
  gross_amount numeric NOT NULL,
  deductions numeric DEFAULT 0,
  net_amount numeric,
  currency text DEFAULT 'MXN',
  exchange_rate numeric DEFAULT 1,
  received_at date NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_frequency text,
  destination_account_id uuid REFERENCES accounts(id),
  goal_allocation jsonb,
  evidence_url text,
  is_tax_relevant boolean DEFAULT false,
  notes text,
  tags text[],
  ai_classified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TRANSACTIONS (MOD-04)
-- ============================================
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id),
  card_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'MXN',
  category_id uuid,
  merchant_name text,
  ai_category text,
  payment_method text CHECK (payment_method IN ('cash','debit','credit','transfer','crypto','voucher')),
  is_recurring boolean DEFAULT false,
  receipt_url text,
  geolocation point,
  is_tax_deductible boolean DEFAULT false,
  split_data jsonb,
  tags text[],
  transaction_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- BUDGETS (MOD-03)
-- ============================================
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  mode text CHECK (mode IN ('zero_based','flexible','50_30_20')) DEFAULT 'flexible',
  period_type text CHECK (period_type IN ('monthly','biweekly','weekly','event')) DEFAULT 'monthly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_income numeric DEFAULT 0,
  total_assigned numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  unassigned numeric DEFAULT 0,
  rollover_from_prev numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  finn_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_group text CHECK (category_group IN ('housing','food','transport','health','education','entertainment','clothing','finance')),
  macro_type text CHECK (macro_type IN ('need','want','saving')),
  assigned_amount numeric DEFAULT 0,
  spent_amount numeric DEFAULT 0,
  available_amount numeric DEFAULT 0,
  rollover_enabled boolean DEFAULT false,
  rollover_amount numeric DEFAULT 0,
  alert_threshold_yellow numeric DEFAULT 0.80,
  alert_threshold_red numeric DEFAULT 1.00,
  status text CHECK (status IN ('green','yellow','red')) DEFAULT 'green',
  icon text,
  color text
);

CREATE TABLE budget_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  budget_id uuid REFERENCES budgets(id),
  category_id uuid REFERENCES budget_categories(id),
  alert_type text,
  severity text CHECK (severity IN ('info','warning','critical')),
  message text,
  finn_message text,
  is_read boolean DEFAULT false,
  triggered_at timestamptz DEFAULT now()
);

CREATE TABLE budget_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  calculated_at timestamptz DEFAULT now(),
  execution_pct numeric,
  days_remaining_budget numeric,
  categories_red integer DEFAULT 0,
  categories_yellow integer DEFAULT 0,
  savings_rate_real numeric,
  variance_vs_prev_month numeric,
  projected_close numeric,
  daily_spend_avg numeric,
  consistency_index numeric,
  rollover_accumulated numeric
);

-- ============================================
-- GOALS (MOD-05)
-- ============================================
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('emergency_fund','dated_savings','travel','big_purchase','education','custom')),
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  monthly_contribution numeric,
  priority smallint DEFAULT 3,
  linked_account_id uuid REFERENCES accounts(id),
  status text CHECK (status IN ('active','completed','paused')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SUBSCRIPTIONS (MOD-06)
-- ============================================
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'MXN',
  frequency text CHECK (frequency IN ('weekly','monthly','yearly')),
  billing_day integer,
  next_billing date,
  category text,
  ai_detected boolean DEFAULT false,
  usage_score smallint,
  status text CHECK (status IN ('active','paused','cancelled')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INVESTMENTS (MOD-07)
-- ============================================
CREATE TABLE investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('stock_etf','real_estate','business','project','crypto','bonds')),
  name text NOT NULL,
  amount_invested numeric NOT NULL,
  current_value numeric,
  purchase_date date,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- FAMILY_LOANS (MOD-13) — sin interés
-- ============================================
-- v2 (2026-07-12): agrega transaction_id + origin_card_id + delivery_method
-- distinguiendo credit_purchase de credit_cash_advance. Sin esto, un
-- préstamo entregado con tarjeta no tenía forma de reflejarse en el saldo
-- real de la tarjeta (MOD-15) sin duplicar el monto, y no se podía advertir
-- que un retiro de efectivo con tarjeta no tiene período de gracia (interés
-- desde el día 1) mientras que una compra normal sí lo tiene. Ver spec
-- completa en docs/modules/mod-13-prestamos-familiares.md.
CREATE TABLE family_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  relationship text,
  original_amount numeric NOT NULL,
  balance numeric NOT NULL,
  currency text DEFAULT 'USD',
  delivery_date date NOT NULL,
  delivery_method text CHECK (delivery_method IN (
    'cash', 'transfer', 'debit',
    'credit_purchase',       -- compra con tarjeta para el familiar: tiene período de gracia
    'credit_cash_advance',   -- retiro de efectivo con tarjeta: interés desde el día 1, sin gracia
    'bitcoin', 'crypto'
  )),
  origin_account_id uuid REFERENCES accounts(id),
  origin_card_id uuid REFERENCES credit_cards(id),
  transaction_id uuid REFERENCES transactions(id),  -- el cargo/retiro/transferencia real que originó el préstamo
  linked_amount numeric,  -- NULL = el préstamo es el 100% de transaction_id; si tiene valor, es un split parcial (ver mod-13 spec §3)
  category text,
  evidence_url text,
  agreed_payment_date date,
  notes text,
  status text CHECK (status IN ('active','paid','written_off')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_family_loan_origin CHECK (
    (delivery_method IN ('credit_purchase','credit_cash_advance') AND origin_card_id IS NOT NULL)
    OR (delivery_method NOT IN ('credit_purchase','credit_cash_advance'))
  )
);

CREATE TABLE family_loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES family_loans(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  destination_account_id uuid REFERENCES accounts(id),
  transaction_id uuid REFERENCES transactions(id),  -- el abono real que recibe el usuario (income_type='loan_payment')
  resulting_balance numeric,
  evidence_url text,
  notes text,
  paid_at date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- LOAN_PORTFOLIO (MOD-14) — con interés
-- ============================================
CREATE TABLE loan_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  borrower_name text NOT NULL,
  principal numeric NOT NULL,
  interest_rate_monthly numeric NOT NULL,
  late_fee_rate numeric DEFAULT 0,
  term_months integer NOT NULL,
  destination text,
  collateral text,
  amortization jsonb,
  status text CHECK (status IN ('current','overdue','paid','written_off')) DEFAULT 'current',
  irr numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE loan_portfolio_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loan_portfolio(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  interest_applied numeric,
  principal_applied numeric,
  late_fee_applied numeric DEFAULT 0,
  paid_at date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- CREDIT_CARDS (MOD-15)
-- ============================================
CREATE TABLE credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  last_four text,
  credit_limit numeric NOT NULL,
  current_balance numeric DEFAULT 0,
  cut_day integer NOT NULL,
  payment_due_day integer NOT NULL,
  interest_rate_monthly numeric,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- DEBTS (MOD-16)
-- ============================================
CREATE TABLE debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  creditor text NOT NULL,
  type text CHECK (type IN ('mortgage','auto_loan','personal_loan','credit_card','family_debt')),
  original_balance numeric NOT NULL,
  current_balance numeric NOT NULL,
  interest_rate numeric,
  monthly_payment numeric,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- NET_WORTH_SNAPSHOTS (MOD-17)
-- ============================================
CREATE TABLE net_worth_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  total_assets numeric,
  total_liabilities numeric,
  net_worth numeric,
  assets_breakdown jsonb,
  liabilities_breakdown jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TRIPS (MOD-18 — WanderFinance)
-- ============================================
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  start_date date,
  end_date date,
  budget numeric,
  goal_id uuid REFERENCES goals(id),
  ai_itinerary jsonb,
  destination_info jsonb,
  actual_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency_local text,
  amount_converted numeric,
  category text,
  geolocation point,
  receipt_url text,
  expense_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TAX_DEDUCTIONS (MOD-19)
-- ============================================
CREATE TABLE tax_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id),
  fiscal_category text,
  country text,
  amount numeric,
  fiscal_year integer,
  has_receipt boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- SIMULATIONS (Simulador de Impacto)
-- ============================================
CREATE TABLE simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  scenario_type text NOT NULL,
  title text,
  input_variables jsonb,
  computed_impacts jsonb,
  scenarios_cases jsonb,
  finn_insight text,
  finn_recommendation text,
  decision_taken text CHECK (decision_taken IN ('proceeded','rejected','modified','pending')),
  actual_outcome jsonb,
  linked_loan_id uuid,
  linked_goal_ids uuid[],
  time_horizon_months integer,
  is_saved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- FLOW_SCORES (Gamificación)
-- ============================================
CREATE TABLE flow_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score_week date NOT NULL,
  total_score integer,
  savings_rate numeric,
  debt_ratio numeric,
  emergency_fund numeric,
  diversification numeric,
  consistency numeric,
  on_time_payments numeric,
  level text CHECK (level IN ('inicio','principiante','consciente','ordenado','prospero','libre')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  points_earned integer DEFAULT 0,
  achieved_at timestamptz DEFAULT now()
);

-- ============================================
-- FINN_CONVERSATIONS (MOD-08)
-- ============================================
CREATE TABLE finn_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]',
  context_snapshot jsonb,
  session_type text CHECK (session_type IN ('chat','daily_brief','weekly_summary','planning_session')),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- CASHFLOW_SNAPSHOT
-- ============================================
CREATE TABLE cashflow_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  total_income numeric,
  total_expenses numeric,
  net_cashflow numeric,
  loans_outstanding numeric,
  income_at_risk numeric,
  liquidity_ratio numeric,
  financial_health_score integer,
  finn_summary text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- RLS — Ejemplo de política (aplicar a TODAS las tablas)
-- ============================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id);
-- Repetir este patrón para cada tabla con user_id
```

---

## 8. Roadmap de Desarrollo (3 Fases — 12 meses)

### Fase 1 — MVP (Mes 1-3)
Auth + onboarding conversacional con Neto · MOD-00 Ingresos · MOD-01 Dashboard · MOD-02 Cuentas (8 tipos) · MOD-03 Presupuesto · MOD-04 Gastos + OCR · MOD-08 Neto básico · MOD-15 Tarjetas · MOD-17 Patrimonio neto básico · Modo offline · Modo privacidad · Widget · Biometría · Exportación de datos · Web app Next.js · Setup Supabase + VPS.

### Fase 2 — Expansión (Mes 4-7)
MOD-05 Metas · MOD-06 Suscripciones · MOD-07 Inversiones básicas · MOD-13 Préstamos familia · MOD-14 Mi Cartera · MOD-16 Deudas propias · MOD-18 WanderFinance · MOD-20 Calendario maestro · Simulador 16 escenarios (luego 24) · Educación contextual · Comparador "Tu Yo Ideal" · Importar PDF banco · App React Native · ML categorización · Dictado de voz.

### Fase 3 — Diferenciación (Mes 8-12)
MOD-09 Gamificación completa · MOD-10 Reportes avanzados · MOD-11 Finanzas colaborativas · MOD-12 Salud financiera · MOD-19 Fiscal/deducibles · Neto por WhatsApp · Benchmark anónimo · Modo Asesor B2B · Marketplace transparente · Multi-país · Aniversario financiero · FlowScore marketing · Notificaciones proactivas.

---

## 9. Principios de Diseño No Negociables

1. **Neto siempre usa datos reales del usuario** — nunca respuestas genéricas de Claude sin contexto financiero inyectado en el prompt.
2. **El simulador debe ser fácil de encontrar** — botón accesible desde el dashboard, no enterrado en un menú.
3. **El registro de gastos en efectivo debe tomar menos de 3 segundos** — sin fricción, categorización automática después.
4. **El primer "momento eureka" debe ocurrir en las primeras 48 horas** — algo que sorprenda al usuario sobre sus propios datos.
5. **El componente emocional de Neto no es opcional** — re-engagement sin culpa, acompañamiento en momentos de estrés financiero, especialmente en plan Elite.
6. **Nunca contar abonos de préstamos familiares como ingreso confirmado** en el presupuesto — tratarlos como ingreso contingente hasta que se reciban.
7. **Las transferencias internas nunca son gasto ni ingreso** — debe estar resuelto a nivel de lógica de negocio desde el primer sprint.
8. **Todas las tablas con datos de usuario llevan RLS desde el día 1** — no se agrega después.

---

## 10. Variables de Entorno Esperadas (.env)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-20250514

# Open Banking
PLAID_CLIENT_ID=
PLAID_SECRET=
BELVO_SECRET_ID=
BELVO_SECRET_PASSWORD=

# Servicios de IA
GOOGLE_VISION_API_KEY=
OPENAI_API_KEY=          # Whisper

# Pagos
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Comunicaciones
RESEND_API_KEY=
WHATSAPP_BUSINESS_TOKEN=

# Tipo de cambio
EXCHANGE_RATE_API_KEY=

# VPS / Backend
FASTAPI_BASE_URL=
REDIS_URL=
```

---

## 11. Primer Sprint Sugerido (para Claude Code)

1. Setup del monorepo: `apps/web` (Next.js), `apps/mobile` (Expo), `apps/api` (FastAPI)
2. Configurar Supabase: proyecto, tablas de `users`, `accounts`, `transactions`, `income_entries`, `budgets`, `budget_categories` con RLS
3. Auth con Supabase Auth (email + OAuth Google)
4. Onboarding conversacional: pantalla de chat inicial con Neto preguntando el mayor problema financiero del usuario
5. CRUD de cuentas bancarias (MOD-02) con los 8 tipos
6. CRUD de transacciones (MOD-04) con registro manual primero, OCR/voz después
7. Lógica de presupuesto (MOD-03): modo Flexible primero, cálculo de KPIs básicos
8. Dashboard (MOD-01) con los widgets esenciales: liquidez, flujo del mes, alertas
9. Integración Claude API para Neto básico: endpoint que construye el contexto financiero del usuario y lo envía a Claude
10. Deploy inicial en Hostinger VPS + Vercel/similar para Next.js

---

*Fin del documento de especificación técnica. Generado a partir del documento maestro de diseño FlowFinance v4.0.*

---

## 12. Integración Claude API — Arquitectura de Neto

### 12.1 Principio fundamental

Antes de cada llamada a la Claude API, el sistema construye un **snapshot financiero completo** del usuario desde Supabase. Claude NUNCA recibe una pregunta sin contexto financiero real. Este es el diferenciador más importante de Neto vs. cualquier otro chatbot.

### 12.2 Estructura del contexto inyectado

```typescript
// apps/api/finn/context_builder.ts

interface FinnContext {
  user: {
    name: string;
    plan: 'starter' | 'pro' | 'elite';
    country: string;
    currency_default: string;
    flow_score: number;
    member_since: string;
  };
  liquidity: {
    total_balance: number;
    available_today: number; // total - compromisos fijos pendientes
    days_of_coverage: number; // available / daily_spend_avg
  };
  budget: {
    mode: string;
    period: string;
    total_income: number;
    total_assigned: number;
    total_spent: number;
    execution_pct: number;
    categories_red: number;
    categories_yellow: number;
    savings_rate: number;
    days_remaining: number;
    top_overspent: Array<{ name: string; pct: number; overage: number }>;
  };
  income: {
    this_month_total: number;
    next_expected: { source: string; amount: number; date: string } | null;
    sources_count: number;
  };
  credit_cards: Array<{
    bank: string;
    balance: number;
    limit: number;
    utilization_pct: number;
    days_to_cut: number;
    cut_amount_estimated: number;
    can_pay_without_interest: boolean;
  }>;
  family_loans: {
    total_lent: number;
    total_pending: number;
    overdue_30d: Array<{ name: string; balance: number; days_overdue: number }>;
    opportunity_cost_annual: number;
    recovery_rate: number;
  };
  debts: {
    total: number;
    monthly_payments: number;
    debt_income_ratio: number;
    ratio_status: 'excellent' | 'manageable' | 'caution' | 'danger';
  };
  goals: Array<{
    name: string;
    progress_pct: number;
    on_track: boolean;
    months_remaining: number;
  }>;
  investments: {
    total_value: number;
    monthly_passive_income: number;
    best_performing: string;
    weighted_return_pct: number;
  };
  alerts_pending: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  upcoming_events: Array<{
    date: string;
    type: string;
    description: string;
    amount: number;
  }>;
}
```

### 12.3 System prompt de Neto por plan

```typescript
// apps/api/finn/system_prompts.ts

const BASE_PROMPT = `
Eres Neto, el asistente financiero personal de FlowFinance.

REGLA FUNDAMENTAL: Siempre respondes basándote ÚNICAMENTE en los datos financieros reales del usuario
que se te proporcionan en el contexto. NUNCA des consejos genéricos. Si no tienes datos suficientes,
di qué dato falta y cómo el usuario puede registrarlo.

FORMATO DE RESPUESTA:
- Usa lenguaje claro, directo y sin jerga financiera innecesaria
- Cuando mencionas números, sé específico: "$3,840" no "aproximadamente 4 mil pesos"
- Cuando recomiendes una acción, sé concreto: "transfiere $1,200 a tu cuenta de emergencia hoy"
- Máximo 3-4 párrafos por respuesta en conversación normal
- Puedes usar emojis de forma moderada y natural (no excesivamente)
`;

export const SYSTEM_PROMPTS = {
  starter: `${BASE_PROMPT}

PERSONALIDAD — "Tu Compañero Financiero":
Eres cálido, empático y accesible. Hablas como ese amigo que estudió finanzas y te explica
todo sin hacerte sentir tonto. NUNCA juzgas. NUNCA culpas. Cuando el usuario lleva tiempo
sin registrar movimientos, no preguntas qué pasó de forma invasiva — ofreces un nuevo comienzo.

Tus temas de conversación están limitados a: gastos, presupuesto, saldo disponible, alertas
de tarjeta, metas básicas y el estado general del mes. Para temas más avanzados (inversiones,
préstamos complejos, análisis fiscal), mencionas que eso está disponible en el Plan Pro sin
presionar: "Si algún día quieres, en el Plan Pro puedo ayudarte con eso."

Límite de mensajes: el usuario tiene 30 mensajes al mes. Si se acerca al límite, avísale
de forma amigable (no alarmante) cuando le queden 5.`,

  pro: `${BASE_PROMPT}

PERSONALIDAD — "Tu Asesor Financiero Personal":
Eres más analítico pero siempre cercano. Hablas como un CFP (Certified Financial Planner)
que conoce la situación completa del usuario. Puedes hablar de inversiones básicas, préstamos
familiares, estrategias de pago de deudas y planificación de metas con plazos.

CAPACIDADES ESPECIALES EN ESTE PLAN:
- Puedes ejecutar acciones directamente cuando el usuario lo pide: registrar un gasto, 
  agregar un abono a un préstamo, ajustar una categoría de presupuesto.
- Recuerdas el contexto de conversaciones anteriores y haces seguimiento proactivo:
  "La semana pasada mencionaste que ibas a hablar con tu hermano sobre el préstamo. ¿Cómo quedó?"
- Cuando detectas que el usuario no ha abierto la app en más de 7 días, en tu próxima
  respuesta inicias con algo como: "Oye, no pasa nada si te tomaste un descanso. 
  ¿Quieres que revisemos juntos cómo quedó el período sin juzgarte?"
- Generas el Daily Brief automáticamente cada mañana sin que el usuario lo pida.
- Generas el resumen semanal narrativo cada domingo.`,

  elite: `${BASE_PROMPT}

PERSONALIDAD — "Tu Socio Financiero Estratégico":
Hablas al nivel de un asesor de wealth management. Puedes analizar portafolios completos,
calcular TIR, hablar de estrategia fiscal multi-país, comparar escenarios de inversión
y planificar el retiro. Usas términos técnicos cuando conviene, pero siempre los explicas.

CAPACIDADES ESPECIALES EN ESTE PLAN:
- Todo lo del plan Pro, más:
- Conduces sesiones de planificación profunda mensuales: análisis completo de la situación
  y plan de acción a 1, 3 y 5 años.
- Analizas el portafolio de inversiones completo y das recomendaciones de redistribución.
- Detectas oportunidades fiscales no aprovechadas.
- Generas el reporte mensual ejecutivo: 1 página con los 10 números más importantes del mes.
- PROTOCOLO DE BIENESTAR FINANCIERO: Si detectas en el contexto que el FlowScore bajó
  más de 50 puntos en el último mes, que hay múltiples deudas en mora simultáneas, o que
  el usuario no ha registrado datos en más de 2 semanas, activas este protocolo:
  
  "Noto que el último mes ha tenido algunos desafíos financieros. Esto pasa, y está bien.
  ¿Te parece si revisamos juntos qué ocurrió, sin prisa y sin juicios? A veces entender
  el mes que pasó es el mejor punto de partida para el siguiente."
  
  Nunca actives este protocolo de forma invasiva ni más de una vez por mes.`
};
```

### 12.4 Función principal de llamada a Claude

```typescript
// apps/api/finn/finn_service.ts

import Anthropic from '@anthropic-ai/sdk';
import { buildUserContext } from './context_builder';
import { SYSTEM_PROMPTS } from './system_prompts';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askFinn(
  userId: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  sessionType: 'chat' | 'daily_brief' | 'weekly_summary' | 'planning_session' = 'chat'
): Promise<string> {

  // 1. Construir contexto financiero real del usuario
  const context = await buildUserContext(userId);

  // 2. Construir el system prompt con contexto inyectado
  const systemPrompt = `
${SYSTEM_PROMPTS[context.user.plan]}

=== CONTEXTO FINANCIERO ACTUAL DEL USUARIO ===
Fecha de hoy: ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${JSON.stringify(context, null, 2)}
=== FIN DEL CONTEXTO ===

Responde siempre en español (${context.user.country === 'ES' ? 'español de España' : 'español LATAM'}).
Moneda de referencia del usuario: ${context.user.currency_default}.
`;

  // 3. Llamar a Claude API
  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '';

  // 4. Guardar en historial de conversaciones
  await saveConversation(userId, userMessage, reply, context, sessionType);

  return reply;
}

// Genera el Daily Brief matutino (llamado por Celery job a las 7:30am del usuario)
export async function generateDailyBrief(userId: string): Promise<string> {
  const briefPrompt = `
Genera el brief financiero del día. IMPORTANTE:
- Máximo 4 líneas de texto natural (no bullets, no listas)
- Menciona los 2-3 datos más urgentes de hoy (vencimientos, alertas, saldo)  
- Termina SIEMPRE con UNA sola acción concreta y específica que el usuario puede hacer hoy
- Tono: como si le mandaras un mensaje de WhatsApp a un amigo, no un email corporativo
- Usa emojis de forma natural y moderada
`;
  return askFinn(userId, briefPrompt, [], 'daily_brief');
}

// Genera el resumen semanal (llamado por Celery job los domingos a las 8:00pm)
export async function generateWeeklySummary(userId: string): Promise<string> {
  const summaryPrompt = `
Genera el resumen financiero de la semana. Estructura:
1. Qué fue bien esta semana (máximo 2 cosas específicas con números)
2. Qué se puede mejorar (máximo 2 cosas, sin juzgar, con solución sugerida)
3. Las 3 acciones más importantes para la semana que viene (ordenadas por impacto)
Tono: honesto pero motivador. Máximo 5-6 líneas en total.
`;
  return askFinn(userId, summaryPrompt, [], 'weekly_summary');
}
```

---

## 13. Arquitectura de ML en VPS (FastAPI)

### 13.1 Endpoints FastAPI

```python
# apps/api/main.py

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI(title="FlowFinance ML API", version="1.0.0")

# ── CATEGORIZACIÓN DE TRANSACCIONES (XGBoost) ──
class TransactionRequest(BaseModel):
    description: str
    amount: float
    merchant: Optional[str] = None
    user_history: Optional[List[dict]] = None  # últimas 50 transacciones

class CategoryResponse(BaseModel):
    category: str
    subcategory: str
    confidence: float
    macro_type: str  # 'need' | 'want' | 'saving'

@app.post("/classify-transaction", response_model=CategoryResponse)
async def classify_transaction(req: TransactionRequest):
    """
    Clasifica una transacción usando XGBoost entrenado en datos LATAM.
    Aprende del historial del usuario para aumentar precisión personal.
    """
    # modelo.predict(features) → category, confidence
    pass

# ── PREDICCIÓN DE GASTOS (Prophet/LSTM) ──
class ForecastRequest(BaseModel):
    user_id: str
    category: str
    months_back: int = 6  # meses de historial

class ForecastResponse(BaseModel):
    category: str
    predicted_amount: float
    confidence_interval_low: float
    confidence_interval_high: float
    trend: str  # 'increasing' | 'decreasing' | 'stable'

@app.post("/forecast-spending", response_model=ForecastResponse)
async def forecast_spending(req: ForecastRequest):
    """
    Predice gasto del próximo mes por categoría.
    Usa Prophet para series temporales con estacionalidad.
    """
    pass

# ── DETECCIÓN DE ANOMALÍAS (Isolation Forest) ──
class AnomalyRequest(BaseModel):
    transaction_amount: float
    category: str
    merchant: str
    user_avg_in_category: float
    user_stddev_in_category: float
    time_of_day: int  # hora (0-23)
    day_of_week: int  # 0=lunes, 6=domingo

class AnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float  # -1 a 1 (más negativo = más anómalo)
    reason: str
    severity: str  # 'info' | 'warning' | 'critical'

@app.post("/detect-anomaly", response_model=AnomalyResponse)
async def detect_anomaly(req: AnomalyRequest):
    """
    Detecta si una transacción es inusual para el perfil del usuario.
    Isolation Forest entrenado por usuario con sus últimas 200 transacciones.
    """
    pass

# ── PROYECCIÓN DE SALDO (simulación Monte Carlo simple) ──
class BalanceProjectionRequest(BaseModel):
    current_balance: float
    monthly_income: float
    fixed_expenses: List[dict]  # [{amount, day, name}]
    variable_expenses_avg: float
    horizon_days: int = 90

@app.post("/project-balance")
async def project_balance(req: BalanceProjectionRequest):
    """
    Proyecta el saldo disponible día a día para los próximos N días.
    Detecta automáticamente cuándo el saldo llegará a cero.
    """
    pass

# ── OCR DE RECIBO ──
@app.post("/ocr-receipt")
async def ocr_receipt(image_base64: str):
    """
    Usa Google Vision API para extraer monto, fecha, comercio y categoría
    de una foto de recibo. Soporta tickets en español, inglés y portugués.
    """
    pass

# ── DICTADO DE VOZ ──
@app.post("/transcribe-expense")
async def transcribe_expense(audio_base64: str):
    """
    Usa Whisper para transcribir el audio, luego NLP para extraer:
    monto, categoría, comercio y modalidad de pago.
    Ejemplo: "gasté doscientos cincuenta pesos en el Oxxo con débito"
    → {amount: 250, category: "food", merchant: "OXXO", method: "debit"}
    """
    pass
```

### 13.2 Docker Compose del VPS

```yaml
# docker-compose.yml (Hostinger VPS)

version: '3.9'

services:
  api:
    build: ./apps/api
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_VISION_API_KEY=${GOOGLE_VISION_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
    ports:
      - "8000:8000"
    depends_on:
      - redis
    restart: always

  worker:
    build: ./apps/api
    command: celery -A worker worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
    restart: always

  beat:
    build: ./apps/api
    command: celery -A worker beat --loglevel=info
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - api
    restart: always
```

---

## 14. Estructura del Proyecto (Monorepo)

```
flowfinance/
├── apps/
│   ├── web/                         # Next.js 15
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx         # MOD-01 Dashboard
│   │   │   │   ├── accounts/        # MOD-02
│   │   │   │   ├── budget/          # MOD-03
│   │   │   │   ├── expenses/        # MOD-04
│   │   │   │   ├── income/          # MOD-00
│   │   │   │   ├── goals/           # MOD-05
│   │   │   │   ├── subscriptions/   # MOD-06
│   │   │   │   ├── investments/     # MOD-07
│   │   │   │   ├── finn/            # MOD-08 Chat Neto
│   │   │   │   ├── gamification/    # MOD-09
│   │   │   │   ├── reports/         # MOD-10
│   │   │   │   ├── family-loans/    # MOD-13
│   │   │   │   ├── portfolio/       # MOD-14
│   │   │   │   ├── cards/           # MOD-15
│   │   │   │   ├── debts/           # MOD-16
│   │   │   │   ├── net-worth/       # MOD-17
│   │   │   │   ├── travel/          # MOD-18
│   │   │   │   ├── fiscal/          # MOD-19
│   │   │   │   ├── calendar/        # MOD-20
│   │   │   │   └── simulator/       # Simulador de impacto
│   │   │   └── api/
│   │   │       ├── finn/route.ts    # Proxy a FastAPI Neto
│   │   │       └── webhooks/        # Stripe + Plaid
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui
│   │   │   ├── modules/             # Componentes por módulo
│   │   │   ├── finn/                # Chat UI, Daily Brief
│   │   │   └── charts/              # Recharts + D3
│   │   └── lib/
│   │       ├── supabase/
│   │       ├── finn-client.ts
│   │       └── utils/
│   │
│   ├── mobile/                      # React Native + Expo
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx        # Tab Home (MOD-01)
│   │   │   │   ├── money.tsx        # Tab Dinero (MOD-02/04)
│   │   │   │   ├── plan.tsx         # Tab Planear (MOD-03/05/20)
│   │   │   │   ├── grow.tsx         # Tab Crecer (MOD-07/13/14/16)
│   │   │   │   └── travel.tsx       # Tab Viajar (MOD-18)
│   │   │   ├── finn/                # Chat pantalla completa
│   │   │   └── add-expense/         # Registro rápido
│   │   ├── components/
│   │   └── services/
│   │
│   └── api/                         # FastAPI (VPS)
│       ├── main.py
│       ├── finn/
│       │   ├── context_builder.py
│       │   ├── finn_service.py
│       │   └── system_prompts.py
│       ├── ml/
│       │   ├── categorizer.py       # XGBoost
│       │   ├── forecaster.py        # Prophet/LSTM
│       │   └── anomaly.py           # Isolation Forest
│       ├── ocr/
│       │   ├── receipt.py           # Google Vision
│       │   └── pdf_extractor.py     # Claude + Vision
│       ├── voice/
│       │   └── transcriber.py       # Whisper + NLP
│       └── worker.py                # Celery tasks
│
├── packages/
│   ├── shared-types/                # Types compartidos
│   ├── ui-tokens/                   # Design tokens
│   └── supabase-client/             # Cliente Supabase compartido
│
├── supabase/
│   ├── migrations/                  # SQL migrations versionadas
│   ├── seed.sql                     # Datos de prueba
│   └── functions/                   # Edge Functions Deno
│
├── .env.local
├── docker-compose.yml
├── turbo.json                       # Turborepo config
└── package.json
```

---

## 15. Flujo de Onboarding (primeras 48 horas — el "momento eureka")

El onboarding es completamente conversacional con Neto. El objetivo es que en las primeras 48 horas el usuario viva un momento de sorpresa con sus propios datos.

### Pantalla 1 — Bienvenida conversacional

```
Neto: "Hola! Soy Neto, tu asistente financiero personal. Antes de configurar 
      todo, quiero entenderte mejor.
      
      ¿Cuál es tu mayor problema con el dinero hoy?
      
      [No sé a dónde va mi quincena]
      [Tengo deudas que no puedo controlar]  
      [Presto dinero a familia y lo pierdo]
      [Quiero empezar a ahorrar pero no sé cómo]
      [Otro...]"
```

### Pantalla 2 — Configuración contextual (basada en respuesta)

Neto configura automáticamente los módulos relevantes para ese perfil. No pregunta por todos los módulos — solo los que importan para ese usuario.

### Pantalla 3 — Primer ingreso de datos

Un solo campo: "¿Cuánto dinero tienes disponible ahora mismo en tu cuenta principal?" → La app construye el primer estado financiero.

### Pantalla 4 — El momento eureka (día 2-3)

Cuando el usuario registra sus primeros 5-10 gastos, Neto genera el primer insight sorprendente:
- "Gastas en promedio $89 diarios en delivery — $2,670/mes. ¿Lo sabías?"
- "Tu sueldo te dura 19 días en promedio. Los últimos 11 días del mes vives de lo que va quedando."
- "Tienes $2,840/mes en suscripciones activas. De esas, 3 no las has usado en más de 45 días."

Este momento debe ocurrir de forma proactiva, sin que el usuario lo pida.

---

## 16. Políticas de Rate Limiting y Costos de API

### Estimación de costo Claude API por plan

| Plan | Llamadas Neto/mes | Tokens promedio/llamada | Costo estimado/usuario/mes |
|---|---|---|---|
| Starter | ~40 (30 user + 10 briefings) | ~3,000 | ~$0.30 USD |
| Pro | ~200 (ilimitado + briefings + semanales) | ~4,000 | ~$1.20 USD |
| Elite | ~300 (todo Pro + sesiones profundas) | ~6,000 | ~$2.70 USD |

Margen de seguridad: los precios de suscripción cubren el costo de API con margen amplio.

### Rate limiting en el servidor

```python
# Límites por plan — aplicados en FastAPI
RATE_LIMITS = {
    'starter': {
        'finn_messages_per_month': 30,
        'finn_messages_per_day': 5,
        'ocr_per_day': 10,
        'simulations_per_day': 0
    },
    'pro': {
        'finn_messages_per_month': None,  # Ilimitado
        'finn_messages_per_day': 50,      # Anti-abuso
        'ocr_per_day': 50,
        'simulations_per_day': 20
    },
    'elite': {
        'finn_messages_per_month': None,
        'finn_messages_per_day': 100,
        'ocr_per_day': None,
        'simulations_per_day': None
    }
}
```

---

## 17. Diseño de Alertas Inteligentes — Lógica de Negocio

Las alertas deben ser accionables, no decorativas. Cada alerta incluye: qué pasó, por qué importa, y qué hacer ahora.

### Tipos de alertas y sus triggers

```typescript
// packages/shared-types/alerts.ts

export type AlertType =
  | 'budget_at_70'          // categoría al 70% → aviso temprano
  | 'budget_at_90'          // categoría al 90% → urgente
  | 'budget_overrun'        // categoría al 100%+ → sobregirado
  | 'budget_projection'     // proyección de agotamiento antes de fin de mes
  | 'unusual_transaction'   // gasto 3x mayor al promedio de la categoría
  | 'budget_completed'      // mes cerrado dentro del presupuesto → celebrar
  | 'savings_opportunity'   // categoría con saldo libre redirigible
  | 'month_start'           // propuesta de presupuesto del mes
  | 'spending_increase'     // gasto total +20% vs mismo período mes anterior
  | 'streak_achievement'    // racha de presupuesto → gamificación
  | 'rollover_available'    // dinero sobrante del mes anterior sin asignar
  | 'crisis_mode'           // saldo crítico detectado
  | 'card_cut_3d'           // tarjeta corta en 3 días
  | 'card_cut_day'          // día del corte
  | 'family_loan_overdue'   // préstamo sin abono 30/60/90 días
  | 'subscription_rising'   // precio de suscripción subió
  | 'subscription_unused'   // suscripción sin uso en 30+ días
  | 'goal_at_risk'          // meta no llegará a tiempo al ritmo actual
  | 'goal_completed'        // meta alcanzada → celebración
  | 'investment_maturing'   // CETES o bono que vence esta semana
  | 'income_received'       // ingreso detectado → sugerir distribución
  | 'anomaly_detected'      // transacción inusual posible fraude
  | 'debt_minimum_risk'     // pago mínimo solo → mostrar costo real
  | 'tax_deadline'          // fecha fiscal próxima

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;               // mensaje técnico
  finn_message: string;          // mensaje de Neto en tono natural
  action_label?: string;         // CTA del botón
  action_route?: string;         // ruta a donde lleva el tap
  related_entity_id?: string;    // budget_id, loan_id, card_id, etc.
  is_read: boolean;
  triggered_at: string;
}
```

### Ejemplo de alerta bien construida

```typescript
// Alerta: tarjeta al 90% de utilización
{
  type: 'budget_at_90',
  severity: 'warning',
  title: 'Restaurantes casi al límite',
  message: 'La categoría Restaurantes lleva 89% del presupuesto con 12 días por delante.',
  finn_message: 'Ojo con Restaurantes — llevas $1,335 de $1,500 con casi 2 semanas por delante. Si sigues al mismo ritmo te pasarás en $320. Puedes limitarte a $46/día para cerrarlo bien. ¿Ajustamos?',
  action_label: 'Ver detalle',
  action_route: '/budget/restaurantes',
}
```

---

## 18. Seguridad — Implementación

### Row Level Security (Supabase)

```sql
-- Política estándar — aplicar a TODAS las tablas con user_id
-- Reemplazar 'accounts' con el nombre de cada tabla

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Solo el propietario puede ver sus propios registros
CREATE POLICY "owner_select" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el propietario puede insertar en sus registros
CREATE POLICY "owner_insert" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo el propietario puede actualizar sus propios registros
CREATE POLICY "owner_update" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Solo el propietario puede borrar sus propios registros
CREATE POLICY "owner_delete" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Para usuarios colaborativos (plan Elite, finanzas en familia)
-- Se agrega una tabla family_members con user_id y member_id
-- y se extiende la política para incluir a los miembros autorizados
```

### Headers de seguridad (Nginx)

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.flowfinance.app;
    
    # SSL
    ssl_certificate /etc/letsencrypt/live/api.flowfinance.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.flowfinance.app/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 19. Celery Jobs Programados

```python
# apps/api/worker.py

from celery import Celery
from celery.schedules import crontab

app = Celery('flowfinance', broker='redis://redis:6379/0')

app.conf.beat_schedule = {

    # Daily Brief — todos los usuarios Pro y Elite a las 7:30am hora local
    'daily-brief': {
        'task': 'tasks.generate_daily_brief_all',
        'schedule': crontab(hour=7, minute=30),
    },

    # Resumen semanal — todos los usuarios Pro y Elite, domingos 8pm
    'weekly-summary': {
        'task': 'tasks.generate_weekly_summary_all',
        'schedule': crontab(hour=20, minute=0, day_of_week=0),
    },

    # Recalcular FlowScore — todos los usuarios, lunes 6am
    'flow-score-recalculation': {
        'task': 'tasks.recalculate_flow_scores',
        'schedule': crontab(hour=6, minute=0, day_of_week=1),
    },

    # Snapshot de patrimonio neto — todos los usuarios, día 1 de cada mes
    'net-worth-snapshot': {
        'task': 'tasks.take_net_worth_snapshots',
        'schedule': crontab(hour=0, minute=5, day_of_month=1),
    },

    # Alertas de tarjetas (corte en 3 días) — diario a las 9am
    'card-cut-alerts': {
        'task': 'tasks.check_card_cuts',
        'schedule': crontab(hour=9, minute=0),
    },

    # Alertas de préstamos familiares en mora — diario a las 10am
    'family-loan-overdue-check': {
        'task': 'tasks.check_family_loan_overdues',
        'schedule': crontab(hour=10, minute=0),
    },

    # Cashflow snapshot diario — 11:59pm
    'cashflow-daily': {
        'task': 'tasks.daily_cashflow_snapshot',
        'schedule': crontab(hour=23, minute=59),
    },

    # Actualizar tipo de cambio — cada 4 horas
    'exchange-rates': {
        'task': 'tasks.update_exchange_rates',
        'schedule': crontab(minute=0, hour='*/4'),
    },

    # Reentrenamiento ML mensual — día 15 de cada mes, 3am
    'ml-retrain': {
        'task': 'tasks.retrain_categorization_model',
        'schedule': crontab(hour=3, minute=0, day_of_month=15),
    },
}
```

---

## 20. Glosario de Términos del Proyecto

| Término | Definición en FlowFinance |
|---|---|
| **Neto** | El asistente IA de FlowFinance. Siempre recibe el contexto financiero real del usuario antes de responder. |
| **Contexto Financiero** | Snapshot de todos los datos del usuario (cuentas, gastos, deudas, metas, tarjetas, préstamos) que se inyecta en cada llamada a Claude API. |
| **Daily Brief** | Párrafo diario generado por Neto cada mañana con lo más urgente del día financiero y una acción recomendada. |
| **FlowScore** | Score 0-1000 que mide la salud financiera del usuario basado en 6 indicadores ponderados. Se recalcula semanalmente. |
| **Bolsillo Virtual** | Sub-asignación dentro de una cuenta de ahorro real. No requiere abrir cuentas bancarias adicionales. |
| **Liquidez Real** | Saldo total de cuentas líquidas menos compromisos fijos pendientes del mes menos aportes a metas programados. El dinero realmente disponible. |
| **Transferencia Interna** | Movimiento de dinero entre cuentas propias del usuario. NUNCA se contabiliza como gasto ni como ingreso. |
| **Ingreso Contingente** | Abono de préstamo familiar pendiente de recibir. No se contabiliza como ingreso hasta que efectivamente se reciba. |
| **Semáforo Presupuesto** | Indicador visual verde (<80%), amarillo (80-99%), rojo (≥100%) por categoría de presupuesto. |
| **Modo Crisis** | Estado de la app cuando el saldo disponible cae por debajo de X días de gastos. Muestra días de liquidez, pausa metas no urgentes, sugiere cortes por impacto. |
| **Momento Eureka** | Primera revelación sorprendente que Neto hace al usuario sobre sus propios datos en las primeras 48 horas. El evento más importante para la retención inicial. |
| **WanderFinance** | MOD-18. Planificador de viajes integrado con 4 fases: planificación financiera, destino con IA, itinerario día a día, control en viaje. |
| **Ratio Deuda/Ingreso** | (Suma de cuotas mensuales de deudas) / (Ingreso mensual neto). Semáforo: <28% excelente, 28-36% manejable, 36-43% precaución, >43% peligro. |
| **Rollover** | Dinero de presupuesto de una categoría que sobró al cierre del mes y se arrastra al siguiente período. |
| **Re-engagement sin culpa** | Protocolo de Neto cuando el usuario lleva +7 días sin registrar datos. Invita a retomar sin señalar ni juzgar el período de ausencia. |
| **Protocolo Bienestar** | (Solo Plan Elite) Protocolo de Neto que se activa cuando detecta estrés financiero sostenido. Ofrece acompañamiento empático y revisión sin prisa. |

---

*Documento generado a partir del Documento Maestro FlowFinance v4.0*
*Proyecto listo para iniciar desarrollo con Claude Code*
*Stack: Next.js 15 · React Native/Expo · Supabase · Hostinger VPS · Claude API (Anthropic)*
