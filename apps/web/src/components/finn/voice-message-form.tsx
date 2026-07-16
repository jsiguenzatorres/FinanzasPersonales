'use client';

import { useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button, Input, cn } from '@flowfinance/ui';
import { sendFinnMessageAction } from '@/lib/finn/chat';
import { transcribeAudioAction } from '@/lib/finn/transcribe';
import { blobToBase64, blobToMp3 } from '@/lib/audio/encode-mp3';

/** MediaRecorder no puede grabar directo a un formato que Gemini acepte en
 * todos los navegadores — mp4/aac si el navegador lo soporta (Safari), si
 * no cae a webm/opus (Chrome/Firefox) y se convierte a mp3 después. */
function pickRecorderMimeType(): string {
  const preferred = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
  for (const type of preferred) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function VoiceMessageForm({ conversationId }: { conversationId: string | null }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => void handleRecordingStopped(recorder.mimeType || mimeType);

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setVoiceError('No pude acceder al micrófono. Revisa los permisos del navegador.');
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }

  async function handleRecordingStopped(recordedMimeType: string) {
    setIsProcessing(true);
    try {
      const rawBlob = new Blob(chunksRef.current, { type: recordedMimeType || 'audio/webm' });
      const needsConversion = !recordedMimeType.includes('mp4') && !recordedMimeType.includes('mpeg');
      const mp3Blob = needsConversion ? await blobToMp3(rawBlob) : rawBlob;
      const mimeType = needsConversion ? 'audio/mp3' : recordedMimeType;

      const base64 = await blobToBase64(mp3Blob);
      const result = await transcribeAudioAction(base64, mimeType);

      if (!result.ok) {
        setVoiceError(result.error);
        return;
      }
      setMessage((prev) => (prev ? `${prev} ${result.text}` : result.text));
    } catch {
      setVoiceError('No se pudo procesar el audio. Intenta de nuevo o escribe tu pregunta.');
    } finally {
      setIsProcessing(false);
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <form action={sendFinnMessageAction} className="flex gap-2">
        <input type="hidden" name="conversation_id" value={conversationId ?? ''} />
        <Input
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isRecording ? 'Escuchando...' : 'Escribe o graba una nota de voz...'}
          required
          disabled={isRecording}
          className="flex-1"
        />
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isProcessing}
          aria-label={isRecording ? 'Detener grabación' : 'Grabar nota de voz'}
          className={cn(
            'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border transition-colors disabled:pointer-events-none disabled:opacity-50',
            isRecording
              ? 'animate-pulse border-destructive bg-destructive text-destructive-foreground'
              : 'border-border bg-transparent hover:bg-card',
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRecording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
        <Button type="submit" disabled={isRecording || isProcessing}>
          Enviar
        </Button>
      </form>
      {isProcessing && <p className="text-xs text-muted-foreground">Transcribiendo tu nota de voz...</p>}
      {voiceError && <p className="text-xs text-ff-red">{voiceError}</p>}
    </div>
  );
}
