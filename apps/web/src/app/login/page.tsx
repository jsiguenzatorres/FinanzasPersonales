import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { signInAction } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { SubmitButton } from '@/components/submit-button';

export default function LoginPage() {
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
        <p className="-mt-1 text-right text-sm">
          <Link href="/forgot-password" className="text-landing-terracotta hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <SubmitButton className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep">
          Iniciar sesión
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
