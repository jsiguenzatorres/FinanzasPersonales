'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@flowfinance/ui';
import {
  deleteAttachmentAction,
  getAttachmentUrlAction,
  uploadAttachmentAction,
  type AttachmentRecord,
} from '@/lib/attachments/actions';
import { compressImageFile } from '@/lib/attachments/compress-image';

const FILE_TYPE_ICON: Record<string, string> = {
  image: '🖼️',
  audio: '🎙️',
  document: '📄',
};

/**
 * Sección de adjuntos reutilizable para cualquier entidad (gasto, ingreso,
 * y en Fase 2 préstamos familiares). Solo requiere entity_type + entity_id.
 */
export function AttachmentsSection({
  entityType,
  entityId,
  initialAttachments,
}: {
  entityType: string;
  entityId: string;
  initialAttachments: AttachmentRecord[];
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isUploading, startUploading] = useTransition();
  const [pendingViewId, setPendingViewId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    startUploading(async () => {
      const compressed = await compressImageFile(file);
      const fd = new FormData();
      fd.append('file', compressed);
      fd.append('entity_type', entityType);
      fd.append('entity_id', entityId);

      const result = await uploadAttachmentAction(fd);
      if (result.ok) {
        setAttachments((prev) => [...prev, result.attachment]);
      } else {
        setUploadError(result.error);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  }

  async function handleView(attachment: AttachmentRecord) {
    setPendingViewId(attachment.id);
    const url = await getAttachmentUrlAction(attachment.id);
    setPendingViewId(null);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    const fd = new FormData();
    fd.append('attachment_id', id);
    await deleteAttachmentAction(fd);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Archivos de respaldo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Subiendo...' : '+ Adjuntar'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Fotos, capturas de WhatsApp o notas de voz que respalden esta operación.
      </p>

      {uploadError && <p className="text-xs text-ff-red">{uploadError}</p>}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <button
                type="button"
                onClick={() => handleView(a)}
                disabled={pendingViewId === a.id}
                className="flex-1 truncate text-left hover:underline"
              >
                {FILE_TYPE_ICON[a.file_type] ?? '📎'}{' '}
                {pendingViewId === a.id ? 'Abriendo...' : (a.original_filename ?? 'Archivo')}
              </button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
