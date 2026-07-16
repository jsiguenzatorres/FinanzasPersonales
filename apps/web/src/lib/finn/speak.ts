'use server';

import { createFinnTtsClient } from '@flowfinance/finn/tts';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SpeakResult = { ok: true; audioBase64: string } | { ok: false; error: string };

/**
 * Convierte un mensaje de Neto a audio (español latino, es-US-Neural2) —
 * llamada bajo demanda cuando el usuario pulsa "escuchar" en un mensaje, no
 * automática (el redirect de sendFinnMessageAction recarga la página, y los
 * navegadores bloquean el autoplay que no viene de un gesto directo del
 * usuario en ESE render — mejor un botón explícito que confiar en eso).
 */
export async function speakTextAction(text: string): Promise<SpeakResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Sesión expirada. Vuelve a iniciar sesión.' };
  }

  const credentialsJson = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS;
  if (!credentialsJson) {
    return { ok: false, error: 'La voz de Neto todavía no está configurada.' };
  }

  try {
    const tts = createFinnTtsClient({ serviceAccountJson: credentialsJson });
    const audioBuffer = await tts.synthesizeSpeech({ text });
    return { ok: true, audioBase64: audioBuffer.toString('base64') };
  } catch (err) {
    console.error('[Neto speak] error:', err);
    return { ok: false, error: 'No se pudo generar el audio. Intenta de nuevo.' };
  }
}
