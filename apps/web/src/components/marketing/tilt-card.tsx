'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useSpring } from 'framer-motion';
import { cn } from '@flowfinance/ui';

/**
 * Tarjeta con inclinación 3D sutil que sigue el mouse — profundidad sin
 * librerías 3D pesadas. `variant="dark"` se usa para el mockup del producto
 * real (que sí es dark-mode); `variant="light"` (default) para tarjetas que
 * viven sobre el fondo crema de la landing.
 */
export function TiltCard({
  children,
  className,
  glowColor = '189, 90, 52',
  variant = 'light',
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  variant?: 'light' | 'dark';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });
  const glowX = useSpring(50, { stiffness: 200, damping: 25 });
  const glowY = useSpring(50, { stiffness: 200, damping: 25 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 10);
    rotateX.set((0.5 - py) * 10);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const background = useMotionTemplate`radial-gradient(280px circle at ${glowX}% ${glowY}%, rgba(${glowColor}, 0.14), transparent 70%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        variant === 'dark'
          ? 'border-white/10 bg-[rgb(15,17,23)]'
          : 'border-landing-ink/10 bg-landing-cream/90',
        className,
      )}
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
