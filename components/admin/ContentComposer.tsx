'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import {
  Bold, Code, Eye, FileImage, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered,
  Loader2, Minus, PenLine, Quote, Save, Table, Trash2, Upload, X,
} from 'lucide-react';
import ContentBody from '@/components/sections/ContentBody';
import { contentFields, newContentDraft, type ContentField } from '@/lib/content';
import { loadPdfJs } from '@/lib/pdfThumbnail';
import { estimateReadTime, htmlToMarkdown, isSupportedImage, slugify, summarize } from '@/lib/pasteToMarkdown';
import { uploadMedia, writeContent } from './writeContent';
import styles from './ContentComposer.module.css';

export type ComposerType = 'blogs' | 'projects' | 'adventures';

const CONFIG: Record<ComposerType, { titleKey: string; summaryKey: string; noun: string }> = {
  blogs: { titleKey: 'title', summaryKey: 'excerpt', noun: 'article' },
  projects: { titleKey: 'title', summaryKey: 'description', noun: 'project' },
  adventures: { titleKey: 'destination', summaryKey: 'excerpt', noun: 'travel story' },
};
const HIDDEN_FIELDS = new Set(['slug', 'pdfUrl', 'readTime']);
const MAX_SLIDES = 120;

type ToolId = 'h2' | 'h3' | 'bold' | 'italic' | 'ul' | 'ol' | 'quote' | 'link' | 'code' | 'table' | 'hr' | 'image';
const TOOLS: { id: ToolId; label: string; icon: typeof Bold }[] = [
  { id: 'h2', label: 'Heading', icon: Heading2 },
  { id: 'h3', label: 'Subheading', icon: Heading3 },
  { id: 'bold', label: 'Bold', icon: Bold },
  { id: 'italic', label: 'Italic', icon: Italic },
  { id: 'ul', label: 'Bulleted list', icon: List },
  { id: 'ol', label: 'Numbered list', icon: ListOrdered },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'link', label: 'Link', icon: Link2 },
  { id: 'code', label: 'Code block', icon: Code },
  { id: 'table', label: 'Table', icon: Table },
  { id: 'hr', label: 'Divider', icon: Minus },
  { id: 'image', label: 'Add images', icon: ImagePlus },
];

type Draft = Record<string, unknown>;
type PendingImage = { token: string; file: File };

const draftKey = (type: ComposerType) => `rahultech:new-${type}-draft`;
const optionLabel = (value: string) => value.toLowerCase().split(/[_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const newToken = () => `#pending-image-${crypto.randomUUID()}`;

function readSavedDraft(type: ComposerType): Draft | null {
  try {
    const saved = localStorage.getItem(draftKey(type));
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem(draftKey(type));
    return null;
  }
}

async function renderPdfPages(file: File, onProgress: (done: number, total: number) => void) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), cMapUrl: '/document-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/document-assets/standard_fonts/', isEvalSupported: false }).promise;
  try {
    if (pdf.numPages > MAX_SLIDES) throw new Error(`This PDF has ${pdf.numPages} pages. Import up to ${MAX_SLIDES} at a time.`);
    const pages: { file: File; alt: string }[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(3, 1800 / base.width) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Your browser cannot render PDF pages.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error(`Page ${number} could not be rendered.`)), 'image/jpeg', 0.88));
      const text = await page.getTextContent();
      const firstLine = text.items.map(item => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      pages.push({ file: new File([blob], `${slugify(file.name.replace(/\.pdf$/i, '')) || 'slide'}-${number}.jpg`, { type: 'image/jpeg' }), alt: firstLine || `Slide ${number}` });
      page.cleanup();
      onProgress(number, pdf.numPages);
    }
    return pages;
  } finally {
    await pdf.destroy();
  }
}

interface Props {
  type: ComposerType;
  item?: Draft;
  existing: boolean;
  onClose: () => void;
  onSaved: (saved: Draft) => void;
}

export default function ContentComposer({ type, item, existing, onClose, onSaved }: Props) {
  const { titleKey, summaryKey, noun } = CONFIG[type];
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const slidesInput = useRef<HTMLInputElement>(null);
  const [savedDraft] = useState(() => existing ? null : readSavedDraft(type));
  const [draft, setDraft] = useState<Draft>(() => newContentDraft(type, savedDraft ?? item));
  const [slugEdited, setSlugEdited] = useState(Boolean(item?.slug));
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [uploads, setUploads] = useState(0);
  const [importing, setImporting] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restored, setRestored] = useState(Boolean(savedDraft));
  const replacesDocument = Boolean(item?.pdfUrl || item?.readingPdfUrl);
  const content = String(draft.content || '');
  const title = String(draft[titleKey] || '');
  const coverImage = String(draft.coverImage || '');
  const extraFields = contentFields[type].filter(field => field.key !== titleKey && field.key !== summaryKey && !HIDDEN_FIELDS.has(field.key));

  useEffect(() => { dialog.current?.showModal(); }, []);

  useEffect(() => {
    if (existing || !dirty) return;
    const timer = setTimeout(() => localStorage.setItem(draftKey(type), JSON.stringify(draft)), 600);
    return () => clearTimeout(timer);
  }, [draft, dirty, existing, type]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (key: string, value: unknown) => {
    setDraft(current => ({ ...current, [key]: value, ...(key === titleKey && !slugEdited ? { slug: slugify(String(value)) } : {}) }));
    setDirty(true);
  };

  const setContent = (transform: (value: string) => string) => {
    setDraft(current => ({ ...current, content: transform(String(current.content || '')) }));
    setDirty(true);
  };

  function insert(text: string, selectStart?: number, selectEnd?: number) {
    const area = editor.current;
    const start = area?.selectionStart ?? content.length;
    const end = area?.selectionEnd ?? start;
    setContent(value => value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      if (!area) return;
      area.focus();
      area.setSelectionRange(start + (selectStart ?? text.length), start + (selectEnd ?? selectStart ?? text.length));
    });
  }

  function wrap(before: string, after = before, placeholder = 'text') {
    const area = editor.current;
    const start = area?.selectionStart ?? 0;
    const end = area?.selectionEnd ?? 0;
    const selected = content.slice(start, end) || placeholder;
    insert(`${before}${selected}${after}`, before.length, before.length + selected.length);
  }

  function prefixLines(prefix: string | ((index: number) => string)) {
    const area = editor.current;
    const start = content.lastIndexOf('\n', (area?.selectionStart ?? 0) - 1) + 1;
    const endIndex = content.indexOf('\n', area?.selectionEnd ?? 0);
    const end = endIndex === -1 ? content.length : endIndex;
    const block = content.slice(start, end).split('\n').map((line, index) => `${typeof prefix === 'string' ? prefix : prefix(index)}${line.replace(/^(#{1,6} |[-*] |\d+\. |> )/, '')}`).join('\n');
    setContent(value => value.slice(0, start) + block + value.slice(end));
    requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(start, start + block.length); });
  }

  function runTool(id: ToolId) {
    switch (id) {
      case 'h2': return prefixLines('## ');
      case 'h3': return prefixLines('### ');
      case 'bold': return wrap('**');
      case 'italic': return wrap('*');
      case 'ul': return prefixLines('- ');
      case 'ol': return prefixLines(index => `${index + 1}. `);
      case 'quote': return prefixLines('> ');
      case 'link': return wrap('[', '](https://)', 'link text');
      case 'code': return wrap('\n```\n', '\n```\n', 'code');
      case 'table': return insert('\n\n| Column | Column |\n| --- | --- |\n| Value | Value |\n\n');
      case 'hr': return insert('\n\n---\n\n');
      case 'image': return imageInput.current?.click();
    }
  }

  async function uploadImages(images: PendingImage[]) {
    if (!images.length) return [] as string[];
    setUploads(count => count + images.length);
    const urls: string[] = [];
    const queue = images.map((image, index) => ({ ...image, index }));
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const { token, file, index } = next;
        try {
          const url = await uploadMedia(file);
          urls[index] = url;
          setContent(value => value.replaceAll(`](${token})`, `](${url})`));
        } catch (failure) {
          setContent(value => value.split('\n').filter(line => !line.includes(`](${token})`)).join('\n'));
          setError(failure instanceof Error ? failure.message : 'An image failed to upload.');
        } finally {
          setUploads(count => count - 1);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, images.length) }, worker));
    return urls;
  }

  function insertImageFiles(files: File[]) {
    const accepted = files.filter(isSupportedImage);
    if (accepted.length < files.length) setNotice('Only JPG, PNG and WebP images can be added.');
    if (!accepted.length) return;
    const images = accepted.map(file => ({ token: newToken(), file }));
    insert(`\n\n${images.map(image => `![${image.file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}](${image.token})`).join('\n\n')}\n\n`);
    void uploadImages(images);
  }

  async function importSlides(file: File) {
    if (!/\.pdf$/i.test(file.name)) {
      setError('Choose the PDF export of your presentation. In PowerPoint: File > Export > PDF.');
      return;
    }
    setError('');
    setNotice('');
    setImporting('Reading PDF…');
    try {
      const pages = await renderPdfPages(file, (done, total) => setImporting(`Preparing slide ${done} of ${total}…`));
      const images = pages.map(page => ({ token: newToken(), file: page.file, alt: page.alt.replace(/[[\]]/g, '') }));
      insert(`\n\n${images.map(image => `![${image.alt}](${image.token})`).join('\n\n')}\n\n`);
      setImporting('');
      const urls = await uploadImages(images);
      if (!coverImage && urls[0]) set('coverImage', urls[0]);
      setNotice(`${pages.length} slides added in order. Add your write-up between them, then publish.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The PDF could not be imported.');
    } finally {
      setImporting('');
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const html = event.clipboardData.getData('text/html');
    const files = Array.from(event.clipboardData.files);
    const htmlHasText = html && new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim();
    if (!htmlHasText && files.length) {
      event.preventDefault();
      insertImageFiles(files);
      return;
    }
    if (!html) return;
    event.preventDefault();
    const pasted = htmlToMarkdown(html);
    insert(pasted.markdown);
    void uploadImages(pasted.images);
    setNotice(pasted.skippedImages
      ? `${pasted.skippedImages} image${pasted.skippedImages > 1 ? 's' : ''} could not be copied from the source. Copy each image on its own and paste it where it belongs, or use Add images.`
      : '');
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    event.preventDefault();
    const pdf = files.find(file => /\.pdf$/i.test(file.name));
    if (pdf) void importSlides(pdf);
    else insertImageFiles(files);
  }

  async function uploadCover(file: File) {
    if (!isSupportedImage(file)) { setError('Cover image must be JPG, PNG or WebP.'); return; }
    setError('');
    setUploads(count => count + 1);
    try { set('coverImage', await uploadMedia(file)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Cover upload failed.'); }
    finally { setUploads(count => count - 1); }
  }

  async function save() {
    const problems = [
      !title.trim() && 'Add a title.',
      !coverImage && 'Add a cover image.',
      !content.trim() && 'Write, paste or import the content.',
      !draft.slug && 'Add a URL slug.',
    ].filter(Boolean);
    if (problems.length) { setError(problems.join(' ')); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await writeContent(type, {
        ...draft,
        [titleKey]: title.trim(),
        [summaryKey]: String(draft[summaryKey] || '').trim() || summarize(content),
        ...(type === 'blogs' ? { readTime: estimateReadTime(content) } : {}),
        pdfUrl: '',
        readingPdfUrl: '',
      }, existing);
      if (!existing) localStorage.removeItem(draftKey(type));
      setDirty(false);
      onSaved(saved);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (saving || uploads > 0 || importing) return;
    if (dirty && !confirm(existing ? 'Discard unsaved changes?' : 'Close the editor? Your draft is kept on this device.')) return;
    onClose();
  }

  function renderField(field: ContentField) {
    const value = draft[field.key];
    const input = field.kind === 'checkbox'
      ? <input type="checkbox" checked={Boolean(value)} onChange={event => set(field.key, event.target.checked)} />
      : field.kind === 'select'
        ? <select value={String(value || '')} onChange={event => set(field.key, event.target.value)}>{field.options?.map(option => <option key={option} value={option}>{optionLabel(option)}</option>)}</select>
        : field.kind === 'list' || field.kind === 'textarea'
          ? <textarea rows={3} value={Array.isArray(value) ? value.join('\n') : String(value ?? '')} onChange={event => set(field.key, field.kind === 'list' ? event.target.value.split('\n') : event.target.value)} />
          : <input type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'} step={field.kind === 'number' ? 'any' : undefined} value={String(value ?? '')} onChange={event => set(field.key, field.kind === 'number' ? Number(event.target.value) : event.target.value)} />;
    return <label key={field.key} className={field.kind === 'checkbox' ? styles.check : styles.field}>
      {field.kind !== 'checkbox' && <span className={styles.label}>{field.label}</span>}
      {input}
      {field.kind === 'checkbox' && field.label}
    </label>;
  }

  const busy = saving || uploads > 0 || Boolean(importing);
  const published = draft.isPublished !== false;
  const statusText = importing || (uploads > 0 ? `Uploading ${uploads} image${uploads > 1 ? 's' : ''}…` : type === 'blogs' ? `${estimateReadTime(content)} min read` : '');

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="composer-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className={styles.header}>
      <h2 id="composer-title">{existing ? `Edit ${noun}` : `New ${noun}`}</h2>
      <div className={styles.headerActions}>
        <span className={styles.status} role="status">{(importing || uploads > 0) && <Loader2 size={14} className={styles.spin} />} {statusText}</span>
        <label className={styles.toggle}><input type="checkbox" checked={published} onChange={event => set('isPublished', event.target.checked)} disabled={busy} /> Published</label>
        <button type="button" className={styles.primary} onClick={save} disabled={busy}>{saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />} {saving ? 'Saving…' : published ? 'Publish' : 'Save draft'}</button>
        <button type="button" className={styles.icon} onClick={close} disabled={busy} aria-label="Close editor" title="Close"><X size={18} /></button>
      </div>
    </header>

    {(error || notice || restored || replacesDocument) && <div className={styles.messages}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {notice && <p role="status" className={styles.notice}>{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></p>}
      {restored && <p role="status" className={styles.notice}>Your unsaved draft was restored. <button type="button" onClick={() => { localStorage.removeItem(draftKey(type)); setDraft(newContentDraft(type)); setSlugEdited(false); setRestored(false); setDirty(false); }}>Start fresh</button></p>}
      {replacesDocument && <p role="status" className={styles.notice}>This entry currently shows an uploaded document. Saving replaces it with the content below.</p>}
    </div>}

    <div className={styles.body}>
      <aside className={styles.meta}>
        <div className={styles.cover}>
          <span className={styles.label}>Cover image *</span>
          <button type="button" className={styles.coverDrop} onClick={() => coverInput.current?.click()} disabled={busy}
            onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadCover(file); }}>
            {coverImage
              ? <img src={coverImage} alt="Cover preview" />
              : <span><Upload size={22} /> Upload cover image<small>Shown on cards and at the top of the page. 1600 × 900 recommended. Importing slides uses slide 1 if empty.</small></span>}
          </button>
          <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void uploadCover(file); event.target.value = ''; }} />
          {coverImage && <button type="button" className={styles.link} onClick={() => set('coverImage', '')} disabled={busy}><Trash2 size={14} /> Remove cover</button>}
        </div>

        <label className={styles.field}><span className={styles.label}>URL slug</span>
          <input value={String(draft.slug || '')} onChange={event => { setSlugEdited(true); set('slug', slugify(event.target.value)); }} disabled={busy} />
        </label>
        <label className={styles.field}><span className={styles.label}>Summary</span>
          <textarea rows={4} maxLength={300} value={String(draft[summaryKey] || '')} placeholder={summarize(content) || 'Shown on cards. Leave empty to use the first paragraph.'} onChange={event => set(summaryKey, event.target.value)} disabled={busy} />
        </label>
        <fieldset className={styles.extra} disabled={busy}>{extraFields.map(renderField)}</fieldset>
      </aside>

      <section className={styles.writing}>
        <input className={styles.title} value={title} placeholder="Title" aria-label="Title" onChange={event => set(titleKey, event.target.value)} disabled={busy} />
        <div className={styles.tabs} role="tablist" aria-label="Editor view">
          <button type="button" role="tab" aria-selected={view === 'write'} onClick={() => setView('write')}><PenLine size={15} /> Write</button>
          <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}><Eye size={15} /> Preview</button>
        </div>
        <div className={styles.panes} data-view={view}>
          <div className={styles.writePane}>
            <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
              {TOOLS.map(tool => <button key={tool.id} type="button" title={tool.label} aria-label={tool.label} onClick={() => runTool(tool.id)} disabled={busy}><tool.icon size={16} /></button>)}
              <button type="button" className={styles.importButton} onClick={() => slidesInput.current?.click()} disabled={busy} title="Insert every page of a PDF (for example, your PowerPoint exported as PDF) as images, in order">
                <FileImage size={16} /> Import slides (PDF)
              </button>
            </div>
            <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { insertImageFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
            <input ref={slidesInput} type="file" accept="application/pdf,.pdf" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void importSlides(file); event.target.value = ''; }} />
            <textarea ref={editor} className={styles.editor} value={content} spellCheck
              placeholder={'Write here, or paste from Word, Google Docs or a web page — headings, lists, links and tables keep their structure.\n\nImages: paste them, drop them here, or use Add images.\nPresentation: export it as PDF, then use Import slides to place every slide here in order. Add your write-up between the slides.'}
              onChange={event => { const value = event.target.value; setDraft(current => ({ ...current, content: value })); setDirty(true); }}
              onPaste={handlePaste} onDrop={handleDrop} disabled={saving || Boolean(importing)} aria-label="Content" />
          </div>
          <article className={styles.previewPane} aria-label="Preview">
            {coverImage && <img className={styles.previewCover} src={coverImage} alt="" />}
            <h1 className={styles.previewTitle}>{title || 'Title'}</h1>
            {content ? <ContentBody content={content} /> : <p className={styles.empty}>Your preview appears here.</p>}
          </article>
        </div>
      </section>
    </div>
  </dialog>;
}
