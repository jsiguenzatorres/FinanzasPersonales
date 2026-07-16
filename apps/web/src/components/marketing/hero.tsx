'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@flowfinance/ui';
import { AnimatedNumber } from '@/components/animated-number';
import { TiltCard } from './tilt-card';

export function Hero() {
  return (
    <section className="bg-paper-grain relative overflow-hidden bg-landing-cream pb-24 pt-40 sm:pt-48">
      {/* ── Fondo: grid cálido + resplandor terracota suave ─────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-grid-warm absolute inset-0" />
        <div className="animate-drift absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-landing-terracotta/[0.14] blur-[130px]" />
        <div className="animate-drift-slow absolute -right-32 top-32 h-[420px] w-[420px] rounded-full bg-landing-forest/[0.10] blur-[130px]" />
        <div
          className="animate-drift absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-landing-gold/[0.12] blur-[110px]"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* ── Copy ─────────────────────────────────────────────────── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-landing-ink/10 bg-landing-cream px-4 py-1.5 font-mono text-xs text-landing-ink-soft shadow-sm"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-landing-terracotta" />
            Hecho para El Salvador y LATAM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[2.75rem] leading-[1.05] tracking-tight text-landing-ink sm:text-6xl"
          >
            Tu dinero, tus{' '}
            <span className="relative whitespace-nowrap text-landing-terracotta">
              préstamos familiares
            </span>
            <br />
            y tu patrimonio. Sin hojas de cálculo.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-lg text-lg text-landing-ink-soft"
          >
            FlowFinance es la única app que también rastrea el dinero que le prestas a tu
            familia — con <strong className="text-landing-ink">FINN</strong>, un asistente que
            conoce tus números reales, nunca inventa nada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-landing-terracotta px-7 text-base text-landing-cream hover:bg-landing-terracotta-deep"
            >
              <Link href="/signup">Crear cuenta gratis</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-landing-ink/20 px-7 text-base text-landing-ink hover:bg-landing-ink/5"
            >
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-5 font-mono text-xs text-landing-ink-soft/70"
          >
            Sin tarjeta de crédito · Plan gratis para siempre
          </motion.p>
        </div>

        {/* ── Mockup del dashboard real — el mismo tema cálido de la app ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -4 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <TiltCard className="p-6 shadow-2xl shadow-landing-ink/10" glowColor="189, 90, 52">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-landing-ink-soft">
                Patrimonio neto
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-ff-green/10 px-2.5 py-1 font-mono text-xs text-ff-green">
                ↑ 4.2%
              </span>
            </div>
            <p className="font-mono text-4xl font-medium tracking-tight text-landing-ink">
              <AnimatedNumber value={18420.37} format={{ kind: 'currency', currency: 'USD' }} duration={1400} />
            </p>

            <svg viewBox="0 0 300 70" className="mt-6 w-full text-landing-terracotta" preserveAspectRatio="none">
              <motion.path
                d="M0,55 C30,50 45,20 75,28 C105,36 115,10 150,14 C180,17 195,45 225,38 C255,31 265,8 300,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
              />
            </svg>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-landing-ink/10 pt-5">
              <div className="rounded-xl bg-landing-paper/60 p-3.5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-landing-ink-soft">Préstamos activos</p>
                <p className="mt-1 font-mono text-lg text-ff-yellow">
                  <AnimatedNumber value={411.05} format={{ kind: 'currency', currency: 'USD' }} duration={1200} />
                </p>
              </div>
              <div className="rounded-xl bg-landing-paper/60 p-3.5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-landing-ink-soft">Tasa de ahorro</p>
                <p className="mt-1 font-mono text-lg text-ff-blue">
                  <AnimatedNumber value={27} format={{ kind: 'percent' }} duration={1200} />
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-landing-terracotta/20 bg-landing-terracotta/[0.08] p-3.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-landing-terracotta/20 font-mono text-[10px] text-landing-terracotta">
                AI
              </span>
              <p className="text-xs leading-relaxed text-landing-ink-soft">
                Mario no ha abonado su préstamo desde hace 12 días. ¿Le mando un recordatorio?
              </p>
            </div>
          </TiltCard>

          <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-2xl border border-landing-ink/5 bg-landing-terracotta/[0.06]" />
        </motion.div>
      </div>
    </section>
  );
}
