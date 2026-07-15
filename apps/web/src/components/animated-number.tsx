'use client';

import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Descriptor serializable del formato — NUNCA una función. Un Server
 * Component puede pasar funciones a un Client Component en `next dev`, pero
 * el build de producción lo rechaza (RSC no puede serializar closures) y
 * revienta con "a server-side exception has occurred". Por eso el formato
 * se resuelve aquí adentro, no se recibe como prop.
 */
export type NumberFormat =
  | { kind: 'currency'; currency: string }
  | { kind: 'percent'; decimals?: number };

function resolveFormatter(format: NumberFormat): (n: number) => string {
  if (format.kind === 'currency') {
    const intl = new Intl.NumberFormat('es-SV', { style: 'currency', currency: format.currency });
    return (n) => intl.format(n);
  }
  const decimals = format.decimals ?? 0;
  return (n) => `${n.toFixed(decimals)}%`;
}

/** Cuenta de 0 (o del valor previo) hasta `value` con easing — sin dependencias nuevas. */
export function AnimatedNumber({
  value,
  format,
  duration = 900,
}: {
  value: number;
  format: NumberFormat;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const formatter = resolveFormatter(format);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevValue.current = to;
        setDisplay(to);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{formatter(display)}</>;
}
