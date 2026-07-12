import { redirect } from 'next/navigation';
import { Button } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/auth/actions';
import { AppNav } from '@/components/app-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg">
            Flow<span className="text-ff-green">Finance</span>
          </span>
          <AppNav />
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
