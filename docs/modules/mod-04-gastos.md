# MOD-04 — Gastos

> **Versión:** 1.0 — **APROBADA** (2026-06-30)
> **Fase:** 1 (MVP — Sub-fase 1.1, semanas 4-7)
> **Tablas core:** `transactions`, `categories`, `credit_cards`, `accounts`, `recurrings`, `trips`, `goals`, `tax_records`
> **Status:** Módulo más usado del sistema. La UX de captura debe ser BRUTALMENTE rápida (target ≤10 seg).

---

## Decisiones cerradas (2026-06-30)

1. ✅ **Rate limits Free: 3 OCRs/día + 20 clasificaciones/día.** Starter: 30/300 · Pro: 300/ilimitado · Elite: todo ilimitado.
2. ✅ **`merchant_name` como texto libre en MVP.** Normalización simple (lowercase + trim). Tabla `merchants` catalog se evalúa en Fase 2.
3. ✅ **Geolocalización opt-in.** Configurable en settings; nunca automática. UI muestra explícitamente cuando se guarda.
4. ✅ **Long-press en FAB con swipe up alternativo.** En desktop dropdown normal.
5. ✅ **Edit de split padre con modal**: opciones "Ajustar proporcionalmente" (default) vs "Rehacer split manualmente".

---

## 1. Propósito y alcance

### 1.1 Qué hace
Captura, categoriza y consulta CADA salida de dinero del usuario: compras, pagos de tarjeta, comisiones, retiros de cajero, intereses pagados, reembolsos recibidos y ajustes. Es la vista dominante del día a día.

### 1.2 Qué NO hace
- No gestiona presupuesto (eso es MOD-03).
- No calcula patrimonio (eso es MOD-17).
- No gestiona deudas propias ni tarjetas específicamente (MOD-16 / MOD-15 tienen su vista dedicada; MOD-04 registra los cargos individuales).
- No procesa transferencias entre cuentas propias como "gasto" — esas son transferencias (creadas desde MOD-02 o el modal global).

### 1.3 Alcance MVP vs Fase 2

| Feature | MVP | Fase 2 |
|---|---|---|
| Captura manual ultra-rápida | ✅ target ≤10 seg | Optimización continua |
| Categorización automática con Gemini Flash-Lite | ✅ | Modelo local (offline) |
| OCR de recibos con Gemini multimodal | ✅ | Mejorado con feedback loop |
| Split en múltiples categorías | ✅ | — |
| Adjuntar foto/recibo | ✅ Supabase Storage | — |
| Tags libres | ✅ | Sugerencias de tags |
| Marcar deducible fiscalmente | ✅ | Reglas automáticas por categoría |
| Multi-moneda con FX automático | ✅ | — |
| Búsqueda y filtros | ✅ | Búsqueda semántica |
| Vinculación con viaje / meta / colab | ✅ | — |
| Dictado de voz | ❌ | ✅ Gemini multimodal audio |
| Detección de duplicados | ❌ | ✅ ML |
| Detección de anomalías | ❌ | ✅ ML |
| Sugerencia proactiva de categorías nuevas | ❌ | ✅ |
| Import CSV bancario | ❌ | ✅ |

---

## 2. Tipos de transacción manejados por MOD-04

MOD-04 registra transacciones con estos `transaction_kind`:

| `kind` | Descripción | Signo | Ejemplo |
|---|---|---|---|
| `expense` | Gasto normal | - | Café en Starbucks $4.50 |
| `cc_charge` | Cargo a tarjeta de crédito | - (baja disponible en CC) | Compra con Visa $85 |
| `fee` | Comisión bancaria | - | Comisión mensual $3 |
| `interest_paid` | Interés pagado | - | Interés tarjeta $12 |
| `refund` | Reembolso recibido | + | Devolución Amazon $30 |
| `adjustment` | Ajuste manual | +/- | Corrección de saldo -$5 |

Excluidos: `income`, `transfer_in`, `transfer_out`, `cc_payment`, `interest_earned` — esos viven en otros módulos.

---

## 3. Casos de uso

### CU-01 — Registro rápido (path dorado)
**Actor:** Usuario en supermercado, quiere registrar el gasto sin ceremonia.
**Trigger:** Botón flotante "+ Gasto" siempre visible en la app.
**Flujo (target ≤10 segundos):**
1. Tap FAB → drawer sube con campo de monto grande.
2. Usuario tipea `4.50` en teclado numérico.
3. Tipea "café starbucks" en descripción.
4. Sistema en background: llama Gemini Flash-Lite para categorizar.
5. Sistema pre-selecciona: categoría "Alimentación → Cafeterías", cuenta usada más recientemente, fecha hoy.
6. Usuario ve chips confirmatorios: `☕ Cafeterías · 💳 BAC Corriente · Hoy`.
7. Tap "Guardar" (o swipe up).
8. Transaction creada, balance actualizado, toast confirmatorio.

**Postcondición:** Aparece en el timeline del día en Dashboard. Presupuesto de "Cafeterías" ajusta % ejecución.

### CU-02 — Captura con foto de recibo (OCR)
**Actor:** Usuario acaba de pagar la cena, tiene el recibo en la mano.
**Flujo:**
1. Tap FAB → tap ícono cámara.
2. Toma foto del recibo (o selecciona de galería).
3. UI muestra "Neto está leyendo tu recibo…" (skeleton).
4. Edge Function `expense-ocr` sube imagen a Supabase Storage temporal + llama Gemini 2.5 Flash multimodal con prompt de extracción.
5. Gemini devuelve JSON estructurado: `{merchant, total, tax, subtotal, items, date, currency}`.
6. UI pre-llena el form con esos valores, resalta cada campo con badge "IA" y confidence.
7. Usuario revisa, ajusta si necesario, tap guardar.
8. La foto queda adjunta en `transactions.receipt_url`.

**Tiempo objetivo:** ≤30 segundos (foto + revisión + guardar).
**Costo:** ~$0.001 por recibo con Flash multimodal.

### CU-03 — Split de una compra en múltiples categorías
**Actor:** Usuario compra $120 en supermercado: $80 despensa + $30 productos de limpieza + $10 golosinas.
**Flujo:**
1. Captura monto $120 y descripción.
2. Tap "Dividir en categorías".
3. UI muestra sub-form: 3 filas de (categoría + monto).
4. Sistema valida `SUM(splits) = total`.
5. Al guardar, sistema crea:
   - 1 transaction "padre" con `is_split = true`, `split_details` JSONB con el desglose
   - 3 transactions "hijas" con `split_parent_id = parent.id`, cada una con su categoría y monto
6. Solo la padre afecta balance. Las hijas son informativas para reportes por categoría.
7. Reportes de gasto por categoría suman por hijas cuando `is_split = true`, sino por padre.

### CU-04 — Marcar como deducible fiscalmente
**Actor:** Freelance que compra material de oficina.
**Flujo:**
1. Captura gasto normal $150 en categoría "Educación" (deducible por default).
2. Sistema pre-marca `is_tax_deductible = true` porque categoría lo es.
3. En sección avanzada: agrega número de factura, adjunta PDF/imagen.
4. Al guardar, sistema crea `tax_records` con `type = 'deductible_expense'` vinculado a la transaction.
5. En MOD-19 (Fase 3) el usuario ve el gasto en su declaración anual.

### CU-05 — Reembolso (kind = refund)
**Actor:** Usuario devolvió una compra Amazon, le devolvieron $30.
**Flujo:**
1. Tap "+ Gasto" → tap toggle "Es un reembolso".
2. UI cambia iconografía y color a verde.
3. Captura monto $30, cuenta destino (donde entró), descripción "Devolución Amazon".
4. (Opcional) Vincula al gasto original: sistema busca transactions candidatas del merchant "Amazon" en últimos 60 días.
5. Al guardar, se crea con `kind = 'refund'`, balance sube +$30, transaction original NO se anula (mantiene registro histórico).

### CU-06 — Gasto en viaje (multi-moneda)
**Actor:** Usuario está en Costa Rica de viaje, paga ₡8,000 por almuerzo.
**Flujo:**
1. Trip activo detectado (MOD-18, Fase 2). En MVP: usuario captura y selecciona trip.
2. Sistema pre-selecciona `currency = 'CRC'` desde `trip.destination_currency`.
3. Captura ₡8,000.
4. Trigger `fill_amount_base` consulta `get_fx_rate('CRC', 'USD', today)` → $15.20.
5. Sistema muestra ambos: "₡8,000 CRC (~$15.20 USD)".
6. Al guardar, crea transaction Y `trip_expenses` en Fase 2 (en MVP solo transaction con `trip_id`).

### CU-07 — Gasto con tarjeta de crédito
**Actor:** Usuario paga con Visa BAC.
**Flujo:**
1. Captura monto y descripción como cualquier gasto.
2. Selecciona `card_id` (Visa BAC) en lugar de `account_id`.
3. Sistema crea transaction con `kind = 'cc_charge'`, `card_id = ...`, `account_id = <account espejo de la tarjeta>`.
4. Balance de `credit_cards.current_balance` sube +$monto.
5. Disponible de crédito baja: `available_credit = credit_limit - current_balance`.
6. Aparece en estado de cuenta del ciclo actual (MOD-15).

### CU-08 — Buscar y filtrar gastos
**Actor:** Usuario quiere revisar cuánto gastó en restaurantes el mes pasado.
**Flujo:**
1. Va a `/app/gastos`.
2. Filtros disponibles: rango de fechas, categorías (multiselect), cuentas, tarjetas, tags, moneda, mín/máx monto, con/sin recibo, deducible.
3. Búsqueda por texto: `merchant_name` + `description` + `notes` con `gin_trgm_ops` (fuzzy).
4. Resultados con totales agregados en encabezado: "247 transacciones · $1,234.56 USD".
5. Ordenamiento: fecha desc default; toggle a monto, categoría.

### CU-09 — Editar gasto
**Actor:** Usuario ve error, quiere corregir.
**Flujo:**
1. Tap en transaction del timeline o lista.
2. Modal con todos los campos editables.
3. Cambios:
   - Si cambia monto → trigger recalcula balance de cuenta.
   - Si cambia currency → trigger recalcula `amount_base` via `get_fx_rate`.
   - Si cambia categoría → afecta reportes y presupuesto de la categoría vieja/nueva.
   - Si cambia cuenta → balance de vieja sube +, nueva baja -.
   - Si cambia `is_split` → crea/borra hijas.
4. Sin `audit_log` en UPDATE (decisión aprobada).

### CU-10 — Eliminar gasto
**Actor:** Registro duplicado o incorrecto irreversible.
**Flujo:**
1. Tap → menú → eliminar → confirmar.
2. Soft delete: `deleted_at = now()`, `deleted_by = auth.uid()`.
3. Trigger `log_delete_audit` crea entrada en `audit_log`.
4. Trigger de balance revierte el efecto.
5. Si tenía hijas de split, se soft-borran en cascada.
6. Aparece en papelera 30 días.

### CU-11 — Gasto recurrente (bill fijo)
**Actor:** Netflix $9.99 mensual.
**Flujo:**
1. Captura gasto normal $9.99, tap "Convertir en recurrente".
2. Sub-form: frecuencia (mensual), día del mes, fecha inicio, fecha fin opcional.
3. Sistema crea entrada en `recurrings` + este gasto queda vinculado con `recurring_id`.
4. Job `process-recurrings` genera nuevas transacciones cada mes.
5. Vinculación cruzada: aparece como suscripción en MOD-06 (Fase 2).

### CU-12 — Comisión bancaria detectada
**Actor:** Ve cargo raro "Comisión SMS" $1.50 en la app del banco.
**Flujo:**
1. Captura como gasto con `kind = 'fee'` (o desde UI: toggle "Es comisión").
2. Categoría automática: "Finanzas → Comisiones bancarias".
3. Se registra pero NO cuenta hacia presupuesto — es informativo puro (banks fees no son "presupuestables").

### CU-13 — Ajuste manual (desviación no explicada)
**Actor:** Balance calculado difiere del real.
**Flujo:**
1. Va a detalle de cuenta → "Ajustar saldo" (definido en MOD-02 CU-05).
2. Sistema crea transaction con `kind = 'adjustment'`, `merchant_name = 'Ajuste manual'`, monto = delta.
3. Aparece en timeline con badge distintivo.

---

## 4. Modelo de datos

### 4.1 Tabla `transactions`
Ya definida en `supabase/migrations/20260630121000_transactions.sql`. Campos relevantes para MOD-04:

| Campo | Uso en MOD-04 |
|---|---|
| `kind` | `expense` / `cc_charge` / `fee` / `interest_paid` / `refund` / `adjustment` |
| `amount` | Siempre positivo (signo determinado por `kind`) |
| `currency` | Moneda del gasto |
| `amount_base` | Llenado por trigger `fill_amount_base` |
| `transaction_date` | Fecha del gasto |
| `posted_at` | Cuando se reflejó en banco (opcional) |
| `merchant_name` | Auto-sugerido por Gemini o capturado |
| `description` | Descripción libre |
| `category_id` | Categoría asignada (usuario o sistema) |
| `ai_category_id` | Sugerencia de Gemini (para tracking de override) |
| `ai_confidence` | 0-1, para saber cuándo confiar |
| `receipt_url` | Path en Supabase Storage bucket `receipts/<user_id>/` |
| `receipt_ocr_data` | JSON crudo devuelto por Gemini |
| `money_class_override` | Override de necesidad/deseo/ahorro por transacción (aprobado) |
| `is_tax_deductible` | Boolean, pre-seteado por categoría |
| `tax_record_id` | FK opcional a `tax_records` |
| `capture_source` | `manual` / `ocr_receipt` / `voice` / etc. |
| `is_split` | True si tiene hijas |
| `split_parent_id` | FK self para hijas |
| `split_details` | JSONB con desglose completo en padre |
| `location` | JSONB `{lat, lng, address}` (opcional) |
| `trip_id` | FK a viaje (opcional) |
| `goal_id` | FK a meta (raro en gastos, más común en ingresos) |
| `collab_space_id` | Si es gasto compartido |
| `paid_by_user_id` | Quién pagó (útil en colab) |
| `tags` | text[] libres |
| `deleted_at` | Soft delete |

### 4.2 Estructura `split_details` JSONB
```json
{
  "total": 120.00,
  "splits": [
    {
      "category_id": "uuid-despensa",
      "amount": 80.00,
      "description": "Frutas y verduras",
      "child_transaction_id": "uuid-hija-1"
    },
    {
      "category_id": "uuid-limpieza",
      "amount": 30.00,
      "description": "Detergente y cloro",
      "child_transaction_id": "uuid-hija-2"
    },
    {
      "category_id": "uuid-snacks",
      "amount": 10.00,
      "description": "Chocolates",
      "child_transaction_id": "uuid-hija-3"
    }
  ]
}
```

**Invariant validado en función RPC:**
- `SUM(splits[].amount) = total ± 0.01`
- Cada `child_transaction_id` existe y tiene `split_parent_id = padre.id`

### 4.3 Estructura `receipt_ocr_data` JSONB
```json
{
  "extracted_at": "2026-06-30T14:23:45Z",
  "model": "gemini-2.5-flash",
  "confidence": 0.92,
  "merchant": { "name": "Super Selectos", "tax_id": "0614-XXXXXX-XXX-0" },
  "date": "2026-06-30",
  "currency": "USD",
  "subtotal": 45.13,
  "tax": 5.87,
  "total": 51.00,
  "items": [
    { "description": "Leche 1L", "qty": 2, "unit_price": 1.50, "line_total": 3.00 },
    { "description": "Pan de molde", "qty": 1, "unit_price": 2.25, "line_total": 2.25 }
  ],
  "payment_method": "credit_card",
  "invoice_number": "F-12345",
  "raw_text": "..."
}
```

### 4.4 Reglas de integridad
- `amount > 0` (constraint en BD).
- Si `is_split = true`, debe existir al menos 2 hijas con `split_parent_id`.
- Si `kind = 'cc_charge'`, `card_id NOT NULL`.
- Si `kind IN ('expense', 'cc_charge', 'fee', 'interest_paid')`, afecta balance en dirección negativa.
- Si `kind = 'refund'`, dirección positiva.
- `receipt_url` debe estar en bucket `receipts/<user_id>/`.

---

## 5. Reglas de negocio

### 5.1 Efecto en balance por `kind`
Ya definido en trigger `update_account_balance()` de MOD-02:

| `kind` | Efecto en `accounts.balance` | Efecto en `credit_cards.current_balance` |
|---|---|---|
| `expense` | -amount (en account_id) | — |
| `cc_charge` | — (no toca cuenta) | +amount (aumenta deuda) |
| `fee` | -amount | — |
| `interest_paid` | -amount | -amount si cargo al saldo CC |
| `refund` | +amount | — |
| `adjustment` | +/- amount | — |

### 5.2 Efecto en presupuesto
- Solo `expense` y `cc_charge` cuentan hacia `budget_categories.spent_amount`.
- `fee` e `interest_paid` NO cuentan (son costos operativos, no gasto discrecional).
- `refund` REVIERTE presupuesto: resta del `spent_amount` de la categoría original.
- `adjustment` no toca presupuesto.

### 5.3 Money class y presupuesto 50/30/20
Prioridad de resolución para presupuesto 50/30/20:
1. Si `transactions.money_class_override IS NOT NULL` → usa esa.
2. Sino, usa `categories.money_class`.

Esto habilita casos como: categoría "Ropa" es `want`, pero un uniforme escolar puede marcarse como `need` en esa transacción específica.

### 5.4 Categorización automática con Gemini
Al capturar, si el usuario tipea `merchant_name` o `description` (≥3 chars):
1. Debounce 500ms.
2. Llama Edge Function `expense-classify` con: `{merchant, description, amount, currency, past_categories_of_user (top 20)}`.
3. Gemini Flash-Lite responde con `{category_id, confidence, reasoning}`.
4. Si `confidence ≥ 0.85`: pre-selecciona.
5. Si `confidence < 0.85`: pre-selecciona pero muestra chip "IA sugiere · confirma".
6. Registra `ai_category_id` y `ai_confidence` en transaction.
7. Si usuario cambia manualmente antes de guardar, se registra el override.

**Costo:** ~$0.00005 por clasificación (input ~100 tokens, output ~30).

### 5.5 OCR de recibos con Gemini multimodal
Flujo:
1. Usuario toma/selecciona foto.
2. Frontend hace upload a Supabase Storage bucket `receipts/<user_id>/temp/<uuid>.jpg`.
3. Frontend llama Edge Function `expense-ocr` con `{receipt_path, currency_hint}`.
4. Edge Function:
   - Descarga imagen desde Storage.
   - Envía a Gemini 2.5 Flash multimodal con prompt.
   - Parsea JSON de respuesta.
   - Valida con Zod (`receiptOcrSchema`).
5. Responde al frontend con datos extraídos.
6. Al guardar transaction, imagen se mueve de `/temp/` a permanente: `receipts/<user_id>/<transaction_id>.jpg`.

**Rate limit por plan:**
- Free: 3 OCRs/día
- Starter: 30/día
- Pro: 300/día
- Elite: ilimitado

**Costo:** ~$0.001 por OCR (imagen ≤500KB, respuesta ~500 tokens).

### 5.6 Detección de duplicados (heurística MVP)
Al capturar, si en las últimas 24h hay transaction con:
- Mismo `amount` (±0.01)
- Misma `currency`
- Mismo `account_id` o `card_id`
- Mismo `merchant_name` (case-insensitive)

Mostrar warning: "Podría ser duplicado de X registrado hace Y horas. ¿Continuar?"

No bloquea, solo advierte.

### 5.7 Vinculación con viaje activo
En Fase 2 con MOD-18: si hay viaje activo (`trips.status = 'active'` y `today BETWEEN start_date AND end_date`):
- Pre-seleccionar `trip_id`.
- Pre-seleccionar `currency = trip.destination_currency`.
- Al guardar, crear `trip_expenses` con la conversión FX.

En MVP: solo captura `trip_id` opcional; `trip_expenses` no existe activo aún.

---

## 6. OCR con Gemini multimodal — spec detallada

### 6.1 Prompt template

```
Eres un extractor de datos de recibos y facturas para usuarios en El Salvador.
Analiza la imagen del recibo y devuelve un JSON estructurado.

REGLAS:
- Todos los montos son DECIMAL (usa punto, no coma).
- La moneda default es USD si no ves indicación clara.
- Si no puedes leer un campo, ponlo en null (NO inventes).
- El campo `confidence` debe reflejar tu certeza global (0.0-1.0).
- Extrae items solo si son legibles individualmente.
- Preserva `raw_text` con el texto crudo detectado (máx 500 chars).

Contexto adicional del usuario:
- Moneda esperada: {currency_hint}
- País: El Salvador

Formato de respuesta (JSON estricto):
{
  "confidence": 0.0-1.0,
  "merchant": { "name": "string|null", "tax_id": "string|null" },
  "date": "YYYY-MM-DD|null",
  "currency": "USD|MXN|EUR|...",
  "subtotal": number|null,
  "tax": number|null,
  "total": number,
  "items": [ { "description": "string", "qty": number, "unit_price": number, "line_total": number } ],
  "payment_method": "cash|credit_card|debit_card|transfer|null",
  "invoice_number": "string|null",
  "raw_text": "string"
}
```

### 6.2 Configuración Gemini
```json
{
  "model": "gemini-2.5-flash",
  "generationConfig": {
    "responseMimeType": "application/json",
    "temperature": 0.1,
    "maxOutputTokens": 1500
  }
}
```

### 6.3 Validación post-OCR
- `total > 0`
- `SUM(items.line_total) ≈ subtotal ± 0.05` (si items presentes)
- `subtotal + tax ≈ total ± 0.05`
- `date` no futuro > 1 día
- Si validación falla, mostrar "OCR parcial — revisa los datos".

### 6.4 Fallback si Gemini falla
- Timeout 15 seg.
- Si error, guardar imagen y crear transaction en modo `capture_source = 'manual'` con `receipt_url` seteado pero sin `receipt_ocr_data`.
- Log evento `expense_ocr_failed` en telemetría.

---

## 7. API / Endpoints

| # | Tipo | Path / Función | Descripción |
|---|---|---|---|
| 1 | Supabase client | `from('transactions').select()` | Listar/filtrar (RLS) |
| 2 | Edge Function POST | `/functions/v1/expense-create` | Crear gasto (con validaciones + splits + tax_record) |
| 3 | Edge Function POST | `/functions/v1/expense-classify` | Sugerir categoría (Gemini Flash-Lite) |
| 4 | Edge Function POST | `/functions/v1/expense-ocr` | Extraer datos de recibo (Gemini Flash multimodal) |
| 5 | Edge Function POST | `/functions/v1/expense-update` | Editar (con revertir + reaplicar efectos en balance) |
| 6 | Edge Function DELETE | `/functions/v1/expense-delete` | Soft delete + cascada hijas + audit |
| 7 | Edge Function POST | `/functions/v1/expense-restore` | Restaurar desde papelera |
| 8 | Edge Function POST | `/functions/v1/expense-split` | Convertir gasto simple en split |
| 9 | Edge Function POST | `/functions/v1/expense-detect-duplicate` | Chequeo pre-save |
| 10 | Edge Function GET | `/functions/v1/expense-search` | Búsqueda avanzada con agregados |

### 7.1 Schema request: `expense-create`

```typescript
POST /functions/v1/expense-create
Body:
{
  kind: 'expense' | 'cc_charge' | 'fee' | 'interest_paid' | 'refund' | 'adjustment',
  amount: number,                              // siempre positivo
  currency: string,                            // ISO 4217
  transaction_date: string,                    // YYYY-MM-DD
  account_id?: string,                         // requerido salvo cc_charge
  card_id?: string,                            // requerido si cc_charge
  category_id?: string,
  merchant_name?: string,
  description?: string,
  notes?: string,
  location?: { lat: number, lng: number, address?: string },
  capture_source: 'manual' | 'ocr_receipt' | 'voice',
  receipt_temp_path?: string,                  // path en /temp/ para mover
  receipt_ocr_data?: object,
  is_tax_deductible?: boolean,
  money_class_override?: 'need' | 'want' | 'savings_debt',
  tags?: string[],
  trip_id?: string,
  goal_id?: string,
  collab_space_id?: string,
  splits?: Array<{
    category_id: string,
    amount: number,
    description?: string
  }>,
  is_recurring?: boolean,
  recurrence?: { frequency: string, day_of_month?: number, end_date?: string },
  invoice_number?: string,                     // solo si is_tax_deductible
  invoice_url?: string
}

Response 201:
{
  transaction: Transaction,
  child_transactions?: Transaction[],          // si splits
  tax_record?: TaxRecord,                      // si is_tax_deductible
  new_account_balance?: number,
  new_cc_balance?: number,
  duplicate_warning?: { candidate_id: string, similarity: number }
}
```

### 7.2 Schema request: `expense-ocr`

```typescript
POST /functions/v1/expense-ocr
Body:
{
  receipt_path: string,                        // "temp/<uuid>.jpg" en Storage
  currency_hint?: string                       // default 'USD'
}

Response 200:
{
  ocr_data: ReceiptOcrData,                    // ver §6.1
  suggested_category_id?: string,              // auto-clasificado si confidence alto
  duplicate_warning?: { ... }
}

Response 422 (OCR falla):
{
  error: 'ocr_failed',
  fallback: { receipt_path: string }           // usuario captura manual
}
```

---

## 8. UI / UX

### 8.1 Pantallas
1. **Lista de gastos** (`/app/gastos`) — timeline agrupado por día con búsqueda y filtros.
2. **Detalle** (`/app/gastos/[id]`) — vista completa con foto de recibo si existe.
3. **Captura rápida** (drawer global, invocado por FAB "+ Gasto").
4. **Captura con foto** (drawer especial con cámara).
5. **Split** (modal expandido dentro de captura).
6. **Reportes** (`/app/gastos/reportes`).

### 8.2 FAB "+ Gasto" — comportamiento

- Siempre visible en Dashboard, MOD-02, MOD-04 (bottom-right en móvil, esquina en desktop).
- Tap corto: drawer captura rápida.
- Tap largo (long-press): menú con opciones: **Gasto normal · Con foto · Reembolso · Comisión · Ajuste**.

### 8.3 Drawer captura rápida — anatomía

```
┌─────────────────────────────────┐
│  ✕                    Guardar  │
├─────────────────────────────────┤
│                                 │
│         $ [ 4.50 ]              │  ← Input grande, teclado numérico
│         USD                     │
│                                 │
│  ¿En qué gastaste? _______      │  ← Text input; dispara Gemini classify
│                                 │
│  🏷️ ☕ Cafeterías  ✎           │  ← Chip pre-seleccionado por IA
│  💳 BAC Corriente ✎             │  ← Chip cuenta reciente
│  📅 Hoy ✎                       │  ← Chip fecha
│                                 │
│  📷 Adjuntar recibo             │  ← Opcional
│  ⋯ Avanzado                    │  ← Split, tags, notas
│                                 │
│  [ Guardar ]  ← swipe up        │
└─────────────────────────────────┘
```

### 8.4 Timeline (lista) — anatomía

```
Hoy · miércoles                    -$47.50
─────────────────────────────────────────
☕ Cafeterías        Starbucks     -$4.50
🛒 Supermercado      Super Selectos-$45.00 📷
    (split: despensa $30 · snacks $15)

Ayer · martes                      -$120.00
─────────────────────────────────────────
🚗 Combustible       Puma Gasolinera -$25.00
🍔 Restaurantes      Wendy's       -$8.50
💳 Ropa              Zara          -$86.50 💳Visa
```

### 8.5 Estados vacíos
- Sin gastos: "Empieza registrando tu primer gasto. Neto puede sugerirte categorías automáticamente."
- Sin resultados en filtro: "No hay gastos que coincidan. Ajusta filtros o rango de fechas."

### 8.6 Confirmaciones críticas
- Eliminar gasto con split: "Se eliminarán 3 líneas de detalle. ¿Continuar?"
- Cambio de monto en transaction con `is_split`: "Se ajustarán las divisiones proporcionalmente" o "Rehacer split manualmente" (usuario elige).
- Duplicado detectado: warning no bloqueante con botones "Continuar" / "Ver duplicado".

### 8.7 Accesibilidad
- FAB con `aria-label="Agregar gasto"`.
- Keyboard shortcut global: `Ctrl+N` en desktop → abre captura rápida.
- Contraste AA en todos los estados.
- Touch targets ≥44px en móvil.

---

## 9. Reportes del módulo

### MVP (5 reportes)
1. **Gastos por categoría del mes** — bar chart (barras horizontales, top 10).
2. **Evolución mensual 12 meses** — line chart.
3. **Gastos por día del mes actual** — bar chart vertical con línea de promedio.
4. **Top 10 merchants del mes** — tabla ordenada por monto.
5. **Distribución necesidad/deseo/ahorro** (50/30/20) — donut chart con semáforo.

### Fase 2 (adicionales)
- Gastos por método de pago (efectivo vs débito vs crédito)
- Gastos deducibles del año fiscal
- Mapa de calor por día de la semana
- Comparativo mes actual vs mismo mes año anterior
- Anomalías detectadas (Fase 2)

---

## 10. RLS y seguridad

Ya definido en migración 11:
```sql
create policy "tx_select" on public.transactions
  for select using (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

create policy "tx_owner_modify" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 10.1 Storage RLS
Bucket `receipts/`:
- Path: `receipts/<user_id>/<transaction_id>.jpg`
- Policy: `auth.uid()::text = (storage.foldername(name))[1]`

### 10.2 Validaciones extra en Edge Functions
- `expense-create`: valida que `account_id` / `card_id` / `category_id` / `trip_id` / `goal_id` / `collab_space_id` pertenezcan al user.
- `expense-ocr`: valida que `receipt_path` esté en `<user_id>/temp/`.
- Servicio usa `service_role` solo cuando maneja Storage move + insert atómico.

### 10.3 Rate limiting
- Categorización IA: por plan (ver §5.4).
- OCR: por plan (ver §5.5).
- Rate limit en Edge Function con Redis-like en Postgres (tabla `rate_limits` liviana) o header de Vercel/Cloudflare.

---

## 11. Validaciones

| Campo | Regla |
|---|---|
| `amount` | > 0, ≤ 2 decimales (8 para BTC) |
| `currency` | ISO 4217 en `currencies` |
| `transaction_date` | No futuro > 1 día |
| `kind` | enum válido |
| `account_id` | Requerido si `kind ≠ 'cc_charge'`, pertenece al user, `status = 'active'` |
| `card_id` | Requerido si `kind = 'cc_charge'`, pertenece al user, `status = 'active'` |
| `category_id` | Pertenece al user o `is_system = true`, no está en `user_hidden_categories`, no `archived_at` |
| `merchant_name` | ≤ 200 chars |
| `description` | ≤ 500 chars |
| `notes` | ≤ 2000 chars |
| `tags` | Max 10, cada uno ≤ 30 chars |
| `receipt_url` | Path válido en bucket `receipts/<user_id>/` |
| `splits` | Si presente, ≥2 entries, `SUM(amount) = total ± 0.01` |
| `is_tax_deductible = true` | Requiere `invoice_number` |
| `location.lat/lng` | Rangos válidos si presentes |
| `trip_id` | Pertenece al user y no `deleted_at` |
| `collab_space_id` | User es `active` member |

---

## 12. Edge cases

| Caso | Manejo |
|---|---|
| Foto de recibo borrosa, OCR devuelve `confidence < 0.5` | UI muestra "OCR poco confiable, revisa cada campo" |
| Foto no es recibo (selfie, meme) | OCR devuelve `total = null`; UI pide foto real o cancelar |
| Recibo con múltiples monedas | OCR devuelve `currency` principal; usuario ajusta si necesario |
| Split donde `SUM ≠ total` | Validación falla, UI resalta último input y pide ajuste |
| Editar gasto con recibo → subir recibo nuevo | Anterior se borra de Storage, nuevo reemplaza |
| Eliminar gasto padre de split | Cascada a hijas (deleted_at en todas) |
| Eliminar hija individual de split | Rechazado; el usuario debe editar el padre |
| Gasto con `card_id` pero también `account_id` | Válido si `account_id` = cuenta espejo del card_id (default) |
| Cambio de kind (expense→refund) | Bloqueado — mejor eliminar y crear nuevo (evita cascada compleja) |
| Recurrente que caía en 31 en mes de 30 días | Genera el día 30 |
| Merchant nuevo detectado por OCR | Se guarda como texto; no se crea entidad separada (queda pendiente para Fase 2 `merchants` catalog) |
| Gasto con FX manual (fallback CU-05 de MOD-00) | Igual: si `get_fx_rate` devuelve NULL, UI pide tasa manual, se aplica solo a este registro |
| Duplicado detectado en captura por foto | Warning no bloqueante después del OCR |
| Categoría eliminada por el user pero transaction la usa | Transaction mantiene `category_id`; UI muestra "Categoría archivada" |
| Tags con caracteres emoji / no-ASCII | Permitido |

---

## 13. Plan de tests

### 13.1 Unit (Vitest)
- Zod: `expenseCreateSchema`, `splitSchema`, `receiptOcrSchema`
- Helpers: `calculateSplitValid(total, splits)`, `detectDuplicate(candidate, recent)`
- Formatters de moneda multi-currency

### 13.2 Integration
- RPC `create_expense()` con escenarios:
  - Gasto simple + balance actualizado
  - Split (crea padre + N hijas atomicamente)
  - CC charge (afecta `credit_cards.current_balance`)
  - Refund (balance sube, presupuesto revierte)
  - Con `is_tax_deductible` → crea `tax_records`
  - Con `capture_source = 'ocr_receipt'` y `receipt_url` movido de temp/
  - Con `trip_id` y multi-moneda
  - Con `collab_space_id` (Fase 3 real, MVP solo persistencia)
- RLS: usuario A no lee/edita transactions de B
- Storage RLS: A no accede a recibos de B
- Trigger `update_account_balance()` con edits complejos

### 13.3 E2E (Playwright)
- Path dorado: captura rápida <10 seg → aparece en timeline → afecta balance dashboard
- Captura con foto (mock Gemini) → OCR llena form → guarda con receipt_url
- Split de 3 categorías → aparece en reporte con desglose correcto
- Eliminar → papelera → restaurar
- Filtros: categoría + fecha + tag → resultados correctos con totales
- Duplicado detectado → warning → continuar → 2 registros

### 13.4 Performance
- Time-to-save después de tap "Guardar" ≤ 800ms P95
- OCR end-to-end ≤ 5 seg P95 (imagen ≤500KB)
- Lista de gastos con 10k transactions: scroll fluido, filtros ≤300ms

---

## 14. Telemetría

### 14.1 Eventos
- `expense_created` props: `kind`, `capture_source`, `has_receipt`, `has_split`, `currency`, `is_tax_deductible`, `time_to_save_ms`
- `expense_ocr_used` props: `confidence`, `parsed_ok`, `was_overridden`
- `expense_categorized_by_ai` props: `confidence`, `was_overridden`
- `expense_split_created` props: `split_count`
- `expense_deleted`, `expense_restored`
- `expense_duplicate_warning_shown` props: `similarity`, `user_action`
- `expense_recurring_created`
- `expense_filter_used` props: `filters_active_count`
- `expense_report_viewed` props: `report_slug`

### 14.2 KPIs
- Median `time_to_save_ms` < 8 seg
- % OCR con confidence ≥0.85: ≥60%
- % de categorización IA aceptada sin cambios: ≥70%
- % de gastos con recibo adjunto: ≥30%
- Gastos por usuario por semana (target): ≥15
- % de gastos marcados como split: 5-15% (indicador de uso pero no dominante)

---

## 15. Out of scope (MVP)

- ❌ Dictado por voz (Fase 2 con Gemini audio)
- ❌ Import CSV bancario (Fase 2)
- ❌ Detección ML de duplicados / anomalías (Fase 2)
- ❌ Merchant catalog global compartido (Fase 2)
- ❌ Sugerencia proactiva de categorías nuevas (Fase 2)
- ❌ Sincronización con billeteras externas (Fase 2)
- ❌ Reparto automático de gastos en `collab_space` con splits porcentuales (Fase 3)
- ❌ Búsqueda semántica (Fase 3)
- ❌ Reglas automáticas ("si merchant contiene X, categoría Y")
- ❌ Bulk edit de múltiples transacciones a la vez

---

## 16. Dependencias

### 16.1 Bloqueadores
- ✅ Schema migraciones 1-22 aplicadas
- ⏳ MOD-02 Cuentas implementado (necesitas `account_id` válidos)
- ⏳ Categorías sistema seed activo (✅ ya en migración 5)
- ⏳ Gemini API key configurada (Fase 0.1)
- ⏳ Supabase Storage bucket `receipts/` creado y policies
- ⏳ MOD-15 Tarjetas para `cc_charge` (se puede paralelizar con MOD-04)

### 16.2 Orden recomendado
1. Zod schemas + RPC `create_expense()` + trigger balance ya cubierto por MOD-02
2. Edge Function `expense-create` con validaciones + tests
3. UI drawer captura rápida (path dorado)
4. UI lista/timeline con scroll infinito
5. Edge Function `expense-classify` + integración en drawer
6. Edge Function `expense-ocr` + UI cámara/upload
7. UI split
8. UI detalle + edit
9. Papelera y restore
10. Filtros y búsqueda
11. 5 reportes MVP
12. Vinculación con viaje y meta
13. Tests

### 16.3 Estimación (1 dev)
- Schemas + RPC + Edge Functions core: 2 días
- UI drawer + timeline: 2.5 días
- Integración Gemini classify: 0.5 día
- Integración Gemini OCR + UI cámara: 1.5 días
- Split UI + backend: 1 día
- Detalle + edit: 1 día
- Papelera + restore: 0.5 día
- Filtros + búsqueda con `pg_trgm`: 1 día
- 5 reportes MVP: 1.5 días
- Tests: 2 días
- **Total estimado:** ~14 días (~3 semanas con buffer)

---

## 17. Decisiones resueltas (2026-06-30)

| # | Decisión | Resolución | Implicación |
|---|---|---|---|
| 1 | Rate limits Free plan | ✅ 3 OCRs/día + 20 clasificaciones/día | Tabla `rate_limits` liviana en Postgres o header edge |
| 2 | Merchants: texto vs tabla | ✅ Texto libre con normalización | `LOWER(TRIM(merchant_name))` para reportes agrupados |
| 3 | Location capture | ✅ Opt-in explícito en settings | Sin geolocation automática nunca |
| 4 | FAB long-press | ✅ Long-press + swipe up + dropdown desktop | 3 gestos alternativos |
| 5 | Edit de split padre | ✅ Modal con 2 opciones | Default: ajuste proporcional |

---

## 18. Artefactos entregables

- ✅ Esta spec aprobada
- ⏳ `packages/shared/src/schemas/expense.ts` con Zod schemas
- ⏳ `packages/finn/src/prompts/classify-expense.ts` y `extract-receipt.ts`
- ⏳ RPC `create_expense()` (+ tests) en nueva migración
- ⏳ Edge Functions: expense-create, expense-classify, expense-ocr, expense-update, expense-delete, expense-restore, expense-split, expense-detect-duplicate, expense-search
- ⏳ UI: FAB, drawer rápido, drawer OCR, lista/timeline, detalle, split, filtros, 5 reportes
- ⏳ Supabase Storage bucket `receipts/` con RLS por path
- ⏳ Tests unit + integration + 6 E2E críticos
- ⏳ Eventos PostHog activos
- ⏳ Doc: `docs/modules/mod-04-gastos.md` aprobado

---

## 19. Conexión con otros módulos

| Módulo | Interacción |
|---|---|
| **MOD-00 Ingresos** | `refund` puede vincularse a un ingreso original (poco común) |
| **MOD-02 Cuentas** | Cada transaction afecta `accounts.balance` via trigger; usa `card_id` para MOD-15 |
| **MOD-01 Dashboard** | Timeline del día, alertas de gastos anómalos, semáforo de presupuesto |
| **MOD-03 Presupuesto** | Cada `expense` / `cc_charge` incrementa `budget_categories.spent_amount`; `refund` lo revierte |
| **MOD-15 Tarjetas** | `cc_charge` aumenta `credit_cards.current_balance`; aparece en estado de cuenta |
| **MOD-05 Metas** | `expense` con `goal_id` (raro pero posible: "pago inicial del auto") |
| **MOD-06 Suscripciones** | Recurrings detectados sugieren crear subscription (Fase 2) |
| **MOD-11 Colaborativas** | `collab_space_id` marca gasto compartido, `paid_by_user_id` identifica pagador (Fase 3) |
| **MOD-12 Salud financiera** | Alertas de gasto atípico usan transactions históricas |
| **MOD-17 Patrimonio** | Balance de cuentas actualizado por transactions se refleja en `net_worth_snapshots` |
| **MOD-18 Viajes** | `trip_id` vincula transaction a viaje activo (Fase 2 con `trip_expenses`) |
| **MOD-19 Fiscal** | `is_tax_deductible = true` crea `tax_records` (Fase 3 UX completa) |
| **MOD-20 Calendario** | Recurrings de gastos aparecen como eventos futuros |
