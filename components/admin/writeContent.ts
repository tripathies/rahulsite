import { contentSchemas, type ContentType } from '@/lib/content';

export async function writeContent(type: ContentType, draft: Record<string, unknown>, existing: boolean) {
  const parsed = contentSchemas[type].safeParse(draft);
  if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n'));
  const path = `/api/admin/data/${type}${existing ? `/${encodeURIComponent(String(draft.id))}` : ''}`;
  const response = await fetch(path, { method: existing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Save failed.');
  return parsed.data;
}

export async function uploadMedia(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/admin/upload', { method: 'POST', body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error || `Upload of ${file.name} failed.`);
  return payload.url as string;
}
