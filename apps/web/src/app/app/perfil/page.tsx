import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Input } from '@flowfinance/ui';
import { User, Lock } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updatePasswordAction } from '@/lib/auth/actions';
import { SubmitButton } from '@/components/submit-button';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  plus: 'Plus',
  pro: 'Pro',
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, plan')
    .eq('id', user!.id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Perfil</h1>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-blue/10">
            <User className="h-5 w-5 text-ff-blue" aria-hidden="true" />
          </div>
          <CardTitle className="text-base">Tu cuenta</CardTitle>
          <CardDescription>
            {profile?.display_name} · {profile?.email} · Plan {PLAN_LABELS[profile?.plan ?? 'free']}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-yellow/10">
            <Lock className="h-5 w-5 text-ff-yellow" aria-hidden="true" />
          </div>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
          <CardDescription>Elige una nueva contraseña para tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePasswordAction} className="space-y-4">
            <input type="hidden" name="redirect_to" value="/app/perfil" />
            <div className="space-y-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirma la contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
              />
            </div>
            <SubmitButton>Guardar contraseña</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
