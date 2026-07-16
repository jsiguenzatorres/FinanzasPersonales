'use client';

import { useRef, useState } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { cn } from '@flowfinance/ui';
import { speakTextAction } from '@/lib/finn/speak';

export function SpeakButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleClick() {
    if (status === 'playing') {
      audioRef.current?.pause();
      setStatus('idle');
      return;
    }
    if (status === 'loading') return;

    setStatus('loading');
    setError(null);
    const result = await speakTextAction(text);

    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      return;
    }

    const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
    audioRef.current = audio;
    audio.onended = () => setStatus('idle');
    audio.onerror = () => {
      setStatus('error');
      setError('No se pudo reproducir el audio.');
    };
    setStatus('playing');
    void audio.play();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={error ?? undefined}
      className={cn(
        'mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors',
        status === 'error' ? 'text-ff-red' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {status === 'loading' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : status === 'playing' ? (
        <Square className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
      {status === 'error' ? 'Error' : status === 'playing' ? 'Detener' : 'Escuchar'}
    </button>
  );
}
