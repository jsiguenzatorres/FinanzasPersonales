# MOD-07 — Inversiones

> **Versión:** 1.1 — **APROBADA** (2026-07-20)
> **Fase:** 2
> **Tablas core:** `investments`, `investment_transactions`, `v_net_worth_current` (se modifica)
> **Status:** El esqueleto de base de datos ya existe (migración `20260630121400`) — sin código de aplicación todavía.

---

## 1. Propósito y alcance

### 1.1 Qué hace
Trackea las inversiones del usuario — acciones, ETFs, fondos, bonos, cripto, bienes raíces, participación en negocio — con cantidad, costo promedio y valor actual. Para cripto, permite actualizar el precio en vivo vía CoinGecko (gratis, sin API key). Para el resto, el precio se actualiza a mano.

### 1.2 Qué NO hace (v1)
- **No es un ledger de compra/venta.** `investment_transactions` (buy/sell/dividend/split/fee) existe en el esquema pero implica recalcular costo promedio ponderado en cada operación — complejidad real sin un caso de uso claro todavía. v1 trata cada inversión como un registro editable directo (cantidad y costo promedio se ajustan a mano, igual que `manual_assets` en Patrimonio), sin historial de transacciones. Se revisita si hace falta más adelante.
- **No trae precios en vivo de acciones/ETFs/bonos/CETES.** Eso requeriría otra API externa (Alpha Vantage, Twelve Data, etc.) con sus propias llaves y límites — decisión aparte, no se mete de gratis en este corte. Solo cripto tiene actualización automática (CoinGecko).
- No ejecuta órdenes de compra/venta reales — es tracking, no un bróker.
- La lista de tipos (`stock, etf, mutual_fund, bond, cete, crypto, real_estate, business_equity, other`) incluye `cete` (Cetesdirecto, México) porque así estaba en el esquema original, pero el copy de la UI no lo destaca — la app es El Salvador primero, dolarizada, sin CETES. Queda como una opción más de la lista, no como el caso de uso principal.

### 1.3 Alcance v1 vs. después

| Feature | v1 | Después |
|---|---|---|
| CRUD manual de inversiones | ✅ | — |
| Actualizar precio a mano | ✅ | — |
| Actualizar precio de cripto vía CoinGecko | ✅ | — |
| Ganancia/pérdida no realizada (calculada, no guardada) | ✅ | — |
| Inversiones suman a patrimonio neto (§3) | ✅ | — |
| Ledger de compra/venta con costo promedio ponderado | ❌ | ✅ si hace falta |
| Precios en vivo de acciones/ETFs/bonos | ❌ | ✅ Fase 3, requiere decidir proveedor |
| Dividendos, splits | ❌ | ✅ junto con el ledger |

---

## 2. Actualización de precio de cripto — CoinGecko

Endpoint público, sin autenticación: `GET https://api.coingecko.com/api/v3/simple/price?ids={coingecko_id}&vs_currencies={currency}`. El problema: el ticker que el usuario conoce ("BTC") no es el `id` que pide CoinGecko ("bitcoin") — no hay una correspondencia mecánica.

**Solución:** al crear/editar una inversión tipo `crypto`, un campo adicional `coingecko_id` (opcional, guardado en `metadata` jsonb — ya existe esa columna, sin migración nueva) con una lista de los ~20 más comunes preseleccionables (bitcoin, ethereum, tether, solana, etc.) más opción de escribir el id manualmente si no está en la lista. Sin ese id no hay botón de "Actualizar precio" — se edita a mano como cualquier otra inversión.

---

## 3. Integración con patrimonio neto — arregla un bug encontrado

`v_net_worth_current` (la vista que ya usa Patrimonio Neto, MOD-17, construida en el MVP) tiene este comentario textual desde que se creó:

> "Cobertura MVP: accounts + credit_cards + manual_assets + manual_liabilities. **Inversiones y préstamos otorgados se suman en Fase 2** cuando existan esos módulos."

Inversiones nunca se agregó (este módulo no existía). Pero tampoco se agregó cuando se construyó Préstamos Familiares (Fase 2) antes en esta misma sesión — un vacío real que quedó pendiente. Como este módulo ya requiere modificar esa vista, se corrigen ambas cosas juntas en la misma migración:

- `investments.current_value` (WHERE `is_active = true`) se suma como activo.
- `family_loans.balance` (WHERE `status = 'active'`) se suma como activo ("cuentas por cobrar" — dinero que otros te deben).

**Aviso importante:** esto cambia el patrimonio neto mostrado para cualquier usuario que ya tenga préstamos familiares activos (como el usuario de prueba `test.free@flowfinance.dev`) — su patrimonio neto subirá para reflejar correctamente el dinero prestado. Es una corrección, no un bug nuevo, pero el número en pantalla se mueve.

---

## 4. Campos (ya existen, sin cambios de esquema salvo el uso de `metadata`)

| Campo | Tipo | Notas |
|---|---|---|
| `name` / `ticker` | text | |
| `type` | enum `investment_type` | |
| `broker` | text | opcional |
| `quantity` / `avg_cost` | numeric | editables directamente en v1 |
| `current_price` | numeric | manual, o automático si `type='crypto'` y hay `coingecko_id` |
| `current_value` | numeric | columna generada — `quantity * current_price` |
| `total_invested` | numeric | columna generada — `quantity * avg_cost` |
| `metadata` | jsonb | `{ coingecko_id: "bitcoin" }` cuando aplica |
| `is_active` | boolean | ocultar sin borrar (ej. se vendió todo) |

Ganancia/pérdida no realizada se calcula en la app: `current_value - total_invested`, sin persistir (evita otro trigger para un valor derivado simple).

## 5. Decisiones cerradas (2026-07-20)

1. ✅ **Sin ledger en v1** — edición directa de cantidad/costo, como `manual_assets`.
2. ✅ **Se corrige `v_net_worth_current`** para sumar inversiones Y préstamos familiares en el mismo corte.
3. ✅ **`get_investments` se agrega en este mismo corte.**
