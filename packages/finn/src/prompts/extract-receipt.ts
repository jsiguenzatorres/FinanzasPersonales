import { z } from 'zod';

export const receiptItemSchema = z.object({
  description: z.string(),
  qty: z.number(),
  unit_price: z.number(),
  line_total: z.number(),
});

export const receiptOcrSchema = z.object({
  confidence: z.number().min(0).max(1),
  merchant: z.object({
    name: z.string().nullable(),
    tax_id: z.string().nullable(),
  }),
  date: z.string().nullable(),
  currency: z.string(),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number(),
  items: z.array(receiptItemSchema).default([]),
  payment_method: z.string().nullable(),
  invoice_number: z.string().nullable(),
  raw_text: z.string(),
});

export type ReceiptOcrData = z.infer<typeof receiptOcrSchema>;

/**
 * Prompt para Gemini 2.5 Flash multimodal — extracción de datos de recibos.
 * Spec: docs/modules/mod-04-gastos.md §6.1
 */
export const RECEIPT_OCR_PROMPT = `Eres un extractor de datos de recibos y facturas para usuarios en El Salvador.
Analiza la imagen del recibo y devuelve un JSON estructurado.

REGLAS:
- Todos los montos son DECIMAL (usa punto, no coma).
- La moneda default es USD si no ves indicación clara (El Salvador usa USD oficialmente).
- Si no puedes leer un campo, ponlo en null (NO inventes datos).
- El campo "confidence" debe reflejar tu certeza global de la lectura (0.0-1.0).
- Extrae "items" solo si son legibles individualmente línea por línea; si no, deja items como [].
- Preserva "raw_text" con el texto crudo detectado (máximo 500 caracteres).
- Si la imagen NO es un recibo o factura (ej. una selfie, un documento no relacionado),
  responde con total: 0, confidence: 0, y raw_text explicando brevemente qué detectaste.

Formato de respuesta (JSON estricto, sin texto adicional fuera del JSON):
{
  "confidence": 0.0-1.0,
  "merchant": { "name": "string|null", "tax_id": "string|null" },
  "date": "YYYY-MM-DD|null",
  "currency": "USD",
  "subtotal": number|null,
  "tax": number|null,
  "total": number,
  "items": [ { "description": "string", "qty": number, "unit_price": number, "line_total": number } ],
  "payment_method": "cash|credit_card|debit_card|transfer|null",
  "invoice_number": "string|null",
  "raw_text": "string"
}`;
