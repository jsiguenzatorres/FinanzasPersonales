import Link from 'next/link';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { Users, Mail } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { acceptInviteAction, declineInviteAction } from '@/lib/collab/actions';
import { SubmitButton } from '@/components/submit-button';

const KIND_LABELS: Record<string, string> = {
  couple: 'Pareja',
  family: 'Familia',
  roommates: 'Compañeros de cuarto',
  business: 'Negocio',
  other: 'Otro',
};

export default async function SpacesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: spaces }, { data: pendingInvites }] = await Promise.all([
    supabase.from('collab_spaces').select('id, name, kind').order('created_at', { ascending: false }),
    supabase
      .from('collab_members')
      .select('id, space_id')
      .eq('status', 'invited')
      .order('invited_at', { ascending: false }),
  ]);

  const inviteSpaceIds = [...new Set((pendingInvites ?? []).map((i) => i.space_id))];
  const { data: inviteSpaces } =
    inviteSpaceIds.length > 0
      ? await supabase.from('collab_spaces').select('id, name, kind').in('id', inviteSpaceIds)
      : { data: [] };
  const inviteSpaceMap = new Map((inviteSpaces ?? []).map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Espacios compartidos</h1>
        <Button asChild>
          <Link href="/app/espacios/nuevo">+ Crear espacio</Link>
        </Button>
      </div>

      {(pendingInvites ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Invitaciones pendientes</p>
          {(pendingInvites ?? []).map((invite) => {
            const space = inviteSpaceMap.get(invite.space_id);
            if (!space) return null;
            return (
              <Card key={invite.id} className="animate-fade-in-up">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ff-blue/10">
                      <Mail className="h-4 w-4 text-ff-blue" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{space.name}</p>
                      <p className="text-xs text-muted-foreground">{KIND_LABELS[space.kind] ?? space.kind}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={declineInviteAction}>
                      <input type="hidden" name="memberId" value={invite.id} />
                      <SubmitButton variant="ghost" size="sm">
                        Rechazar
                      </SubmitButton>
                    </form>
                    <form action={acceptInviteAction}>
                      <input type="hidden" name="memberId" value={invite.id} />
                      <SubmitButton size="sm">Aceptar</SubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(spaces ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ff-blue/10 animate-empty-breathe">
              <Users className="h-6 w-6 text-ff-blue" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">Aún no tienes espacios compartidos.</p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/app/espacios/nuevo">+ Crear espacio</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {(spaces ?? []).map((space, i) => (
            <Link
              key={space.id}
              href={`/app/espacios/${space.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ff-purple/10">
                <Users className="h-4 w-4 text-ff-purple" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{space.name}</p>
                <p className="text-xs text-muted-foreground">{KIND_LABELS[space.kind] ?? space.kind}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
