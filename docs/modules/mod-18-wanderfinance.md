# MOD-18 — WanderFinance (Planificador de Viajes)

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `trips`, `trip_expenses` — ambas ya existen desde el esqueleto del MVP, con columnas (`ai_itinerary`, `destination_info` jsonb) que ya anticipaban exactamente esto. Sin migración nueva.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Planifica un viaje con presupuesto y fechas, y le agrega dos capas de inteligencia real (no solo CRUD):
1. **Clima estimado** del destino en las fechas del viaje.
2. **Itinerario sugerido** por Gemini, con datos reales de Google Maps (no lugares inventados) según preferencias del usuario.

Trackea gastos del viaje contra el presupuesto asignado (`trip_expenses`, ya existe).

### 1.2 Decisión clave de proveedor — investigado antes de diseñar esto

El pedido original mencionaba usar Google Maps directamente. Investigué las opciones reales antes de comprometerme a una:

- **Google Maps Platform directo** (Places API, Routes API, Maps Embed API): desde marzo 2025 ya no tiene el crédito de $200/mes — ahora es free tier por API + facturación después, y **requiere crear un proyecto de Google Cloud nuevo con tarjeta de crédito habilitada**, sin excepción, incluso para el mapa embebido gratis.
- **Gemini con "Grounding de Google Maps" (nativo del SDK que ya usamos)**: Gemini puede consultar datos reales de Google Maps (250M+ lugares, direcciones, reseñas) como una tool integrada — **se factura dentro del mismo proyecto de Gemini que ya tenemos, sin cuenta nueva de Google Cloud ni tarjeta nueva**, a ~$25 por 1,000 consultas con grounding (de las cuales este módulo hará pocas, bajo demanda).

**Decisión: usar Grounding de Google Maps vía Gemini**, no las APIs de Maps directas. Cumple exactamente lo pedido (usa Google Maps de verdad, no solo el conocimiento genérico de Gemini que podría alucinar lugares que no existen) sin abrir una cuenta ni facturación nueva. Cada lugar sugerido viene con su URL real de Google Maps (`https://maps.google.com/?...`), así que en vez de un mapa embebido (que sí necesitaría la cuenta nueva), cada punto del itinerario enlaza directo a su ficha real de Google Maps — cero configuración adicional, mismo resultado práctico para el usuario. Un mapa interactivo embebido queda anotado como posible mejora de Fase 3 si en algún momento se decide abrir esa cuenta de todas formas.

### 1.3 Clima — Open-Meteo, gratis, sin API key
`archive-api.open-meteo.com` (histórico) y `api.open-meteo.com` (pronóstico ≤16 días), ambas públicas, 10,000 llamadas/día. La mayoría de viajes se planean con semanas o meses de anticipación — un pronóstico real solo sirve ≤16 días adelante. Para fechas más lejanas, se calcula el **promedio histórico** de temperatura/lluvia de esa zona en esa época del año (mismos días calendario de los últimos años), que es lo que de verdad ayuda a planear ("en agosto ahí llueve seguido, lleva paraguas") en vez de fingir un pronóstico que no existe.

---

## 2. Flujo del usuario

1. Crea el viaje: destino, fechas, presupuesto, viajeros.
2. **"Consultar clima"** (botón, bajo demanda) — geocodifica el destino (Open-Meteo Geocoding, gratis) y trae el estimado según qué tan lejos están las fechas (§1.3). Se guarda en `trips.destination_info`.
3. **"Generar itinerario"** (botón, bajo demanda) — el usuario marca preferencias (playas, naturaleza, museos/cultura, gastronomía, vida nocturna, aventura, compras, relajación) y Gemini genera un itinerario día por día grounded en Google Maps, con enlaces reales a cada lugar sugerido. Se guarda en `trips.ai_itinerary` junto con las fuentes verificadas que usó.
4. Registra gastos del viaje (`trip_expenses`) contra el presupuesto, ve cuánto lleva gastado vs. asignado.

## 3. Qué NO hace (v1)

- No reserva vuelos/hospedaje ni se conecta a APIs de reservas — `flight_info`/`lodging_info` (columnas ya existentes en el esquema) quedan para cuando se decida esa integración, fuera de v1.
- No recalcula el itinerario automáticamente si cambian las fechas — el usuario regenera manualmente si quiere.
- No arma rutas optimizadas geográficamente (eso sí necesitaría Routes API con cuenta de Maps propia) — el orden del itinerario es el que Gemini propone según lógica de día/preferencia, no un cálculo de distancia real.

## 4. Diseño de datos (sin migración — columnas ya existentes)

```ts
// trips.destination_info
{
  weather: {
    is_forecast: boolean;       // true si ≤16 días (pronóstico real), false si es promedio histórico
    avg_high_c: number;
    avg_low_c: number;
    avg_precipitation_mm: number;
    source: 'open-meteo';
    fetched_at: string;
  }
}

// trips.ai_itinerary
{
  generated_at: string;
  preferences: string[];        // ["playas", "gastronomía", ...]
  markdown: string;             // itinerario día por día en texto
  sources: Array<{ title: string; uri: string }>;  // lugares reales verificados en Google Maps
}
```

## 5. Otras piezas

- Alerta condicional en dashboard: "Tu viaje a [destino] empieza en N días" (mismo patrón que los demás módulos).
- `get_trips` para Neto: viajes próximos, presupuesto vs. gastado, clima si ya se consultó.
- Sin cambios a `v_net_worth_current` — un viaje no es un activo ni pasivo persistente.

## 6. Decisiones cerradas (2026-07-20)

1. ✅ **Grounding de Google Maps vía Gemini** — sin cuenta nueva de Google Cloud, enlaces a Google Maps en vez de mapa embebido.
2. ✅ **8 preferencias tal cual** — playas, naturaleza, museos/cultura, gastronomía, vida nocturna, aventura, compras, relajación.
3. ✅ **Clima e itinerario bajo demanda** (botón).
4. ✅ **Alerta condicional en dashboard** — viaje próximo.
