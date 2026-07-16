'use client';

import Link from 'next/link';
import { Button, cn } from '@flowfinance/ui';
import { Reveal, RevealGroup, RevealItem } from './reveal';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Prueba el producto antes de comprometerte',
    features: ['5 mensajes Neto/día', '3 escaneos OCR/día', '20 adjuntos de respaldo', 'Presupuesto flexible'],
    featured: false,
  },
  {
    name: 'Starter',
    price: '$4.99',
    period: '/mes',
    description: 'Claridad Financiera',
    features: ['30 mensajes Neto/mes', '30 escaneos OCR/día', '100 adjuntos', 'Neto Daily Brief'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$11.99',
    period: '/mes',
    description: 'Control y Crecimiento',
    features: [
      'Neto ilimitado',
      'Préstamos familiares completo',
      'Simulador 16 escenarios',
      '6 cuentas + tarjetas ilimitadas',
    ],
    featured: true,
  },
  {
    name: 'Elite',
    price: '$24.99',
    period: '/mes',
    description: 'Libertad Financiera',
    features: ['Mi Cartera con interés', 'Control fiscal multi-país', 'Hasta 4 usuarios', 'Soporte prioritario'],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="relative bg-landing-paper py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-landing-terracotta">// Precios</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
            Empieza gratis, crece cuando lo necesites
          </h2>
          <p className="mt-4 text-lg text-landing-ink-soft">Sin letra pequeña. Cancela cuando quieras.</p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
          {PLANS.map((plan) => (
            <RevealItem key={plan.name}>
              <div
                className={cn(
                  'flex h-full flex-col rounded-2xl border p-6',
                  plan.featured
                    ? 'border-landing-terracotta/40 bg-gradient-to-b from-landing-terracotta/[0.08] to-transparent'
                    : 'border-landing-ink/10 bg-landing-cream',
                )}
              >
                {plan.featured && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-landing-terracotta/15 px-3 py-1 font-mono text-[11px] text-landing-terracotta">
                    Más popular
                  </span>
                )}
                <p className="font-display text-lg text-landing-ink">{plan.name}</p>
                <p className="mt-1 text-xs text-landing-ink-soft">{plan.description}</p>
                <p className="mt-5 font-mono text-3xl text-landing-ink">
                  {plan.price}
                  <span className="text-base text-landing-ink-soft">{plan.period}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-landing-ink-soft">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-landing-terracotta" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    'mt-6 rounded-full',
                    plan.featured
                      ? 'bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep'
                      : 'border border-landing-ink/20 bg-transparent text-landing-ink hover:bg-landing-ink/5',
                  )}
                >
                  <Link href="/signup">Empezar</Link>
                </Button>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
