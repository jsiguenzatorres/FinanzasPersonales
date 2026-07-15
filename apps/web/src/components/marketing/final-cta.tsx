'use client';

import Link from 'next/link';
import { Button } from '@flowfinance/ui';
import { Reveal } from './reveal';

export function FinalCta() {
  return (
    <section className="relative bg-landing-paper py-28">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-landing-terracotta/25 bg-gradient-to-b from-landing-terracotta/[0.10] to-transparent px-8 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-terracotta/25 blur-[120px]" />
            <div className="relative">
              <h2 className="font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
                Empieza a ordenar tu dinero hoy
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-landing-ink-soft">
                Gratis para siempre en el plan básico. Sin tarjeta de crédito.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-landing-terracotta px-8 text-base text-landing-cream hover:bg-landing-terracotta-deep"
                >
                  <Link href="/signup">Crear cuenta gratis</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
