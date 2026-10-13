-- ===========================================================================
-- FlowFinance — Portal de consulta para deudores (solo lectura)
-- ===========================================================================
-- Las personas a las que un usuario le prestó dinero (family_loans /
-- loan_portfolio) no tienen cuenta en FlowFinance — solo existen como texto
-- libre (person_name/person_email, borrower_name/borrower_email). Se les da
-- acceso de solo lectura a SU propio estado de cuenta vía magic link de
-- Supabase Auth, sin crear una cuenta "real" de la app para ellos:
--
--   1. handle_new_user() se ajusta para NO crear fila en public.users ni
--      public.user_settings cuando el signup trae
--      raw_user_meta_data->>'portal_guest' = 'true' (así no se mezclan con
--      los usuarios reales de FlowFinance — ni aparecen en el panel admin,
--      ni cuentan para nada de negocio).
--   2. Políticas RLS de SELECT nuevas en family_loans, family_loan_payments,
--      loan_portfolio y loan_payments, basadas en auth.jwt()->>'email' —
--      mismo patrón ya usado para que un invitado vea su propia invitación
--      a un espacio colaborativo (20261012010000_collab_invite_flow.sql).
--   3. Una policy en public.users para que el deudor pueda ver el nombre de
--      quien le prestó (si no, el portal no podría mostrar "Préstamo con
--      Juan Pérez").
--
-- Todo esto es SOLO LECTURA — no se agrega ninguna policy de insert/update/
-- delete para estas sesiones, las políticas de dueño (auth.uid() = user_id)
-- siguen siendo las únicas que permiten escribir.
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'portal_guest', 'false') = 'true' then
    return new;
  end if;

  insert into public.users (id, email, display_name, currency_default, country, language, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'USD',
    'SV',
    'es-SV',
    'America/El_Salvador'
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create policy "family_loans_debtor_select" on public.family_loans
  for select using (person_email = (auth.jwt() ->> 'email'));

create policy "family_loan_payments_debtor_select" on public.family_loan_payments
  for select using (
    exists (
      select 1 from public.family_loans fl
       where fl.id = loan_id
         and fl.person_email = (auth.jwt() ->> 'email')
    )
  );

create policy "loan_portfolio_debtor_select" on public.loan_portfolio
  for select using (borrower_email = (auth.jwt() ->> 'email'));

create policy "loan_payments_debtor_select" on public.loan_payments
  for select using (
    exists (
      select 1 from public.loan_portfolio lp
       where lp.id = loan_id
         and lp.borrower_email = (auth.jwt() ->> 'email')
    )
  );

create policy "users_select_by_debtor" on public.users
  for select using (
    exists (
      select 1 from public.family_loans fl
       where fl.user_id = users.id
         and fl.person_email = (auth.jwt() ->> 'email')
      union
      select 1 from public.loan_portfolio lp
       where lp.user_id = users.id
         and lp.borrower_email = (auth.jwt() ->> 'email')
    )
  );
