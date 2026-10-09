'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@flowfinance/ui';

/**
 * Botón de envío que muestra un spinner mientras el server action procesa —
 * debe ir DENTRO del <form>, useFormStatus lee el estado del form padre.
 */
export function SubmitButton({ children, disabled, ...props }: Omit<ButtonProps, 'type'>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : children}
    </Button>
  );
}
