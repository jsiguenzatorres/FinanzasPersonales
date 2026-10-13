import Link from 'next/link';
import { Mail } from 'lucide-react';
import { requestPasswordResetAction } from '@/lib/auth/actions';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { SubmitButton } from '@/components/submit-button';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviamos un enlace a tu correo para crear una nueva"
      footer={
        <p className="mt-6 text-center text-sm text-landing-ink-soft">
          ¿Ya la recordaste?{' '}
          <Link href="/login" className="text-landing-terracotta hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form action={requestPasswordResetAction} className="space-y-4">
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
        <SubmitButton className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep">
          Enviar enlace
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
