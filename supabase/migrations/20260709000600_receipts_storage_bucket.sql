-- ===========================================================================
-- FlowFinance — 30 · Bucket de Storage para recibos (MOD-04 §6, OCR)
-- ===========================================================================
-- Crea: bucket privado "receipts" + RLS por carpeta de usuario.
-- Convención de path: receipts/<user_id>/<uuid>.jpg
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "receipts_owner_select" on storage.objects
  for select using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipts_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Nota: no se puede hacer `comment on policy ... on storage.objects` — el rol
-- de migraciones no es owner de esa tabla (la administra Supabase). La regla
-- ya queda documentada aquí arriba en el comentario SQL normal.
