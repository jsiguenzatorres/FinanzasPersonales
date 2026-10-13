import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface MySpace {
  id: string;
  name: string;
}

/** Espacios donde el usuario es miembro ACTIVO (dueño o aceptado) — nunca invitaciones pendientes. */
export async function getMySpaces(): Promise<MySpace[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from('collab_members')
    .select('space_id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const spaceIds = (memberships ?? []).map((m) => m.space_id);
  if (spaceIds.length === 0) return [];

  const { data: spaces } = await supabase.from('collab_spaces').select('id, name').in('id', spaceIds).order('name');
  return spaces ?? [];
}
