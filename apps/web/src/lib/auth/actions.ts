'use server';

import { redirect } from 'next/navigation';
import { loginSchema, signupSchema, forgotPasswordSchema, updatePasswordSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function translateAuthError(message: string): string {
  const known: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta con ese correo.',
    'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
    'New password should be different from the old password.': 'Elige una contraseña distinta a la actual.',
    'Auth session missing!': 'El enlace venció o ya se usó. Solicita uno nuevo.',
  };
  return known[message] ?? message;
}

export async function signInAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect('/login?error=' + encodeURIComponent('Revisa tu correo y contraseña.'));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect('/login?error=' + encodeURIComponent(translateAuthError(error.message)));
  }

  redirect('/app');
}

export async function signUpAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/signup?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(translateAuthError(error.message)));
  }

  redirect('/login?message=' + encodeURIComponent('Revisa tu correo para confirmar tu cuenta.'));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    redirect('/forgot-password?error=' + encodeURIComponent('Ingresa un correo válido.'));
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  // Mismo mensaje exista o no la cuenta — evita revelar qué correos están registrados.
  redirect(
    '/forgot-password?message=' +
      encodeURIComponent('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.'),
  );
}

export async function updatePasswordAction(formData: FormData) {
  const redirectPath = formData.get('redirect_to')?.toString() || '/reset-password';

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    redirect(`${redirectPath}?error=${encodeURIComponent(translateAuthError(error.message))}`);
  }

  const successPath = redirectPath === '/app/perfil' ? '/app/perfil' : '/app';
  redirect(`${successPath}?message=${encodeURIComponent('Contraseña actualizada.')}`);
}
