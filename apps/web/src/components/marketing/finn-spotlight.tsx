'use client';

import { motion } from 'framer-motion';
import { Reveal } from './reveal';

const MESSAGES = [
  { role: 'user', text: '¿Cuánto me deben en total?' },
  {
    role: 'finn',
    text: 'Tienes $411.05 pendientes en 3 préstamos activos. Mario debe $60 desde hace 12 días — es tu único vencido.',
  },
  { role: 'user', text: '¿Y si saco efectivo de mi tarjeta para prestarle a mi primo?' },
  {
    role: 'finn',
    text: 'No te lo recomiendo. Un retiro de efectivo no tiene período de gracia — pagarías intereses desde hoy mismo, más la comisión. Es la forma más cara de prestar dinero.',
  },
];

export function FinnSpotlight() {
  return (
    <section id="finn" className="relative overflow-hidden bg-landing-paper py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-landing-terracotta/[0.08] blur-[140px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-landing-terracotta">// Neto</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
            Un asistente que <span className="text-landing-terracotta">consulta antes de hablar</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-landing-ink-soft">
            La mayoría de los asistentes financieros inventan respuestas genéricas. Neto
            ejecuta herramientas reales sobre tus datos — saldos, presupuesto, préstamos —
            antes de contestar. Si no sabe algo, te lo dice.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-landing-ink/10 bg-landing-cream p-4">
              <p className="font-mono text-2xl text-landing-terracotta">100%</p>
              <p className="mt-1 text-sm text-landing-ink-soft">basado en tus datos reales</p>
            </div>
            <div className="rounded-xl border border-landing-ink/10 bg-landing-cream p-4">
              <p className="font-mono text-2xl text-landing-terracotta">0</p>
              <p className="mt-1 text-sm text-landing-ink-soft">números inventados</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-landing-ink/10 bg-landing-cream p-5 shadow-2xl shadow-landing-ink/10">
            <div className="mb-4 flex items-center gap-2 border-b border-landing-ink/10 pb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-landing-terracotta/15 font-mono text-[11px] text-landing-terracotta">
                AI
              </span>
              <p className="text-sm font-medium text-landing-ink">Neto</p>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-ff-green">
                <span className="h-1.5 w-1.5 rounded-full bg-ff-green" />
                en línea
              </span>
            </div>

            <div className="space-y-3">
              {MESSAGES.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.35, duration: 0.4 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-landing-terracotta/15 text-landing-ink'
                        : 'border border-landing-ink/10 bg-landing-paper/50 text-landing-ink-soft'
                    }`}
                  >
                    {m.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
