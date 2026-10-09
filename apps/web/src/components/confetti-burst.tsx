'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#BD5A34', '#2F6B45', '#B08A4E', '#35578C'];
const PIECE_COUNT = 18;

/**
 * Explosión de confeti — dispara una sola vez al montar si `active` es true.
 * Para celebrar un hito real (meta cumplida, deuda pagada), no decorativo.
 */
export function ConfettiBurst({ active }: { active: boolean }) {
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !zoneRef.current) return;
    const zone = zoneRef.current;

    for (let i = 0; i < PIECE_COUNT; i++) {
      const piece = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 70;
      const duration = 0.7 + Math.random() * 0.5;

      piece.className = 'animate-confetti-piece';
      piece.style.position = 'absolute';
      piece.style.left = '50%';
      piece.style.top = '0';
      piece.style.width = '7px';
      piece.style.height = '7px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';
      piece.style.background = COLORS[i % COLORS.length]!;
      piece.style.setProperty('--confetti-dx', `${Math.cos(angle) * dist}px`);
      piece.style.setProperty('--confetti-dy', `${Math.sin(angle) * dist - 30}px`);
      piece.style.setProperty('--confetti-rot', `${Math.random() * 360}deg`);
      piece.style.setProperty('--confetti-duration', `${duration}s`);

      zone.appendChild(piece);
      setTimeout(() => piece.remove(), duration * 1000 + 200);
    }
  }, [active]);

  return <div ref={zoneRef} className="pointer-events-none relative h-0 w-full overflow-visible" />;
}
