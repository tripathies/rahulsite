/**
 * Client-side PDF First Page Thumbnail Extractor
 * Uses PDF.js to render page 1 of an uploaded PDF file directly onto an HTML5 canvas,
 * exporting it as a high-quality JPEG blob to serve as the post's profile/cover image.
 */

export async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/document-assets/pdf.worker.min.mjs';
  return pdfjs;
}

export interface PdfThumbnailResult {
  imageBlob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  pageCount: number;
}

/**
 * Extracts the first page of a PDF File into a crisp JPEG Blob and dataURL.
 */
export async function extractPdfFirstPage(file: File): Promise<PdfThumbnailResult> {
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 50 * 1024 * 1024) {
    throw new Error('Choose a PDF no larger than 50MB.');
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer, cMapUrl: '/document-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/document-assets/standard_fonts/', isEvalSupported: false });

  try {
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const page = await pdf.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, 1600 / original.width, 1800 / original.height) });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Fill with white background before rendering
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const imageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas blob generation failed'));
        },
        'image/jpeg',
        0.92
      );
    });

    return {
      imageBlob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      pageCount,
    };
  } finally {
    await loadingTask.destroy();
  }
}
