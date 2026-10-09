'use client';

import { useFormStatus } from 'react-dom';
import { Bot } from 'lucide-react';

/** "Neto está escribiendo..." — debe ir DENTRO del <form>, lee el estado vía useFormStatus. */
export function TypingIndicator() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-forest">
        <Bot className="h-3.5 w-3.5 text-landing-cream" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
