/**
 * Respaldo de emergencia vía NVIDIA NIM (catálogo de modelos comunitarios,
 * endpoint compatible con OpenAI) — solo se invoca cuando Gemini falla.
 * NO es reemplazo de tráfico sostenido: el tier gratuito NIM es ~40 req/min.
 *
 * Cubre classifyJson() y extractFromImage() únicamente. chatWithTools() NO
 * tiene cascada NIM todavía: depende de function calling real (consulta
 * saldos/gastos reales del usuario) y el soporte de tool-calling de los
 * modelos NIM no está confirmado — un fallback ahí podría inventar datos
 * en vez de fallar limpiamente, que es justo lo que FINN tiene prohibido.
 */

const NIM_CHAT_COMPLETIONS_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/** Ranking 1º/2º/3º de la categoría "Rapidez / bajo costo" del catálogo NIM. */
export const NIM_CLASSIFY_CASCADE = [
  'deepseek-ai/deepseek-v4-flash',
  'google/gemma-4-31b-it',
  'nvidia/nemotron-3-nano-30b-a3b',
];

/** Ranking 1º/2º/3º de la categoría "OCR / Extracción de documentos". */
export const NIM_OCR_CASCADE = [
  'nvidia/nemotron-ocr-v2',
  'nvidia/nemotron-parse',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
];

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1]! : trimmed;
}

async function callNimModel(params: {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  content: string | Array<Record<string, unknown>>;
}): Promise<string> {
  const res = await fetch(NIM_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: 'user', content: params.content }],
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NIM ${params.model} respondió ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`NIM ${params.model} no devolvió contenido`);
  }
  return text;
}

/**
 * Prueba una cascada de modelos NIM en orden hasta que uno responda con JSON
 * parseable. Cada capa que falla (error HTTP, contenido vacío, JSON inválido)
 * cae a la siguiente — nunca lanza hasta agotar las tres.
 */
export async function nimJsonCascade<T>(params: {
  apiKey: string;
  models: string[];
  content: string | Array<Record<string, unknown>>;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  let lastError: unknown;

  for (const model of params.models) {
    try {
      const text = await callNimModel({
        apiKey: params.apiKey,
        model,
        temperature: params.temperature ?? 0.1,
        maxTokens: params.maxTokens ?? 500,
        content: params.content,
      });
      return JSON.parse(stripJsonFences(text)) as T;
    } catch (err) {
      console.warn(`[FINN][NIM fallback] ${model} falló, probando siguiente capa:`, err);
      lastError = err;
    }
  }

  throw lastError ?? new Error('Cascada NIM agotada sin respuesta válida');
}
