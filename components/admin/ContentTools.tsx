'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Download, Eye, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { contentFields, contentSchemas, newContentDraft, type ContentType } from '@/lib/content';
import MediaUploader from './MediaUploader';
import ContentComposer from './ContentComposer';
import { writeContent } from './writeContent';
import ContentBody from '@/components/sections/ContentBody';
import styles from './ContentTools.module.css';

interface Props {
  type: ContentType;
  item?: object;
  source: string;
  onChanged: () => void;
  importItems?: object[];
}

export default function ContentTools({ type, item, source, onChanged, importItems }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!session?.user?.isAdmin) return null;

  const record = item as Record<string, unknown> | undefined;
  const importableItems = importItems?.filter((initial) => contentSchemas[type].safeParse(newContentDraft(type, initial)).success);
  const title = String(record?.title || record?.destination || 'this item');
  async function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/data/${type}/${encodeURIComponent(String(record?.id))}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Delete failed.');
      onChanged();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Delete failed.'); }
    finally { setBusy(false); }
  }

  const isComposerType = type === 'blogs' || type === 'adventures' || type === 'projects';

  return <div className={styles.tools}>
    <button type="button" className={styles.button} disabled={busy} title={item ? `Edit ${title}` : 'Create new content'} onClick={() => setOpen(true)}>
      {item ? <Pencil size={16} /> : <Plus size={16} />} {item ? 'Edit' : `New ${type === 'adventures' ? 'travel story' : type === 'blogs' ? 'blog' : type === 'projects' ? 'project' : type === 'videos' ? 'video' : 'profile'}`}
    </button>
    {item && type !== 'about' && source === 'cosmos' && Boolean(record?.id) && <button type="button" className={styles.icon} disabled={busy} title={`Delete ${title}`} aria-label={`Delete ${title}`} onClick={remove}><Trash2 size={16} /></button>}
    {importableItems && importableItems.length > 0 && source === 'cosmos' && <button type="button" className={styles.button} disabled={busy} onClick={async () => {
      if (!confirm('Copy the existing sample content into Cosmos DB so it can be edited?')) return;
      setBusy(true); setError('');
      try { for (const initial of importableItems) await writeContent(type, newContentDraft(type, initial), false); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'Import failed.'); }
      finally { setBusy(false); onChanged(); }
    }}><Download size={16} /> Import existing content</button>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {open && isComposerType && <ContentComposer type={type} item={record} existing={source === 'cosmos' && Boolean(record?.id)} onClose={() => setOpen(false)} onSaved={(saved) => {
      setOpen(false);
      if (record?.slug && saved.slug !== record.slug && pathname.endsWith(`/${record.slug}`)) router.replace(`${pathname.slice(0, pathname.lastIndexOf('/'))}/${saved.slug}`);
      else onChanged();
    }} />}
    {open && !isComposerType && <ContentEditor type={type} item={record} existing={source === 'cosmos' && Boolean(record?.id)} onClose={() => setOpen(false)} onSaved={(saved) => {
      setOpen(false);
      if (record?.slug && saved.slug !== record.slug && pathname.endsWith(`/${record.slug}`)) router.replace(`${pathname.slice(0, pathname.lastIndexOf('/'))}/${saved.slug}`);
      else onChanged();
    }} />}
  </div>;
}

function ContentEditor({ type, item, existing, onClose, onSaved }: { type: ContentType; item?: Record<string, unknown>; existing: boolean; onClose: () => void; onSaved: (saved: Record<string, unknown>) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(() => newContentDraft(type, item));
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const uploadBusy = (busy: boolean) => setUploads((count) => Math.max(0, count + (busy ? 1 : -1)));
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const set = (key: string, value: unknown) => { setDraft((current) => ({ ...current, [key]: value })); setDirty(true); };
  const close = () => { if (!saving && uploads === 0 && (!dirty || confirm('Discard unsaved changes?'))) onClose(); };
  const photos = (draft.photos || []) as string[];
  const videos = (draft.videos || []) as string[];

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="content-editor-title" onCancel={(event) => { event.preventDefault(); close(); }}>
    <form onSubmit={async (event) => { event.preventDefault(); if (uploads > 0) return; setSaving(true); setError(''); try { onSaved(await writeContent(type, draft, existing)); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Save failed.'); } finally { setSaving(false); } }}>
      <header className={styles.header}><h2 id="content-editor-title">{existing ? 'Edit' : 'Create'} {type === 'adventures' ? 'travel story' : type === 'blogs' ? 'blog' : type === 'about' ? 'profile' : type === 'projects' ? 'project' : 'video'}</h2><button type="button" className={styles.icon} aria-label="Close editor" title="Close" disabled={saving} onClick={close}><X size={20} /></button></header>
      <fieldset disabled={saving} className={styles.fields}>
        {contentFields[type].map((field) => <label key={field.key} className={styles.field}>
          <span>{field.label}</span>
          {field.kind === 'checkbox' ? <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => set(field.key, event.target.checked)} />
            : field.kind === 'select' ? <select value={String(draft[field.key] || '')} onChange={(event) => set(field.key, event.target.value)}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
              : field.kind === 'textarea' || field.kind === 'list' ? <textarea rows={3} value={Array.isArray(draft[field.key]) ? (draft[field.key] as string[]).join('\n') : String(draft[field.key] || '')} onChange={(event) => set(field.key, field.kind === 'list' ? event.target.value.split('\n') : event.target.value)} />
                : <input type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'} step={field.kind === 'number' ? 'any' : undefined} value={String(draft[field.key] ?? '')} onChange={(event) => set(field.key, field.kind === 'number' ? Number(event.target.value) : event.target.value)} />}
          {field.kind === 'image' && <MediaUploader onBusyChange={uploadBusy} accept="image/jpeg,image/png,image/webp" onUploaded={(url) => set(field.key, url)} />}
        </label>)}
        {type !== 'videos' && <>
          <div className={styles.wide}><label className={styles.field}><span>Cover image</span><input value={String(draft.coverImage || '')} onChange={(event) => set('coverImage', event.target.value)} /></label><MediaUploader onBusyChange={uploadBusy} accept="image/jpeg,image/png,image/webp" onUploaded={(url) => set('coverImage', url)} /></div>
          <label className={`${styles.field} ${styles.wide}`}><span>Story / biography (Markdown)</span><textarea rows={14} value={String(draft.content || '')} onChange={(event) => set('content', event.target.value)} /></label>
          <div className={styles.wide}><h3>Images</h3><MediaUploader onBusyChange={uploadBusy} accept="image/jpeg,image/png,image/webp" onUploaded={(url) => { setDraft((current) => ({ ...current, photos: [...(current.photos as string[] || []), url] })); setDirty(true); }} />
            <div className={styles.media}>{photos.map((url, index) => <div key={`${index}-${url}`}><img src={url} alt={`Uploaded image ${index + 1}`} /><button type="button" className={styles.icon} title="Remove image" aria-label={`Remove image ${index + 1}`} onClick={() => set('photos', photos.filter((_, position) => position !== index))}><Trash2 size={14} /></button></div>)}</div>
          </div>
          <div className={styles.wide}><h3>Videos</h3><MediaUploader onBusyChange={uploadBusy} accept="video/mp4" onUploaded={(url) => { setDraft((current) => ({ ...current, videos: [...(current.videos as string[] || []), url] })); setDirty(true); }} />{videos.map((url, index) => <div key={`${index}-${url}`} className={styles.video}><video controls preload="metadata" src={url} /><button type="button" className={styles.icon} title="Remove video" aria-label={`Remove video ${index + 1}`} onClick={() => set('videos', videos.filter((_, position) => position !== index))}><Trash2 size={14} /></button></div>)}</div>
        </>}
        <label className={styles.publish}><input type="checkbox" checked={draft.isPublished !== false} onChange={(event) => set('isPublished', event.target.checked)} /> Published</label>
      </fieldset>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {preview && <section className={styles.preview}><h2>{String(draft.title || draft.destination || '')}</h2><ContentBody content={String(draft.content || '')} photos={photos} videos={videos} /></section>}
      <footer className={styles.footer}><button type="button" className={styles.button} onClick={() => setPreview(!preview)}><Eye size={16} /> Preview</button><button type="submit" className={styles.primary} disabled={saving || uploads > 0}><Save size={16} /> {uploads > 0 ? 'Uploading...' : saving ? 'Saving...' : 'Save'}</button></footer>
    </form>
  </dialog>;
}