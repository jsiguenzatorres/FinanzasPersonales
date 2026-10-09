import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';

/** Layout compartido de login/signup — panel de marca + formulario, partido en dos. */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-landing-cream p-6">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-2xl border border-landing-ink/10">
        {/* ── Panel de marca ──────────────────────────────────────────── */}
        <div className="bg-paper-grain hidden flex-col justify-between bg-landing-forest p-8 sm:flex sm:w-[42%]">
          <Link href="/" className="font-display text-xl text-landing-cream">
            Flow<span className="text-landing-terracotta-soft">Finance</span>
          </Link>

          <div>
            <p className="font-display text-2xl leading-tight text-landing-cream">
              Tus finanzas,
              <br />
              bajo control.
            </p>
            <p className="mt-2.5 text-sm text-landing-cream/70">
              Cuentas, tarjetas, metas, deudas y tu asistente Neto, todo en un solo lugar.
            </p>
          </div>

          <div className="w-fit rounded-xl bg-landing-cream px-4 py-3.5">
            <p className="text-[11px] uppercase tracking-wide text-landing-ink-soft">Patrimonio neto</p>
            <p className="font-display text-xl text-ff-green">$24,850</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-ff-green">
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
              4.2% este mes
            </p>
          </div>
        </div>

        {/* ── Formulario ──────────────────────────────────────────────── */}
        <div className="flex w-full flex-col justify-center bg-landing-cream px-6 py-10 sm:w-[58%] sm:px-11">
          <Link href="/" className="mb-6 font-display text-xl text-landing-ink sm:hidden">
            Flow<span className="text-landing-terracotta">Finance</span>
          </Link>
          <h1 className="font-display text-xl text-landing-ink">{title}</h1>
          <p className="mt-1 text-sm text-landing-ink-soft">{subtitle}</p>

          <div className="mt-6 space-y-4">{children}</div>

          {footer}
        </div>
      </div>
    </main>
  );
}
