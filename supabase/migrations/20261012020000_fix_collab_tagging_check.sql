-- ===========================================================================
-- FlowFinance — Cierra inyección de datos en espacios ajenos
-- ===========================================================================
-- Se descubrió al conectar el selector de "compartir con espacio" en los
-- formularios de gastos, metas, viajes y presupuesto:
--
--   with check (auth.uid() = user_id or (collab_space_id is not null and
--     is_collab_member(collab_space_id)))
--
-- El primer término (auth.uid() = user_id) por sí solo ya satisface el OR,
-- sin importar el valor de collab_space_id. Como quien crea el registro
-- siempre es auth.uid() = user_id, cualquier usuario podía insertar un
-- gasto/meta/viaje/presupuesto con un collab_space_id ajeno (uno al que no
-- pertenece) y ese registro quedaría visible para los miembros reales de
-- ese espacio — inyección de datos en un espacio del que nunca fue invitado.
--
-- tx_owner_modify (transactions) tenía el mismo problema de otra forma: su
-- check ni siquiera miraba collab_space_id, así que el dueño de la
-- transacción podía etiquetarla con cualquier espacio sin pertenecer a él.
--
-- El fix solo toca WITH CHECK (qué se puede escribir) — USING (qué se puede
-- leer/borrar) no cambia, para no alterar quién ve qué.
-- ===========================================================================

drop policy "trips_owner_or_collab" on public.trips;
create policy "trips_owner_or_collab" on public.trips
  for all
  using (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)))
  with check (
    (collab_space_id is null and auth.uid() = user_id)
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

drop policy "goals_owner_or_collab" on public.goals;
create policy "goals_owner_or_collab" on public.goals
  for all
  using (auth.uid() = user_id or (collab_space_id is not null and public.is_collab_member(collab_space_id)))
  with check (
    (collab_space_id is null and auth.uid() = user_id)
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

drop policy "budgets_owner_or_collab" on public.budgets;
create policy "budgets_owner_or_collab" on public.budgets
  for all
  using (
    auth.uid() = user_id
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  )
  with check (
    (collab_space_id is null and auth.uid() = user_id)
    or (collab_space_id is not null and public.is_collab_member(collab_space_id))
  );

drop policy "tx_owner_modify" on public.transactions;
create policy "tx_owner_modify" on public.transactions
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (collab_space_id is null or public.is_collab_member(collab_space_id))
  );
