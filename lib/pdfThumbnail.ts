/**
 * Client-side PDF First Page Thumbnail Extractor
 * Uses PDF.js to render page 1 of an uploaded PDF file directly onto an HTML5 canvas,
 * exporting it as a high-quality JPEG blob to serve as the post's profile/cover image.
 */

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (params: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getViewport: (params: { scale: number }) => { width: number; height: number };
            render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
              promise: Promise<void>;
            };
          }>;
        }>;
      };
    };
  }
}

let pdfJsPromise: Promise<NonNullable<Window['pdfjsLib']>> | null = null;

export async function loadPdfJs(): Promise<NonNullable<Window['pdfjsLib']>> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be loaded in a browser environment');
  }

  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  if (pdfJsPromise) {
    return pdfJsPromise;
  }

  pdfJsPromise = new Promise((resolve, reject) => {
    // Check if script already exists in document
    const existing = document.querySelector('script[data-pdfjs="true"]');
    if (existing) {
      const check = setInterval(() => {
        if (window.pdfjsLib) {
          clearInterval(check);
          resolve(window.pdfjsLib);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.setAttribute('data-pdfjs', 'true');
    script.async = true;

    script.onload = () => {
      const lib = window.pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('PDF.js script loaded but pdfjsLib is undefined'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load PDF.js from CDN'));
    };

    document.head.appendChild(script);
  });

  return pdfJsPromise;
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
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const page = await pdf.getPage(1);
    // 1.5x scale gives a high-DPI rendering that looks great on retina displays
    const viewport = page.getViewport({ scale: 1.5 });

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
  } catch (err) {
    console.warn('PDF.js rendering fallback triggered:', err);
    return createFallbackPdfCover(file.name);
  }
}

/**
 * Generates an elegant fallback cover image in case PDF.js cannot be loaded (e.g. offline)
 */
function createFallbackPdfCover(fileName: string): Promise<PdfThumbnailResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const emptyBlob = new Blob([], { type: 'image/jpeg' });
      resolve({ imageBlob: emptyBlob, dataUrl: '', width: 1200, height: 1600, pageCount: 1 });
      return;
    }

    // Elegant dark background with gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 1600);
    grad.addColorStop(0, '#0E172A');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Document border
    ctx.strokeStyle = '#6958FF';
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 60, 1080, 1480);

    // Decorative header
    ctx.fillStyle = '#6958FF';
    ctx.fillRect(100, 140, 200, 16);

    // PDF Icon badge
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(100, 240, 120, 120, 20);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF', 160, 316);

    // Title text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'left';
    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    ctx.fillText(cleanName.slice(0, 35), 100, 480);

    // Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '32px sans-serif';
    ctx.fillText('Interactive Publication Document', 100, 550);

    // Simulated text lines
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    for (let y = 680; y < 1400; y += 60) {
      const w = 1000 * (0.6 + (Math.sin(y) + 1) * 0.18);
      ctx.fillRect(100, y, w, 20);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob(
      (blob) => {
        resolve({
          imageBlob: blob || new Blob([], { type: 'image/jpeg' }),
          dataUrl,
          width: 1200,
          height: 1600,
          pageCount: 1,
        });
      },
      'image/jpeg',
      0.9
    );
  });
}
