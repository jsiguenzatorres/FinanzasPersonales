'use server';

import { redirect } from 'next/navigation';
import { createSpaceSchema, inviteMemberSchema } from '@flowfinance/shared/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function translateCollabError(message: string): string {
  if (message.includes('collab_members_space_id_invited_email_key')) {
    return 'Ya invitaste a esa persona a este espacio.';
  }
  return message;
}

export async function createSpaceAction(formData: FormData) {
  const parsed = createSpaceSchema.safeParse({
    name: formData.get('name'),
    kind: formData.get('kind'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect('/app/espacios/nuevo?error=' + encodeURIComponent(message));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: space, error } = await supabase
    .from('collab_spaces')
    .insert({ owner_id: user.id, name: parsed.data.name, kind: parsed.data.kind })
    .select('id')
    .single();

  if (error || !space) {
    redirect('/app/espacios/nuevo?error=' + encodeURIComponent('No se pudo crear el espacio.'));
  }

  await supabase
    .from('collab_members')
    .insert({ space_id: space.id, user_id: user.id, role: 'owner', status: 'active', joined_at: new Date().toISOString() });

  redirect(`/app/espacios/${space.id}?message=${encodeURIComponent('Espacio creado.')}`);
}

export async function inviteMemberAction(formData: FormData) {
  const spaceId = formData.get('spaceId')?.toString() ?? '';

  const parsed = inviteMemberSchema.safeParse({
    spaceId,
    email: formData.get('email'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
    redirect(`/app/espacios/${spaceId}?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('collab_members')
    .insert({ space_id: parsed.data.spaceId, invited_email: parsed.data.email, role: 'member', status: 'invited' });

  if (error) {
    redirect(`/app/espacios/${parsed.data.spaceId}?error=${encodeURIComponent(translateCollabError(error.message))}`);
  }

  redirect(`/app/espacios/${parsed.data.spaceId}?message=${encodeURIComponent('Invitación enviada.')}`);
}

export async function acceptInviteAction(formData: FormData) {
  const memberId = formData.get('memberId')?.toString();
  if (!memberId) redirect('/app/espacios');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('accept_collab_invite', { p_member_id: memberId });

  if (error) {
    redirect('/app/espacios?error=' + encodeURIComponent(error.message));
  }

  redirect('/app/espacios?message=' + encodeURIComponent('Te uniste al espacio.'));
}

export async function declineInviteAction(formData: FormData) {
  const memberId = formData.get('memberId')?.toString();
  if (!memberId) redirect('/app/espacios');

  const supabase = await createSupabaseServerClient();
  await supabase.rpc('decline_collab_invite', { p_member_id: memberId });

  redirect('/app/espacios?message=' + encodeURIComponent('Invitación rechazada.'));
}

export async function removeMemberAction(formData: FormData) {
  const memberId = formData.get('memberId')?.toString();
  const spaceId = formData.get('spaceId')?.toString() ?? '';
  if (!memberId) redirect(`/app/espacios/${spaceId}`);

  const supabase = await createSupabaseServerClient();
  await supabase.from('collab_members').delete().eq('id', memberId);

  redirect(`/app/espacios/${spaceId}?message=${encodeURIComponent('Miembro eliminado.')}`);
}

export async function leaveSpaceAction(formData: FormData) {
  const spaceId = formData.get('spaceId')?.toString();
  if (!spaceId) redirect('/app/espacios');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('leave_collab_space', { p_space_id: spaceId });

  if (error) {
    redirect(`/app/espacios/${spaceId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/app/espacios?message=' + encodeURIComponent('Saliste del espacio.'));
}
