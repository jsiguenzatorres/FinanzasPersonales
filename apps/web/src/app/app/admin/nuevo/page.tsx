import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { UserPlus } from 'lucide-react';
import { requireSuperadmin } from '@/lib/admin/guard';
import { createUserAction } from '@/lib/admin/actions';
import { SubmitButton } from '@/components/submit-button';

export default async function NewAdminUserPage() {
  await requireSuperadmin();

  return (
    <div className="mx-auto max-w-md">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-blue/10">
            <UserPlus className="h-5 w-5 text-ff-blue" aria-hidden="true" />
          </div>
          <CardTitle>Crear usuario</CardTitle>
          <CardDescription>
            La cuenta queda con el correo confirmado — la persona puede iniciar sesión de inmediato con
            la contraseña que le asignes aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nombre</Label>
              <Input id="displayName" name="displayName" required placeholder="Nombre de la persona" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña inicial</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
              <p className="text-xs text-muted-foreground">
                La persona puede cambiarla luego desde su perfil, o recuperarla con &quot;olvidé mi
                contraseña&quot; si usas su correo real.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="isSuperadmin"
                className="h-4 w-4 rounded border-border"
              />
              Hacer superadmin (acceso a este panel)
            </label>
            <SubmitButton className="w-full">Crear cuenta</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
