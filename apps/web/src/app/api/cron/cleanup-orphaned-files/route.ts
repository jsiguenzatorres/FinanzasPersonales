import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

/** Margen de gracia: no borrar nada subido hace menos de esto (flujo en curso). */
const GRACE_MS = 24 * 60 * 60 * 1000;

interface BucketCleanupResult {
  bucket: string;
  scanned: number;
  deleted: number;
  deletedPaths: string[];
}

/**
 * Recorre un bucket (estructura <user_id>/<archivo>) y borra los objetos que
 * no aparecen en `referencedPaths` y son más viejos que el margen de gracia.
 * Usa la Storage API (no SQL directo sobre storage.objects) para garantizar
 * que se borra tanto el archivo real como su metadata.
 */
async function cleanupBucket(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  bucket: string,
  referencedPaths: Set<string>,
): Promise<BucketCleanupResult> {
  const result: BucketCleanupResult = { bucket, scanned: 0, deleted: 0, deletedPaths: [] };
  const cutoff = Date.now() - GRACE_MS;

  const { data: folders, error: foldersError } = await admin.storage.from(bucket).list();
  if (foldersError || !folders) return result;

  for (const folder of folders) {
    if (!folder.name) continue;

    const { data: files, error: filesError } = await admin.storage.from(bucket).list(folder.name);
    if (filesError || !files) continue;

    const orphanPaths: string[] = [];
    for (const file of files) {
      result.scanned += 1;
      const path = `${folder.name}/${file.name}`;
      const createdAt = file.created_at ? new Date(file.created_at).getTime() : 0;

      if (!referencedPaths.has(path) && createdAt < cutoff) {
        orphanPaths.push(path);
      }
    }

    if (orphanPaths.length > 0) {
      const { error: removeError } = await admin.storage.from(bucket).remove(orphanPaths);
      if (!removeError) {
        result.deleted += orphanPaths.length;
        result.deletedPaths.push(...orphanPaths);
      }
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const [{ data: receiptRows }, { data: attachmentRows }] = await Promise.all([
    admin.from('transactions').select('receipt_url').not('receipt_url', 'is', null),
    admin.from('attachments').select('storage_path'),
  ]);

  const referencedReceipts = new Set(
    (receiptRows ?? []).map((r) => r.receipt_url).filter((v): v is string => !!v),
  );
  const referencedAttachments = new Set((attachmentRows ?? []).map((a) => a.storage_path));

  const [receiptsResult, attachmentsResult] = await Promise.all([
    cleanupBucket(admin, 'receipts', referencedReceipts),
    cleanupBucket(admin, 'attachments', referencedAttachments),
  ]);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results: [receiptsResult, attachmentsResult],
  });
}
