'use server';

import { randomUUID } from 'node:crypto';
import { createFinnClient } from '@flowfinance/finn/client';
import { RECEIPT_OCR_PROMPT, receiptOcrSchema, type ReceiptOcrData } from '@flowfinance/finn/prompts/extract-receipt';
import { getPlanLimits } from '@flowfinance/shared/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ScanReceiptResult =
  | { ok: true; data: ReceiptOcrData; receiptPath: string }
  | { ok: false; error: string };

/**
 * Invocada directamente (RPC-style) desde el cliente, no vía <form action>.
 * Sube la imagen a Storage y la envía a Gemini multimodal para extraer datos.
 */
export async function scanReceiptAction(formData: FormData): Promise<ScanReceiptResult> {
  const file = formData.get('receipt');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No se recibió ninguna imagen.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'La imagen no puede superar 5MB.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'No autenticado.' };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, error: 'OCR no está configurado (falta GEMINI_API_KEY).' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan, is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    const limit = getPlanLimits(profile?.plan).limits.ocrScansPerDay;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count: todayScans } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('capture_source', 'ocr_receipt')
      .gte('created_at', startOfDay.toISOString());

    if ((todayScans ?? 0) >= limit) {
      return {
        ok: false,
        error: `Alcanzaste tu límite diario de escaneos (${limit}). Vuelve mañana o captura manual.`,
      };
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const client = createFinnClient({
    apiKey: process.env.GEMINI_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  });

  let extracted: unknown;
  try {
    extracted = await client.extractFromImage({
      imageBase64: base64,
      mimeType: file.type || 'image/jpeg',
      prompt: RECEIPT_OCR_PROMPT,
    });
  } catch {
    return { ok: false, error: 'No pude leer el recibo. Intenta con otra foto o captura manual.' };
  }

  const parsed = receiptOcrSchema.safeParse(extracted);
  if (!parsed.success) {
    return { ok: false, error: 'El recibo no se pudo interpretar correctamente. Intenta otra foto.' };
  }

  if (parsed.data.total <= 0) {
    return { ok: false, error: 'No detecté un recibo válido en la imagen. Intenta otra foto o captura manual.' };
  }

  const path = `${user.id}/${randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(path, arrayBuffer, { contentType: file.type || 'image/jpeg' });

  if (uploadError) {
    return { ok: false, error: 'No se pudo guardar la imagen del recibo.' };
  }

  return { ok: true, data: parsed.data, receiptPath: path };
}
