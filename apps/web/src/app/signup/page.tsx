import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { signUpAction } from '@/lib/auth/actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">
            Flow<span className="text-ff-green">Finance</span>
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
            <CardDescription>Empieza a tomar control de tu dinero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
                {error}
              </p>
            )}

            <form action={signUpAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Nombre</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
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
              <Button type="submit" className="w-full">
                Crear cuenta
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-ff-green hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
