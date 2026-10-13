import { Mail } from 'lucide-react';
import { requestPortalAccessAction } from '@/lib/portal/actions';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { SubmitButton } from '@/components/submit-button';

export default function PortalLoginPage() {
  return (
    <AuthShell
      title="Consulta tu préstamo"
      subtitle="Escribe el correo donde te registraron y te mandamos un enlace de acceso"
      footer={
        <p className="mt-6 text-center text-xs text-landing-ink-soft">
          Solo puedes ver los préstamos registrados con este correo.
        </p>
      }
    >
      <form action={requestPortalAccessAction} className="space-y-4">
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
          Enviar enlace de acceso
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
