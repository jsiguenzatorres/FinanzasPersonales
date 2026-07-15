'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@flowfinance/ui';

export function MarketingNav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-5 z-50 px-4"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-full border border-landing-ink/10 bg-landing-cream/80 py-2 pl-5 pr-2 shadow-[0_8px_30px_-12px_rgba(36,29,21,0.25)] backdrop-blur-xl">
        <Link href="/" className="font-display text-base tracking-tight text-landing-ink">
          Flow<span className="text-landing-terracotta">Finance</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-landing-ink/70 hover:bg-landing-ink/5 hover:text-landing-ink sm:inline-flex"
          >
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep"
          >
            <Link href="/signup">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
