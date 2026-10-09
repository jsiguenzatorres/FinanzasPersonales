import Link from 'next/link';
import { Button } from '@flowfinance/ui';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInAction } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Accede a tu cuenta para continuar"
      footer={
        <p className="mt-6 text-center text-sm text-landing-ink-soft">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-landing-terracotta hover:underline">
            Regístrate
          </Link>
        </p>
      }
    >
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-landing-forest/25 bg-landing-forest/10 px-4 py-3 text-sm text-landing-forest">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-700/25 bg-red-700/10 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <form action={signInAction} className="space-y-4">
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Correo"
          icon={Mail}
          required
          autoComplete="email"
          placeholder="tu@correo.com"
        />
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          icon={Lock}
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <Button
          type="submit"
          className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep"
        >
          Iniciar sesión
        </Button>
      </form>
    </AuthShell>
  );
}
