'use server';

import { redirect } from 'next/navigation';
import { adminCreateUserSchema } from '@flowfinance/shared/schemas';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireSuperadmin } from './guard';

function translateAdminError(message: string): string {
  const known: Record<string, string> = {
    'A user with this email address has already been registered': 'Ya existe una cuenta con ese correo.',
  };
  return known[message] ?? message;
}

export async function createUserAction(formData: FormData) {
  await requireSuperadmin();

  const parsed = adminCreateUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
    isSuperadmin: formData.get('isSuperadmin') === 'on',
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/admin/nuevo?error=' + encodeURIComponent(message));
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.displayName },
  });

  if (error || !data.user) {
    redirect(
      '/app/admin/nuevo?error=' +
        encodeURIComponent(translateAdminError(error?.message ?? 'No se pudo crear el usuario.')),
    );
  }

  if (parsed.data.isSuperadmin) {
    await admin.from('users').update({ is_superadmin: true }).eq('id', data.user.id);
  }

  redirect('/app/admin?message=' + encodeURIComponent(`Cuenta creada para ${parsed.data.email}.`));
}
