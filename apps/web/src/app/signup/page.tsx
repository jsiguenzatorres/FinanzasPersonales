import Link from 'next/link';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { signUpAction } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { SubmitButton } from '@/components/submit-button';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a tomar control de tu dinero"
      footer={
        <p className="mt-6 text-center text-sm text-landing-ink-soft">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-landing-terracotta hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-700/25 bg-red-700/10 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <form action={signUpAction} className="space-y-4">
        <AuthField
          id="displayName"
          name="displayName"
          type="text"
          label="Nombre"
          icon={User}
          required
          autoComplete="name"
          placeholder="Tu nombre"
        />
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
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <SubmitButton className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep">
          Crear cuenta
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
