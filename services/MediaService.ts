import { AzureStorageClient } from '@/lib/azure/storage';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const PPT_MIME = 'application/vnd.ms-powerpoint';

// Extension -> magic-byte mimes accepted for it, plus the content type stored on the blob.
const ALLOWED_TYPES: Record<string, { detected: string[]; storeAs?: string; maxMb: number }> = {
  jpg: { detected: ['image/jpeg'], maxMb: 20 },
  jpeg: { detected: ['image/jpeg'], maxMb: 20 },
  png: { detected: ['image/png'], maxMb: 20 },
  webp: { detected: ['image/webp'], maxMb: 20 },
  mp4: { detected: ['video/mp4'], maxMb: 100 },
  pdf: { detected: ['application/pdf'], maxMb: 50 },
  pptx: { detected: [PPTX_MIME, 'application/zip'], storeAs: PPTX_MIME, maxMb: 100 },
  ppt: { detected: ['application/x-cfb'], storeAs: PPT_MIME, maxMb: 100 },
};

/**
 * The Service layer is your app's "Business Logic".
 * It is completely independent of the Next.js API route request/response.
 * If you ever need to use this upload logic from a Cron job or a different 
 * entry point, you can just call MediaService without mocking HTTP requests.
 */
export class MediaService {
  public static async processAndUploadFile(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const rule = ALLOWED_TYPES[extension];
    if (!rule) {
      throw new Error('Invalid file type. Allowed: JPG, JPEG, PNG, WebP, MP4, PDF, PPT, PPTX.');
    }

    if (file.size > rule.maxMb * 1024 * 1024) {
      throw new Error(`File too large. Max ${rule.maxMb}MB.`);
    }

    // 1. Prepare data
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const data = await file.arrayBuffer();
    const detected = await fileTypeFromBuffer(data);
    if (!detected || !rule.detected.includes(detected.mime)) {
      throw new Error('The file contents do not match a supported image, MP4 video, PDF, or PowerPoint file.');
    }
    const mimeType = rule.storeAs ?? detected.mime;
    const blobName = `${randomUUID()}-${safeName}`;

    // 2. Delegate to Infrastructure Client (Azure or local disk fallback)
    const { url } = await AzureStorageClient.uploadBlob(
      Buffer.from(data),
      blobName,
      mimeType
    );

    // 3. Return normalized result
    return {
      url,
      blobName,
      size: file.size,
      mimeType,
    };
  }
}
