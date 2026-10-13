-- ===========================================================================
-- FlowFinance — Flujo de invitación a espacios colaborativos
-- ===========================================================================
-- collab_spaces/collab_members ya existían (20260630120500_collab.sql) pero
-- sin forma de que el invitado VIERA ni ACEPTARA su propia invitación:
--
--   - cm_select_visible solo deja ver filas si ya eres miembro activo del
--     espacio (is_collab_member) o si user_id = auth.uid() — pero una
--     invitación pendiente tiene user_id NULL (solo invited_email), así que
--     el invitado no podía ni consultar su propia invitación.
--   - cm_owner_modify solo deja modificar filas al OWNER del espacio — el
--     invitado no podía hacer UPDATE sobre su propia fila para aceptarla.
--
-- Se agrega una policy de SELECT por correo (vía auth.jwt()) y tres
-- funciones security definer que exponen únicamente las transiciones
-- seguras (aceptar/rechazar invitación, salir del espacio) sin abrir un
-- UPDATE/DELETE genérico que un usuario pudiera usar para tocar columnas
-- como role o space_id.
--
-- También faltaba poder VER a los demás miembros: users_select_self solo
-- deja leer tu propia fila de public.users, así que no se podía mostrar el
-- nombre de un compañero de espacio. Se agrega una policy acotada a pares
-- que comparten un espacio activo (nunca usuarios sin relación).
-- ===========================================================================

create policy "cm_select_own_invite" on public.collab_members
  for select using (invited_email = (auth.jwt() ->> 'email'));

-- El invitado necesita ver el nombre/tipo del espacio antes de aceptar,
-- aunque todavía no sea miembro activo (cs_member_select no lo cubre).
create policy "cs_select_invited" on public.collab_spaces
  for select using (
    exists (
      select 1 from public.collab_members cm
       where cm.space_id = id
         and cm.invited_email = (auth.jwt() ->> 'email')
         and cm.status = 'invited'
    )
  );

create or replace function public.accept_collab_invite(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collab_members
     set user_id = auth.uid(), status = 'active', joined_at = now()
   where id = p_member_id
     and status = 'invited'
     and invited_email = (auth.jwt() ->> 'email');

  if not found then
    raise exception 'Invitación no encontrada o ya no es válida.';
  end if;
end;
$$;

create or replace function public.decline_collab_invite(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.collab_members
   where id = p_member_id
     and status = 'invited'
     and invited_email = (auth.jwt() ->> 'email');

  if not found then
    raise exception 'Invitación no encontrada o ya no es válida.';
  end if;
end;
$$;

create or replace function public.leave_collab_space(p_space_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collab_members
     set status = 'left'
   where space_id = p_space_id
     and user_id = auth.uid()
     and status = 'active';

  if not found then
    raise exception 'No eres miembro activo de este espacio.';
  end if;
end;
$$;

grant execute on function public.accept_collab_invite(uuid) to authenticated;
grant execute on function public.decline_collab_invite(uuid) to authenticated;
grant execute on function public.leave_collab_space(uuid) to authenticated;

create policy "users_select_collab_peers" on public.users
  for select using (
    exists (
      select 1
        from public.collab_members me
        join public.collab_members peer on peer.space_id = me.space_id
       where me.user_id = auth.uid()
         and me.status = 'active'
         and peer.user_id = users.id
         and peer.status = 'active'
    )
  );
