-- ===========================================================================
-- FlowFinance — 31 · Sistema genérico de adjuntos (respaldo de operaciones)
-- ===========================================================================
-- Tabla polimórfica en vez de una columna *_url por tabla. Un mismo registro
-- (gasto, ingreso, préstamo familiar en Fase 2, etc.) puede tener MÚLTIPLES
-- archivos de cualquier tipo — fotos, capturas de WhatsApp, notas de voz, PDF.
--
-- Separado del bucket "receipts" (migración 30): ese sigue dedicado al flujo
-- de OCR de un solo recibo. Este es respaldo general sin procesamiento IA.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments', 'attachments', false, 10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/wav', 'audio/x-m4a',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

create policy "attachments_bucket_owner_select" on storage.objects
  for select using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_bucket_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Tabla de adjuntos ─────────────────────────────────────────────────────
create table public.attachments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,

  -- Asociación polimórfica: entity_type describe a qué tabla pertenece.
  -- Valores esperados (validados en la app, no aquí, para no requerir una
  -- migración cada vez que se agregue un nuevo tipo de entidad adjuntable):
  -- 'transaction' | 'income_entry' | 'family_loan' | 'family_loan_payment' |
  -- 'loan_portfolio' | 'loan_payment' | 'debt'
  entity_type         text not null,
  entity_id           uuid not null,

  storage_path        text not null,              -- attachments/<user_id>/<uuid>.<ext>
  file_type           text not null check (file_type in ('image', 'audio', 'document')),
  mime_type           text,
  file_size_bytes     integer,
  original_filename   text,
  caption             text,                        -- nota del usuario, ej. "WhatsApp con Juan confirmando el préstamo"

  created_at          timestamptz not null default now()
);

create index idx_attachments_entity on public.attachments(entity_type, entity_id);
create index idx_attachments_user on public.attachments(user_id, created_at desc);

alter table public.attachments enable row level security;

create policy "attachments_owner" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.attachments is
  'Adjuntos genéricos de respaldo (fotos, audio, PDF) para cualquier entidad del sistema. '
  'Polimórfica vía entity_type + entity_id — evita agregar una columna *_url por tabla. '
  'Bucket "attachments" separado de "receipts" (que es solo para el flujo de OCR).';
