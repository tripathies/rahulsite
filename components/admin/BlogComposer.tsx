'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import {
  Bold, Code, Eye, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered,
  Loader2, Minus, PenLine, Quote, Save, Table, Trash2, Upload, X,
} from 'lucide-react';
import ContentBody from '@/components/sections/ContentBody';
import { newContentDraft } from '@/lib/content';
import { estimateReadTime, htmlToMarkdown, isSupportedImage, slugify, summarize } from '@/lib/pasteToMarkdown';
import { uploadMedia, writeContent } from './writeContent';
import styles from './BlogComposer.module.css';

type Category = 'CLOUD_ARCHITECTURE' | 'AI_LESSONS' | 'TRAVEL_JOURNAL' | 'CAREER';
const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'CLOUD_ARCHITECTURE', label: 'Cloud Architecture' },
  { value: 'AI_LESSONS', label: 'AI Lessons' },
  { value: 'TRAVEL_JOURNAL', label: 'Travel Journal' },
  { value: 'CAREER', label: 'Career' },
];
const DRAFT_KEY = 'rahultech:new-blog-draft';

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
  { id: 'image', label: 'Add image', icon: ImagePlus },
];

function readSavedDraft(): Partial<Fields> | null {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

interface Props {
  item?: Record<string, unknown>;
  existing: boolean;
  onClose: () => void;
  onSaved: (saved: Record<string, unknown>) => void;
}

interface Fields {
  title: string;
  slug: string;
  excerpt: string;
  category: Category;
  publishedAt: string;
  isPublished: boolean;
  coverImage: string;
  content: string;
}

function initialFields(item?: Record<string, unknown>): Fields {
  const draft = newContentDraft('blogs', item);
  return {
    title: String(draft.title || ''),
    slug: String(draft.slug || ''),
    excerpt: String(draft.excerpt || ''),
    category: (draft.category as Category) || 'CLOUD_ARCHITECTURE',
    publishedAt: String(draft.publishedAt || new Date().toISOString().slice(0, 10)),
    isPublished: draft.isPublished !== false,
    coverImage: String(draft.coverImage || ''),
    content: String(draft.content || ''),
  };
}

export default function BlogComposer({ item, existing, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [savedDraft] = useState(() => existing ? null : readSavedDraft());
  const [fields, setFields] = useState<Fields>(() => savedDraft ? { ...initialFields(), ...savedDraft } : initialFields(item));
  const [slugEdited, setSlugEdited] = useState(Boolean(item?.slug));
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restored, setRestored] = useState(Boolean(savedDraft));
  const replacesDocument = Boolean(item?.pdfUrl || item?.readingPdfUrl);

  useEffect(() => { dialog.current?.showModal(); }, []);

  useEffect(() => {
    if (existing || !dirty) return;
    const timer = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(fields)), 600);
    return () => clearTimeout(timer);
  }, [fields, dirty, existing]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (patch: Partial<Fields>) => {
    setFields(current => ({ ...current, ...patch, ...(patch.title !== undefined && !slugEdited ? { slug: slugify(patch.title) } : {}) }));
    setDirty(true);
  };

  const setContent = (transform: (content: string) => string) => {
    setFields(current => ({ ...current, content: transform(current.content) }));
    setDirty(true);
  };

  function insert(text: string, selectStart?: number, selectEnd?: number) {
    const area = editor.current;
    const start = area?.selectionStart ?? fields.content.length;
    const end = area?.selectionEnd ?? start;
    setContent(content => content.slice(0, start) + text + content.slice(end));
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
    const selected = fields.content.slice(start, end) || placeholder;
    insert(`${before}${selected}${after}`, before.length, before.length + selected.length);
  }

  function prefixLines(prefix: string | ((index: number) => string)) {
    const area = editor.current;
    const content = fields.content;
    const start = content.lastIndexOf('\n', (area?.selectionStart ?? 0) - 1) + 1;
    const endIndex = content.indexOf('\n', area?.selectionEnd ?? 0);
    const end = endIndex === -1 ? content.length : endIndex;
    const lines = content.slice(start, end).split('\n').map((line, index) => `${typeof prefix === 'string' ? prefix : prefix(index)}${line.replace(/^(#{1,6} |[-*] |\d+\. |> )/, '')}`);
    const block = lines.join('\n');
    setContent(current => current.slice(0, start) + block + current.slice(end));
    requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(start, start + block.length); });
  }

  async function uploadImages(images: { token: string; file: File }[]) {
    if (!images.length) return;
    setUploads(count => count + images.length);
    await Promise.all(images.map(async ({ token, file }) => {
      try {
        const url = await uploadMedia(file);
        setContent(content => content.replaceAll(`](${token})`, `](${url})`));
      } catch (failure) {
        setContent(content => content.replace(new RegExp(`!\\[[^\\]]*\\]\\(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\n?`, 'g'), ''));
        setError(failure instanceof Error ? failure.message : 'An image failed to upload.');
      } finally {
        setUploads(count => count - 1);
      }
    }));
  }

  function insertImageFiles(files: File[]) {
    const accepted = files.filter(isSupportedImage);
    if (accepted.length < files.length) setNotice('Only JPG, PNG and WebP images can be added.');
    if (!accepted.length) return;
    const images = accepted.map(file => ({ token: `#pending-image-${crypto.randomUUID()}`, file }));
    insert(`\n\n${images.map(image => `![${image.file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}](${image.token})`).join('\n\n')}\n\n`);
    void uploadImages(images);
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
      ? `${pasted.skippedImages} image${pasted.skippedImages > 1 ? 's' : ''} could not be copied from the source. Copy each image on its own and paste it where it belongs, or use Add image.`
      : '');
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    event.preventDefault();
    insertImageFiles(files);
  }

  async function uploadCover(file: File) {
    if (!isSupportedImage(file)) { setError('Cover image must be JPG, PNG or WebP.'); return; }
    setError('');
    setUploads(count => count + 1);
    try { update({ coverImage: await uploadMedia(file) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Cover upload failed.'); }
    finally { setUploads(count => count - 1); }
  }

  async function save() {
    const problems = [
      !fields.title.trim() && 'Add a title.',
      !fields.coverImage && 'Add a cover image.',
      !fields.content.trim() && 'Write or paste the article.',
      !fields.slug && 'Add a URL slug.',
    ].filter(Boolean);
    if (problems.length) { setError(problems.join(' ')); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await writeContent('blogs', {
        ...newContentDraft('blogs', item),
        ...fields,
        title: fields.title.trim(),
        excerpt: fields.excerpt.trim() || summarize(fields.content),
        readTime: estimateReadTime(fields.content),
        pdfUrl: '',
        readingPdfUrl: '',
      }, existing);
      if (!existing) localStorage.removeItem(DRAFT_KEY);
      setDirty(false);
      onSaved(saved);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (saving || uploads > 0) return;
    if (dirty && !confirm(existing ? 'Discard unsaved changes?' : 'Close the editor? Your draft is kept on this device.')) return;
    onClose();
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

  const busy = saving || uploads > 0;
  const readTime = estimateReadTime(fields.content);

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="blog-composer-title" onCancel={event => { event.preventDefault(); close(); }}>
    <header className={styles.header}>
      <h2 id="blog-composer-title">{existing ? 'Edit article' : 'New article'}</h2>
      <div className={styles.headerActions}>
        <span className={styles.status} role="status">{uploads > 0 ? <><Loader2 size={14} className={styles.spin} /> Uploading {uploads} image{uploads > 1 ? 's' : ''}…</> : `${readTime} min read`}</span>
        <label className={styles.toggle}><input type="checkbox" checked={fields.isPublished} onChange={event => update({ isPublished: event.target.checked })} disabled={busy} /> Published</label>
        <button type="button" className={styles.primary} onClick={save} disabled={busy}>{saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />} {saving ? 'Saving…' : fields.isPublished ? 'Publish' : 'Save draft'}</button>
        <button type="button" className={styles.icon} onClick={close} disabled={busy} aria-label="Close editor" title="Close"><X size={18} /></button>
      </div>
    </header>

    {(error || notice || restored || replacesDocument) && <div className={styles.messages}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {notice && <p role="status" className={styles.notice}>{notice} <button type="button" onClick={() => setNotice('')}>Dismiss</button></p>}
      {restored && <p role="status" className={styles.notice}>Your unsaved draft was restored. <button type="button" onClick={() => { localStorage.removeItem(DRAFT_KEY); setFields(initialFields()); setSlugEdited(false); setRestored(false); setDirty(false); }}>Start fresh</button></p>}
      {replacesDocument && <p role="status" className={styles.notice}>This post currently shows an uploaded document. Saving replaces it with the article below.</p>}
    </div>}

    <div className={styles.body}>
      <aside className={styles.meta}>
        <div className={styles.cover}>
          <span className={styles.label}>Cover image *</span>
          <button type="button" className={styles.coverDrop} onClick={() => coverInput.current?.click()} disabled={busy}
            onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void uploadCover(file); }}>
            {fields.coverImage
              ? <img src={fields.coverImage} alt="Cover preview" />
              : <span><Upload size={22} /> Upload cover image<small>Shown on blog cards and at the top of the article. 1600 × 900 recommended.</small></span>}
          </button>
          <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void uploadCover(file); event.target.value = ''; }} />
          {fields.coverImage && <button type="button" className={styles.link} onClick={() => update({ coverImage: '' })} disabled={busy}><Trash2 size={14} /> Remove cover</button>}
        </div>

        <label className={styles.field}><span className={styles.label}>URL slug</span>
          <input value={fields.slug} onChange={event => { setSlugEdited(true); update({ slug: slugify(event.target.value) }); }} disabled={busy} />
        </label>
        <label className={styles.field}><span className={styles.label}>Category</span>
          <select value={fields.category} onChange={event => update({ category: event.target.value as Category })} disabled={busy}>
            {CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </label>
        <label className={styles.field}><span className={styles.label}>Publication date</span>
          <input type="date" value={fields.publishedAt} onChange={event => update({ publishedAt: event.target.value })} disabled={busy} />
        </label>
        <label className={styles.field}><span className={styles.label}>Summary</span>
          <textarea rows={4} maxLength={300} value={fields.excerpt} placeholder={summarize(fields.content) || 'Shown on blog cards. Leave empty to use the first paragraph.'} onChange={event => update({ excerpt: event.target.value })} disabled={busy} />
        </label>
      </aside>

      <section className={styles.writing}>
        <input className={styles.title} value={fields.title} placeholder="Article title" aria-label="Article title" onChange={event => update({ title: event.target.value })} disabled={busy} />
        <div className={styles.tabs} role="tablist" aria-label="Editor view">
          <button type="button" role="tab" aria-selected={view === 'write'} onClick={() => setView('write')}><PenLine size={15} /> Write</button>
          <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}><Eye size={15} /> Preview</button>
        </div>
        <div className={styles.panes} data-view={view}>
          <div className={styles.writePane}>
            <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
              {TOOLS.map(tool => <button key={tool.id} type="button" title={tool.label} aria-label={tool.label} onClick={() => runTool(tool.id)} disabled={saving}><tool.icon size={16} /></button>)}
            </div>
            <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { insertImageFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
            <textarea ref={editor} className={styles.editor} value={fields.content} spellCheck
              placeholder={'Paste your article from Word, PowerPoint, Google Docs or a web page.\n\nHeadings, lists, bold text, links and tables keep their structure. Pasted or dropped images are uploaded and placed where they appear.'}
              onChange={event => { setFields(current => ({ ...current, content: event.target.value })); setDirty(true); }}
              onPaste={handlePaste} onDrop={handleDrop} disabled={saving} aria-label="Article body" />
          </div>
          <article className={styles.previewPane} aria-label="Article preview">
            {fields.coverImage && <img className={styles.previewCover} src={fields.coverImage} alt="" />}
            <h1 className={styles.previewTitle}>{fields.title || 'Article title'}</h1>
            {fields.content ? <ContentBody content={fields.content} /> : <p className={styles.empty}>Your article preview appears here.</p>}
          </article>
        </div>
      </section>
    </div>
  </dialog>;
}
