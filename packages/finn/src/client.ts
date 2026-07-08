import { GoogleGenerativeAI } from '@google/generative-ai';

export type FinnModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface FinnClient {
  chat(prompt: string, model?: FinnModel): Promise<string>;
  classifyJson<T>(prompt: string, model?: FinnModel): Promise<T>;
}

interface CreateOptions {
  apiKey: string;
  defaultModel?: FinnModel;
}

/**
 * Cliente Gemini para FINN.
 * - Usa Flash (más capaz) por defecto para conversación.
 * - Usa Flash-Lite para clasificación y daily brief (más barato).
 */
export function createFinnClient(opts: CreateOptions): FinnClient {
  const genAI = new GoogleGenerativeAI(opts.apiKey);
  const defaultModel = opts.defaultModel ?? 'gemini-2.5-flash';

  async function chat(prompt: string, model?: FinnModel): Promise<string> {
    const m = genAI.getGenerativeModel({ model: model ?? defaultModel });
    const result = await m.generateContent(prompt);
    return result.response.text();
  }

  async function classifyJson<T>(prompt: string, model?: FinnModel): Promise<T> {
    const m = genAI.getGenerativeModel({
      model: model ?? 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 200,
      },
    });
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }

  return { chat, classifyJson };
}
