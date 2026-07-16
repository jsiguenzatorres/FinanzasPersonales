import { TextToSpeechClient } from '@google-cloud/text-to-speech';

/**
 * Voz por defecto: es-US Neural2 — el estándar de la industria para
 * "español latino neutro" (ni acento de España, ni de un país específico).
 * Ver MD/nvidia-nim-modelos-backup para el resto de la investigación de
 * proveedores — Cloud TTS se eligió sobre el TTS nativo de Gemini porque este
 * último (aún en Preview) no permite fijar el acento LATAM de forma
 * confiable, solo "español" genérico.
 */
const DEFAULT_VOICE = 'es-US-Neural2-A';
const DEFAULT_LANGUAGE_CODE = 'es-US';

export interface SynthesizeSpeechParams {
  text: string;
  voiceName?: string;
  speakingRate?: number;
}

export interface FinnTtsClient {
  synthesizeSpeech(params: SynthesizeSpeechParams): Promise<Buffer>;
}

interface CreateTtsOptions {
  /** JSON completo de la cuenta de servicio de Google Cloud (no una API key simple). */
  serviceAccountJson: string;
}

/**
 * Cliente de Google Cloud Text-to-Speech para la voz de Neto. Requiere una
 * cuenta de servicio de GCP con el rol "Cloud Text-to-Speech User" — no usa
 * la misma API key de Gemini (son productos distintos de Google, con
 * facturación separada). Ver docs/modules/mod-08-finn.md para el paso a paso
 * de creación de la cuenta de servicio.
 */
export function createFinnTtsClient(opts: CreateTtsOptions): FinnTtsClient {
  const credentials = JSON.parse(opts.serviceAccountJson);
  const client = new TextToSpeechClient({ credentials });

  async function synthesizeSpeech(params: SynthesizeSpeechParams): Promise<Buffer> {
    const [response] = await client.synthesizeSpeech({
      input: { text: params.text },
      voice: {
        languageCode: DEFAULT_LANGUAGE_CODE,
        name: params.voiceName ?? DEFAULT_VOICE,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: params.speakingRate ?? 1.0,
      },
    });

    if (!response.audioContent) {
      throw new Error('Cloud TTS no devolvió audio');
    }

    return Buffer.isBuffer(response.audioContent)
      ? response.audioContent
      : Buffer.from(response.audioContent as Uint8Array);
  }

  return { synthesizeSpeech };
}
