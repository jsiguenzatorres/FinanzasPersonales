import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/app-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('users').select('is_superadmin').eq('id', user.id).single();

  return (
    <div className="flex min-h-screen">
      <AppNav isSuperadmin={profile?.is_superadmin ?? false} />
      <main className="min-w-0 flex-1 p-6 pb-24 lg:pb-6">{children}</main>
    </div>
  );
}
