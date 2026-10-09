import { WifiOff } from 'lucide-react';

/** Fallback que el service worker sirve cuando no hay red — nunca cachea datos financieros. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-landing-cream p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-landing-forest/10">
        <WifiOff className="h-6 w-6 text-landing-forest" aria-hidden="true" />
      </div>
      <p className="font-display text-xl text-landing-ink">Sin conexión</p>
      <p className="max-w-xs text-sm text-landing-ink-soft">
        FlowFinance necesita internet para mostrar tus datos actualizados. Revisa tu conexión e
        intenta de nuevo.
      </p>
    </main>
  );
}
