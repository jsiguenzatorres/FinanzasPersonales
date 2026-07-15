import Link from 'next/link';
import { Button, Input, Label } from '@flowfinance/ui';
import { signUpAction } from '@/lib/auth/actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="bg-paper-grain flex min-h-screen items-center justify-center bg-landing-cream p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="font-display text-3xl text-landing-ink">
            Flow<span className="text-landing-terracotta">Finance</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-landing-ink/10 bg-white/60 p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="font-display text-xl text-landing-ink">Crea tu cuenta</h1>
            <p className="mt-1 text-sm text-landing-ink-soft">Empieza a tomar control de tu dinero</p>
          </div>

          <div className="space-y-4">
            {error && (
              <p className="rounded-md border border-red-700/25 bg-red-700/10 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <form action={signUpAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-landing-ink">
                  Nombre
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="border-landing-ink/15 bg-white text-landing-ink placeholder:text-landing-ink-soft/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-landing-ink">
                  Correo
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="border-landing-ink/15 bg-white text-landing-ink placeholder:text-landing-ink-soft/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-landing-ink">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="border-landing-ink/15 bg-white text-landing-ink placeholder:text-landing-ink-soft/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep"
              >
                Crear cuenta
              </Button>
            </form>

            <p className="text-center text-sm text-landing-ink-soft">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-landing-terracotta hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
