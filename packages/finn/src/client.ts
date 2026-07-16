import { GoogleGenAI, type Content, type FunctionDeclaration } from '@google/genai';
import { nimJsonCascade, NIM_CLASSIFY_CASCADE, NIM_OCR_CASCADE } from './nim-fallback';

// Alias "latest" de Google — apuntan siempre al modelo flash vigente, evita
// romperse cuando Google retira una versión fija (ej. gemini-2.5-flash dejó
// de estar disponible para API keys nuevas sin aviso previo en el código).
export type FinnModel = 'gemini-flash-latest' | 'gemini-flash-lite-latest';

export interface ChatWithToolsParams {
  systemPrompt: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  message: string;
  tools: FunctionDeclaration[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  model?: FinnModel;
}

export interface ChatWithToolsResult {
  text: string;
  toolCalls: Array<{ name: string; input: unknown; output: unknown }>;
  tokensIn: number;
  tokensOut: number;
}

export interface ExtractFromImageParams {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  model?: FinnModel;
}

export interface TranscribeAudioParams {
  audioBase64: string;
  /** Gemini NO acepta audio/webm — debe convertirse antes (mp3, wav, ogg, aac, flac, aiff). */
  mimeType: string;
  model?: FinnModel;
}

export interface FinnClient {
  chat(prompt: string, model?: FinnModel): Promise<string>;
  classifyJson<T>(prompt: string, model?: FinnModel): Promise<T>;
  chatWithTools(params: ChatWithToolsParams): Promise<ChatWithToolsResult>;
  extractFromImage<T>(params: ExtractFromImageParams): Promise<T>;
  transcribeAudio(params: TranscribeAudioParams): Promise<string>;
}

interface CreateOptions {
  apiKey: string;
  defaultModel?: FinnModel;
  /**
   * Opcional — si se provee, classifyJson() y extractFromImage() caen a una
   * cascada de modelos NVIDIA NIM cuando Gemini falla. chatWithTools() NO usa
   * este respaldo (ver nim-fallback.ts). Sin esta key, el comportamiento es
   * idéntico al anterior: un fallo de Gemini simplemente se propaga.
   */
  nvidiaApiKey?: string;
}

/**
 * Cliente Gemini para Neto. Usa @google/genai (SDK vigente — el anterior
 * @google/generative-ai entró en mantenimiento limitado con EOL nov-2025).
 * - Usa Flash (más capaz) por defecto para conversación.
 * - Usa Flash-Lite para clasificación y daily brief (más barato).
 */
export function createFinnClient(opts: CreateOptions): FinnClient {
  const genAI = new GoogleGenAI({ apiKey: opts.apiKey });
  const defaultModel = opts.defaultModel ?? 'gemini-flash-latest';
  const nvidiaApiKey = opts.nvidiaApiKey;

  async function chat(prompt: string, model?: FinnModel): Promise<string> {
    const result = await genAI.models.generateContent({
      model: model ?? defaultModel,
      contents: prompt,
    });
    return result.text ?? '';
  }

  async function classifyJson<T>(prompt: string, model?: FinnModel): Promise<T> {
    try {
      const result = await genAI.models.generateContent({
        model: model ?? 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 200,
        },
      });
      return JSON.parse(result.text ?? '') as T;
    } catch (err) {
      if (!nvidiaApiKey) throw err;
      console.warn('[FINN] Gemini falló en classifyJson, probando cascada NIM:', err);
      return nimJsonCascade<T>({
        apiKey: nvidiaApiKey,
        models: NIM_CLASSIFY_CASCADE,
        content: prompt,
        maxTokens: 200,
      });
    }
  }

  /**
   * Conversación con function calling. Ejecuta un loop: si Gemini pide invocar
   * una herramienta, la ejecuta vía executeTool() y le devuelve el resultado,
   * hasta un máximo de 5 vueltas (evita bucles).
   */
  async function chatWithTools(params: ChatWithToolsParams): Promise<ChatWithToolsResult> {
    const chatSession = genAI.chats.create({
      model: params.model ?? defaultModel,
      config: {
        systemInstruction: params.systemPrompt,
        tools: params.tools.length > 0 ? [{ functionDeclarations: params.tools }] : undefined,
      },
      history: params.history as Content[],
    });

    let result = await chatSession.sendMessage({ message: params.message });
    const toolCalls: ChatWithToolsResult['toolCalls'] = [];

    let functionCalls = result.functionCalls;
    let guard = 0;

    while (functionCalls && functionCalls.length > 0 && guard < 5) {
      guard++;
      const functionResponseParts = await Promise.all(
        functionCalls.map(async (call) => {
          const name = call.name ?? '';
          const output = await params.executeTool(name, (call.args ?? {}) as Record<string, unknown>);
          toolCalls.push({ name, input: call.args, output });
          return {
            functionResponse: { name, response: output as Record<string, unknown> },
          };
        }),
      );

      result = await chatSession.sendMessage({ message: functionResponseParts });
      functionCalls = result.functionCalls;
    }

    const usage = result.usageMetadata;

    return {
      text: result.text ?? '',
      toolCalls,
      tokensIn: usage?.promptTokenCount ?? 0,
      tokensOut: usage?.candidatesTokenCount ?? 0,
    };
  }

  /**
   * Extrae datos estructurados de una imagen (OCR de recibos vía Gemini
   * multimodal). Usa Flash por defecto — más capaz que Flash-Lite para
   * lectura de imágenes con texto denso.
   */
  async function extractFromImage<T>(params: ExtractFromImageParams): Promise<T> {
    try {
      const result = await genAI.models.generateContent({
        model: params.model ?? 'gemini-flash-latest',
        contents: [
          { inlineData: { data: params.imageBase64, mimeType: params.mimeType } },
          { text: params.prompt },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1500,
        },
      });

      return JSON.parse(result.text ?? '') as T;
    } catch (err) {
      if (!nvidiaApiKey) throw err;
      console.warn('[FINN] Gemini falló en extractFromImage, probando cascada NIM:', err);
      return nimJsonCascade<T>({
        apiKey: nvidiaApiKey,
        models: NIM_OCR_CASCADE,
        maxTokens: 1500,
        content: [
          { type: 'text', text: params.prompt },
          { type: 'image_url', image_url: { url: `data:${params.mimeType};base64,${params.imageBase64}` } },
        ],
      });
    }
  }

  /**
   * Transcribe un audio corto (nota de voz del chat) a texto plano. Sin
   * cascada NIM — es una pieza nueva, sin volumen de producción todavía que
   * justifique un respaldo; si Gemini falla, el error se propaga y el chat
   * le pide al usuario que reintente o escriba en su lugar.
   */
  async function transcribeAudio(params: TranscribeAudioParams): Promise<string> {
    const result = await genAI.models.generateContent({
      model: params.model ?? 'gemini-flash-lite-latest',
      contents: [
        { inlineData: { data: params.audioBase64, mimeType: params.mimeType } },
        {
          text: 'Transcribe exactamente lo que dice este audio, en español. Responde SOLO con la transcripción, sin comentarios ni formato adicional.',
        },
      ],
      config: { temperature: 0 },
    });
    return (result.text ?? '').trim();
  }

  return { chat, classifyJson, chatWithTools, extractFromImage, transcribeAudio };
}
