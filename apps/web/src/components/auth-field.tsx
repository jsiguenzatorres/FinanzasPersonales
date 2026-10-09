import type { LucideIcon } from 'lucide-react';
import { Input, Label, type InputProps } from '@flowfinance/ui';

/** Campo de login/signup con ícono — envuelve el Input compartido, no lo reemplaza. */
export function AuthField({
  id,
  label,
  icon: Icon,
  ...inputProps
}: { id: string; label: string; icon: LucideIcon } & InputProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-landing-ink">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-landing-ink-soft"
          aria-hidden="true"
        />
        <Input
          id={id}
          className="border-landing-ink/15 bg-white pl-9 text-landing-ink placeholder:text-landing-ink-soft/50"
          {...inputProps}
        />
      </div>
    </div>
  );
}
