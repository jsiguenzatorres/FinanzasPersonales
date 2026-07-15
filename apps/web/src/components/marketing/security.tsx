'use client';

import { Reveal, RevealGroup, RevealItem } from './reveal';

const POINTS = [
  {
    title: 'Aislamiento total entre usuarios',
    description: 'Row Level Security a nivel de base de datos — ni siquiera un bug en el código podría filtrar tus datos a otro usuario.',
  },
  {
    title: 'Tus adjuntos, solo tuyos',
    description: 'Comprobantes y fotos se guardan en un bucket privado con URLs firmadas que expiran — nunca públicas.',
  },
  {
    title: 'Nunca vendemos tus datos',
    description: 'No hay marketplace de datos financieros. Tu información es tuya, punto.',
  },
];

export function Security() {
  return (
    <section className="relative bg-landing-cream py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-landing-forest">// Seguridad</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-landing-ink sm:text-5xl">
              Tratamos tus finanzas como lo que son
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-landing-ink-soft">
              Nada de esto es opcional ni un "roadmap futuro" — está construido desde el
              primer día.
            </p>
          </Reveal>

          <RevealGroup className="space-y-4" stagger={0.1}>
            {POINTS.map((p) => (
              <RevealItem key={p.title}>
                <div className="flex gap-4 rounded-xl border border-landing-ink/10 bg-landing-paper/60 p-5">
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-landing-forest/10 font-mono text-xs text-landing-forest">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-landing-ink">{p.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-landing-ink-soft">{p.description}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
