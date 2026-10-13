import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Relee is_superadmin desde la DB en cada llamada (respeta RLS: un usuario
 * solo puede leer su propia fila) — nunca confiar en un valor de sesión/cliente.
 */
export async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('is_superadmin').eq('id', user.id).single();

  if (!profile?.is_superadmin) redirect('/app');

  return user;
}
