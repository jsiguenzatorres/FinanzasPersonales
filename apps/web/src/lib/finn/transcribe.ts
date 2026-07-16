'use server';

import { createFinnClient } from '@flowfinance/finn/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TranscribeResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Transcribe una nota de voz corta a texto — llamada directamente desde un
 * Client Component (no es un <form action>, así que devuelve un resultado en
 * vez de hacer redirect()). El texto resultante llena el campo de mensaje
 * para que el usuario lo revise antes de enviarlo; nunca se envía solo.
 */
export async function transcribeAudioAction(audioBase64: string, mimeType: string): Promise<TranscribeResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Sesión expirada. Vuelve a iniciar sesión.' };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, error: 'Neto no está configurado (falta GEMINI_API_KEY).' };
  }

  const client = createFinnClient({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const text = await client.transcribeAudio({ audioBase64, mimeType });
    if (!text) {
      return { ok: false, error: 'No entendí el audio. Intenta de nuevo o escribe tu pregunta.' };
    }
    return { ok: true, text };
  } catch (err) {
    console.error('[Neto transcribe] error:', err);
    return { ok: false, error: 'No se pudo transcribir el audio. Intenta de nuevo.' };
  }
}
