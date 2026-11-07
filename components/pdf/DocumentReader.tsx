'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { loadPdfJs } from '@/lib/pdfThumbnail';
import styles from './DocumentReader.module.css';

function DocumentPage({ pdf, number, title }: { pdf: PDFDocumentProxy; number: number; title: string }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const textContainer = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(number === 1);
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(0.707);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(element);
    const resize = new ResizeObserver(entries => setWidth(Math.round(entries[0].contentRect.width)));
    resize.observe(element);
    return () => { observer.disconnect(); resize.disconnect(); };
  }, []);

  useEffect(() => {
    if (!visible || !width) return;
    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy['render']> | undefined;
    let textLayer: InstanceType<typeof import('pdfjs-dist')['TextLayer']> | undefined;
    async function render() {
      try {
        const page = await pdf.getPage(number);
        if (cancelled || !canvas.current || !textContainer.current) return;
        setError(false);
        setReady(false);
        const original = page.getViewport({ scale: 1 });
        setRatio(original.width / original.height);
        const viewport = page.getViewport({ scale: width / original.width });
        const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8_000_000 / (viewport.width * viewport.height)));
        const surface = canvas.current;
        surface.width = Math.ceil(viewport.width * density);
        surface.height = Math.ceil(viewport.height * density);
        const context = surface.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas unavailable');
        renderTask = page.render({ canvasContext: context, viewport, transform: [density, 0, 0, density, 0, 0] });
        await renderTask.promise;
        if (cancelled) return;
        const pdfjs = await loadPdfJs();
        if (cancelled || !textContainer.current) return;
        textContainer.current.replaceChildren();
        textContainer.current.style.setProperty('--scale-factor', String(viewport.scale));
        textLayer = new pdfjs.TextLayer({ textContentSource: await page.getTextContent(), container: textContainer.current, viewport });
        if (cancelled) return;
        await textLayer.render();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void render();
    return () => { cancelled = true; renderTask?.cancel(); textLayer?.cancel(); };
  }, [pdf, number, visible, width, attempt]);

  return <section ref={container} className={styles.page} style={{ aspectRatio: ratio }} aria-label={`${title}, page ${number}`} aria-busy={!ready && !error}>
    <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    <div ref={textContainer} className={styles.textLayer} />
    {!ready && !error && <div className={styles.status} role="status"><Loader2 size={20} aria-hidden="true" /> Loading page {number}...</div>}
    {error && <div className={styles.status} role="alert"><span>Page {number} could not load.</span><button type="button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={16} /> Retry</button></div>}
  </section>;
}

export default function DocumentReader({ url, title, file }: { url: string; title: string; file?: File }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined;
    async function open() {
      try {
        const pdfjs = await loadPdfJs();
        const data = file ? await file.arrayBuffer() : undefined;
        if (cancelled) return;
        setPdf(null);
        setError(false);
        task = pdfjs.getDocument({ url: data ? undefined : url, data, cMapUrl: '/document-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/document-assets/standard_fonts/', isEvalSupported: false });
        const document = await task.promise;
        if (!cancelled) setPdf(document);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void open();
    return () => { cancelled = true; void task?.destroy(); };
  }, [url, file, attempt]);

  if (error) return <div role="alert" className={styles.error}><p>This article could not load.</p><button type="button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={16} /> Retry</button></div>;
  if (!pdf) return <p role="status"><Loader2 size={20} aria-hidden="true" /> Loading article...</p>;
  return <div className={styles.reader}>{Array.from({ length: pdf.numPages }, (_, index) => <DocumentPage key={`${url}-${index}`} pdf={pdf} number={index + 1} title={title} />)}</div>;
}