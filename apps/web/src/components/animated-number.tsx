'use client';

import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Cuenta de 0 (o del valor previo) hasta `value` con easing — sin dependencias nuevas. */
export function AnimatedNumber({
  value,
  format,
  duration = 900,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

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

  return <>{format(display)}</>;
}
