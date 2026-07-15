'use client';

import { Reveal, RevealGroup, RevealItem } from './reveal';
import { TiltCard } from './tilt-card';

const FEATURES = [
  {
    tag: '01',
    title: 'FINN, tu asesor con memoria real',
    description:
      'No es un chatbot genérico — consulta tus cuentas, gastos y préstamos de verdad antes de responder. Nunca inventa números.',
    textClass: 'text-landing-terracotta',
    rgb: '189, 90, 52',
    span: 'lg:col-span-2',
  },
  {
    tag: '02',
    title: 'Préstamos familiares',
    description: 'El dinero que le prestas a tu familia, rastreado — algo que ninguna otra app hace.',
    textClass: 'text-landing-gold',
    rgb: '176, 138, 78',
    span: '',
  },
  {
    tag: '03',
    title: 'Escanea el recibo',
    description: 'Toma una foto — FINN lee el monto, el comercio y la categoría por ti.',
    textClass: 'text-landing-forest',
    rgb: '62, 90, 69',
    span: '',
  },
  {
    tag: '04',
    title: 'Presupuesto en 3 modos',
    description: 'Zero-based, flexible o 50/30/20. El que se ajuste a cómo realmente vives.',
    textClass: 'text-landing-terracotta',
    rgb: '189, 90, 52',
    span: '',
  },
  {
    tag: '05',
    title: 'Patrimonio neto en vivo',
    description: 'Cuentas, tarjetas y deudas — un solo número que sube o baja en tiempo real.',
    textClass: 'text-landing-forest',
    rgb: '62, 90, 69',
    span: 'lg:col-span-2',
  },
];

export function Features() {
  return (
    <section id="producto" className="relative bg-landing-cream py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-landing-terracotta">
            // Todo en un lugar
          </p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
            Diseñado para cómo se manejan las finanzas en LATAM
          </h2>
          <p className="mt-4 text-lg text-landing-ink-soft">
            No solo importamos una app gringa y la tradujimos. Empezamos por lo que las demás
            ignoran.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {FEATURES.map((f) => (
            <RevealItem key={f.tag} className={f.span}>
              <TiltCard glowColor={f.rgb} className="h-full p-6">
                <div className="flex h-full flex-col">
                  <span className={`font-mono text-xs ${f.textClass}`}>{f.tag}</span>
                  <h3 className="mt-4 font-display text-xl leading-snug text-landing-ink">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-landing-ink-soft">{f.description}</p>
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
