import { notFound } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { Users, Mail, Crown } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { inviteMemberAction, removeMemberAction, leaveSpaceAction } from '@/lib/collab/actions';
import { SubmitButton } from '@/components/submit-button';

const KIND_LABELS: Record<string, string> = {
  couple: 'Pareja',
  family: 'Familia',
  roommates: 'Compañeros de cuarto',
  business: 'Negocio',
  other: 'Otro',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
  viewer: 'Solo lectura',
};

export default async function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: space }, { data: members }] = await Promise.all([
    supabase.from('collab_spaces').select('id, name, kind').eq('id', id).maybeSingle(),
    supabase
      .from('collab_members')
      .select('id, user_id, invited_email, role, status')
      .eq('space_id', id)
      .order('invited_at', { ascending: true }),
  ]);

  if (!space) notFound();

  const activeUserIds = (members ?? []).filter((m) => m.user_id).map((m) => m.user_id as string);
  const { data: memberProfiles } =
    activeUserIds.length > 0
      ? await supabase.from('users').select('id, display_name, email').in('id', activeUserIds)
      : { data: [] };
  const profileMap = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

  const myMembership = (members ?? []).find((m) => m.user_id === user?.id);
  const isOwner = myMembership?.role === 'owner';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-ff-purple/10">
          <Users className="h-5 w-5 text-ff-purple" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-2xl">{space.name}</h1>
          <p className="text-sm text-muted-foreground">{KIND_LABELS[space.kind] ?? space.kind}</p>
        </div>
      </div>

      <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
        {(members ?? []).map((m, i) => {
          const profile = m.user_id ? profileMap.get(m.user_id) : null;
          const label = profile?.display_name ?? m.invited_email ?? 'Miembro';
          const isPending = m.status === 'invited';
          return (
            <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ff-blue/10">
                {m.role === 'owner' ? (
                  <Crown className="h-4 w-4 text-ff-yellow" aria-hidden="true" />
                ) : (
                  <Mail className="h-4 w-4 text-ff-blue" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[m.role] ?? m.role}
                  {isPending && ' · invitación pendiente'}
                </p>
              </div>
              {isOwner && m.role !== 'owner' && (
                <form action={removeMemberAction}>
                  <input type="hidden" name="memberId" value={m.id} />
                  <input type="hidden" name="spaceId" value={space.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-ff-red">
                    Quitar
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base">Invitar a alguien</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteMemberAction} className="flex gap-2">
              <input type="hidden" name="spaceId" value={space.id} />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="email" className="sr-only">
                  Correo
                </Label>
                <Input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" />
              </div>
              <SubmitButton>Invitar</SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}

      {!isOwner && myMembership && (
        <form action={leaveSpaceAction}>
          <input type="hidden" name="spaceId" value={space.id} />
          <SubmitButton variant="outline" className="w-full text-ff-red">
            Salir del espacio
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
