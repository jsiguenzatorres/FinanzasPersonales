'use client';

import { useEffect, useState } from 'react';
import { cn } from '@flowfinance/ui';

const SIZE = 72;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anillo de progreso que se llena con una transición al montar — sin dependencias nuevas. */
export function AnimatedRing({
  percent,
  label,
  colorClass,
}: {
  percent: number;
  label?: string;
  colorClass?: string;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const clamped = Math.min(Math.max(percent, 0), 100);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedPct(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const offset = CIRCUMFERENCE - (animatedPct / 100) * CIRCUMFERENCE;
  const stroke = colorClass ?? (clamped >= 100 ? 'stroke-ff-red' : clamped >= 80 ? 'stroke-ff-yellow' : 'stroke-ff-green');

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted-foreground/15"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(stroke, 'transition-[stroke-dashoffset] duration-1000 ease-out')}
        />
      </svg>
      <span className="absolute font-mono text-sm">{Math.round(clamped)}%</span>
      {label && (
        <span className="absolute -bottom-5 text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
