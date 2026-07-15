'use client';

import { motion } from 'framer-motion';
import { Reveal } from './reveal';

const LOANS = [
  { name: 'Mario', relation: 'Hermano', amount: 60, status: 'Vencido', overdue: true },
  { name: 'Ana', relation: 'Hermana', amount: 65, status: 'Compra con tarjeta', overdue: false },
  { name: 'Carlos', relation: 'Primo', amount: 150, status: 'Retiro de efectivo', overdue: false },
];

export function LoansSpotlight() {
  return (
    <section className="relative bg-landing-cream py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <Reveal className="order-2 lg:order-1">
            <div className="space-y-3">
              {LOANS.map((loan, i) => (
                <motion.div
                  key={loan.name}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                    loan.overdue
                      ? 'border-red-800/20 bg-red-800/[0.04]'
                      : 'border-landing-ink/10 bg-landing-paper/60'
                  }`}
                >
                  <div>
                    <p className="font-medium text-landing-ink">{loan.name}</p>
                    <p className="text-xs text-landing-ink-soft">
                      {loan.relation} · {loan.status}
                      {loan.overdue && <span className="text-red-700"> · vencido</span>}
                    </p>
                  </div>
                  <p className="font-mono text-lg text-landing-terracotta">${loan.amount.toFixed(2)}</p>
                </motion.div>
              ))}
              <div className="flex items-center justify-between rounded-xl border border-landing-terracotta/25 bg-landing-terracotta/[0.06] px-5 py-4">
                <p className="text-sm font-medium text-landing-ink">Total pendiente</p>
                <p className="font-mono text-xl text-landing-terracotta">$275.00</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-landing-gold">
              // Exclusivo LATAM
            </p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
              El dinero que le prestas a tu familia,{' '}
              <span className="text-landing-terracotta">por fin ordenado</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-landing-ink-soft">
              En El Salvador y LATAM, prestarle a la familia es normal — pero nadie lo
              anota. Termina siendo una captura de WhatsApp que nadie vuelve a ver.
              FlowFinance lo trackea como cualquier otra cuenta: cuánto, a quién, cómo se
              entregó y cuándo te lo tienen que devolver.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-landing-ink-soft">
              Y si prestas usando tu tarjeta de crédito, FINN te avisa cuánto te va a costar
              de verdad — antes de que sea tarde.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
