import Link from 'next/link';
import { Button } from '@flowfinance/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-10">
      <h1 className="font-display text-5xl">
        Flow<span className="text-ff-green">Finance</span>
      </h1>
      <p className="text-muted-foreground">
        Plataforma de finanzas personales para LATAM. Skeleton listo.
      </p>
      <p className="font-mono text-xs text-ff-green">● Fase 0 — Cimientos</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/signup">Crear cuenta</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </main>
  );
}
