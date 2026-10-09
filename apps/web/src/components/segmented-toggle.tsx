'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@flowfinance/ui';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Clases del borde + texto cuando está activa, ej. 'border-ff-green/40 text-ff-green'. */
  activeClassName?: string;
  /** Clase de fondo de la pastilla deslizante, ej. 'bg-ff-green/10'. */
  pillClassName?: string;
}

/** Toggle tipo segmented control con pastilla que se desliza — misma técnica que el menú lateral. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const pillId = useId();

  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 overflow-hidden rounded-md border px-3 py-2 text-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
              opt.description ? 'text-left' : 'text-center',
              active ? (opt.activeClassName ?? 'border-primary text-foreground') : 'border-border text-muted-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className={cn('absolute inset-0', opt.pillClassName ?? 'bg-primary/10')}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <p className={cn('relative z-10', opt.description && 'font-medium text-foreground')}>{opt.label}</p>
            {opt.description && <p className="relative z-10 mt-1 text-xs">{opt.description}</p>}
          </button>
        );
      })}
    </div>
  );
}
