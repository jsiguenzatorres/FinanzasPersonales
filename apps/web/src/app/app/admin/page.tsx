import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { ShieldCheck } from 'lucide-react';
import { requireSuperadmin } from '@/lib/admin/guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  plus: 'Plus',
  pro: 'Pro',
};

export default async function AdminUsersPage() {
  await requireSuperadmin();

  const admin = createSupabaseAdminClient();
  const { data: users } = await admin
    .from('users')
    .select('id, display_name, email, plan, is_superadmin, created_at')
    .order('created_at', { ascending: false });

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-SV', { dateStyle: 'medium' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Administración de usuarios</h1>
        <Button asChild>
          <Link href="/app/admin/nuevo">+ Crear usuario</Link>
        </Button>
      </div>

      {(users ?? []).length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No hay usuarios registrados.</p>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {(users ?? []).map((u, i) => (
            <div key={u.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ff-blue/10 text-sm">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {u.display_name}
                    {u.is_superadmin && (
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ff-yellow" aria-label="Superadmin" />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">{PLAN_LABELS[u.plan] ?? u.plan}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground">
          Las cuentas creadas aquí quedan con el correo confirmado automáticamente — no reciben el
          correo de bienvenida de registro público.
        </CardContent>
      </Card>
    </div>
  );
}

