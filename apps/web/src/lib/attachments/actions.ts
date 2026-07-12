'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getPlanLimits } from '@flowfinance/shared/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_TYPES: Record<string, 'image' | 'audio' | 'document'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/mp4': 'audio',
  'audio/webm': 'audio',
  'audio/wav': 'audio',
  'audio/x-m4a': 'audio',
  'application/pdf': 'document',
};

export interface AttachmentRecord {
  id: string;
  storage_path: string;
  file_type: string;
  original_filename: string | null;
  caption: string | null;
}

export type UploadAttachmentResult =
  | { ok: true; attachment: AttachmentRecord }
  | { ok: false; error: string };

/** Invocada directamente (RPC-style) desde el cliente. Sirve para cualquier entidad. */
export async function uploadAttachmentAction(formData: FormData): Promise<UploadAttachmentResult> {
  const file = formData.get('file');
  const entityType = String(formData.get('entity_type') ?? '');
  const entityId = String(formData.get('entity_id') ?? '');
  const caption = formData.get('caption') ? String(formData.get('caption')) : null;

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No se recibió ningún archivo.' };
  }
  if (!entityType || !entityId) {
    return { ok: false, error: 'Falta especificar a qué registro pertenece el archivo.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'El archivo no puede superar 10MB.' };
  }

  const fileType = ALLOWED_TYPES[file.type];
  if (!fileType) {
    return { ok: false, error: 'Tipo de archivo no soportado. Usa imagen, audio o PDF.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'No autenticado.' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan, is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    const { attachments: quota } = getPlanLimits(profile?.plan).limits;
    const { data: existing } = await supabase
      .from('attachments')
      .select('file_size_bytes')
      .eq('user_id', user.id);

    const currentCount = existing?.length ?? 0;
    const currentBytes = (existing ?? []).reduce((sum, a) => sum + (a.file_size_bytes ?? 0), 0);

    if (currentCount >= quota.maxCount) {
      return {
        ok: false,
        error: `Alcanzaste el límite de ${quota.maxCount} archivos adjuntos de tu plan. Elimina alguno o mejora tu plan.`,
      };
    }
    if (currentBytes + file.size > quota.maxTotalBytes) {
      const quotaMb = Math.round(quota.maxTotalBytes / (1024 * 1024));
      return {
        ok: false,
        error: `Alcanzaste el límite de almacenamiento de tu plan (${quotaMb}MB). Elimina algún adjunto o mejora tu plan.`,
      };
    }
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${user.id}/${randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, arrayBuffer, { contentType: file.type });

  if (uploadError) {
    return { ok: false, error: 'No se pudo subir el archivo.' };
  }

  const { data: attachment, error: insertError } = await supabase
    .from('attachments')
    .insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      storage_path: path,
      file_type: fileType,
      mime_type: file.type,
      file_size_bytes: file.size,
      original_filename: file.name,
      caption,
    })
    .select('id, storage_path, file_type, original_filename, caption')
    .single();

  if (insertError || !attachment) {
    await supabase.storage.from('attachments').remove([path]);
    return { ok: false, error: 'No se pudo registrar el archivo.' };
  }

  revalidatePath('/app/gastos');
  revalidatePath('/app/ingresos');

  return { ok: true, attachment };
}

export async function deleteAttachmentAction(formData: FormData) {
  const attachmentId = formData.get('attachment_id');
  if (typeof attachmentId !== 'string') return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Filtro explícito por user_id además de RLS: defensa en profundidad.
  const { data: attachment } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .eq('user_id', user.id)
    .single();

  if (!attachment) return;

  await supabase.storage.from('attachments').remove([attachment.storage_path]);
  await supabase.from('attachments').delete().eq('id', attachmentId).eq('user_id', user.id);

  revalidatePath('/app/gastos');
  revalidatePath('/app/ingresos');
}

/**
 * Recibe el ID del adjunto (no la ruta cruda) para que la propiedad se
 * verifique vía una consulta filtrada por user_id antes de firmar la URL —
 * así un storage_path adivinado de otro usuario nunca llega a Storage.
 */
export async function getAttachmentUrlAction(attachmentId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: attachment } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .eq('user_id', user.id)
    .single();

  if (!attachment) return null;

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.storage_path, 60 * 10);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function listAttachments(
  entityType: string,
  entityId: string,
): Promise<AttachmentRecord[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('attachments')
    .select('id, storage_path, file_type, original_filename, caption')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return data ?? [];
}
