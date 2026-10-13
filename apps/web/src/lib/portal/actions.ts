'use server';

import { redirect } from 'next/navigation';
import { portalAccessRequestSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requestPortalAccessAction(formData: FormData) {
  const parsed = portalAccessRequestSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    redirect('/portal?error=' + encodeURIComponent('Ingresa un correo válido.'));
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      data: { portal_guest: true },
      emailRedirectTo: `${appUrl}/auth/callback?next=/portal/dashboard`,
    },
  });

  if (error) {
    redirect('/portal?error=' + encodeURIComponent('No pudimos enviar el enlace. Intenta de nuevo.'));
  }

  redirect(
    '/portal?message=' +
      encodeURIComponent('Te enviamos un enlace de acceso — revisa tu correo (y la carpeta de spam).'),
  );
}

export async function portalSignOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/portal');
}
