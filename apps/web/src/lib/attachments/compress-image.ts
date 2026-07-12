const MAX_DIMENSION = 2000; // px en el lado más largo — de sobra para OCR y revisión visual
const JPEG_QUALITY = 0.82; // visualmente indistinguible del original en fotos
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024; // no vale la pena recomprimir algo ya pequeño

/**
 * Redimensiona/recomprime una foto antes de subirla, porque las cámaras de
 * celular capturan a resoluciones (12-48MP) muy por encima de lo que se
 * necesita para leer un recibo o revisar un comprobante.
 *
 * Solo actúa sobre JPEG/WebP (se re-encodan con pérdida controlada) y PNG
 * (se re-dimensiona sin pérdida, para no degradar texto de capturas de
 * pantalla). HEIC y cualquier otro tipo se devuelven sin tocar: el canvas no
 * puede decodificar HEIC de forma confiable fuera de Safari.
 */
export async function compressImageFile(file: File): Promise<File> {
  const isJpegLike = file.type === 'image/jpeg' || file.type === 'image/webp';
  const isPng = file.type === 'image/png';
  if (!isJpegLike && !isPng) return file;

  if (file.size < SKIP_BELOW_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetW = Math.round(bitmap.width * scale);
    const targetH = Math.round(bitmap.height * scale);

    if (scale >= 1) {
      // Ya está dentro del límite de dimensión — solo re-encode con calidad reducida si es JPEG/WebP.
      if (isPng) {
        bitmap.close();
        return file;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const outputType = isPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, isPng ? undefined : JPEG_QUALITY),
    );

    if (!blob || blob.size >= file.size) return file;

    const ext = isPng ? 'png' : 'jpg';
    const newName = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
    return new File([blob], newName, { type: outputType });
  } catch {
    return file;
  }
}
