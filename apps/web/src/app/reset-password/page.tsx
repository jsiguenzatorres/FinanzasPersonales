import Link from 'next/link';
import { Lock } from 'lucide-react';
import { updatePasswordAction } from '@/lib/auth/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { SubmitButton } from '@/components/submit-button';

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        title="Enlace vencido"
        subtitle="Este enlace de recuperación ya no es válido"
        footer={
          <p className="mt-6 text-center text-sm text-landing-ink-soft">
            <Link href="/forgot-password" className="text-landing-terracotta hover:underline">
              Solicita un enlace nuevo
            </Link>
          </p>
        }
      >
        <p className="text-sm text-landing-ink-soft">
          Los enlaces de recuperación expiran después de un tiempo o de usarse una vez.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crea una nueva contraseña" subtitle={user.email ?? ''} footer={null}>
      <form action={updatePasswordAction} className="space-y-4">
        <input type="hidden" name="redirect_to" value="/reset-password" />
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Nueva contraseña"
          icon={Lock}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <AuthField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirma la contraseña"
          icon={Lock}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repite la contraseña"
        />
        <SubmitButton className="w-full rounded-full bg-landing-terracotta text-landing-cream hover:bg-landing-terracotta-deep">
          Guardar contraseña
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
