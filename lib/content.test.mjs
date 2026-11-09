import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as fileType from 'file-type';

const requireDependency = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
function load(file, mocks = {}, env = {}, fetchMock, cwd = root) {
  const { outputText, diagnostics } = ts.transpileModule(readFileSync(resolve(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, reportDiagnostics: true,
  });
  assert.equal(diagnostics.length, 0);
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded, exports: loaded.exports, require: (name) => mocks[name] || requireDependency(name),
    process: { env, cwd: () => cwd }, fetch: fetchMock, Headers, AbortSignal, Date, URL, URLSearchParams, Response, Buffer,
  });
  return loaded.exports;
}

const content = load('lib/content.ts');
const fixtures = load('lib/fixtures.ts');
const blog = { title: 'Test story', slug: 'test-story', publishedAt: '2026-05-20', content: '# A real story', isPublished: true };
const context = (type = 'blogs', id = 'test-id') => ({ params: Promise.resolve({ type, id }) });
const request = (method, body) => new Request('https://example.test/api/admin/data/blogs', { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });

test('direct private-blob URLs are rewritten to the media proxy, other URLs are untouched', () => {
  const { toMediaUrls } = load('lib/mediaUrl.ts');
  const item = { coverImage: 'https://rahulsitefiles.blob.core.windows.net/uploads/abc-cover.png', content: '![a](https://rahulsitefiles.blob.core.windows.net/uploads/slide-1.jpg?sv=1)\n![b](/uploads/local.jpg)\n[x](https://example.com/uploads/a.png)', photos: ['/uploads/local.png'] };
  const result = toMediaUrls(item);
  assert.equal(result.coverImage, '/api/media/abc-cover.png');
  assert.equal(result.content, '![a](/api/media/slide-1.jpg)\n![b](/api/media/local.jpg)\n[x](https://example.com/uploads/a.png)');
  assert.equal(result.photos[0], '/api/media/local.png');
});

test('document posts retain original files and accept only PDF reading versions', () => {
  const parsed = content.contentSchemas.blogs.parse({ ...blog, pdfUrl: '/api/media/source.pptx', readingPdfUrl: '/api/media/reading.pdf', coverImage: '/api/media/cover.jpg' });
  assert.equal(parsed.pdfUrl, '/api/media/source.pptx');
  assert.equal(parsed.readingPdfUrl, '/api/media/reading.pdf');
  assert.equal(parsed.content, blog.content);
  assert.equal(content.contentSchemas.blogs.parse({ ...blog, pdfUrl: '/api/media/reading.pdf' }).readingPdfUrl, '');
  for (const readingPdfUrl of ['/api/media/source.pptx', 'javascript:alert(1)', '//external.test/reading.pdf']) {
    assert.equal(content.contentSchemas.blogs.safeParse({ ...blog, readingPdfUrl }).success, false);
  }
});

test('schemas accept existing content and reject invalid dates, slugs, media URLs and video IDs', () => {
  for (const [type, name] of Object.entries({ blogs: 'blogFixtures', adventures: 'adventureFixtures', projects: 'projectFixtures' })) {
    for (const item of fixtures[name]) assert.equal(content.contentSchemas[type].safeParse(content.newContentDraft(type, item)).success, true, `${type}: ${item.slug || item.title}`);
  }
  for (const video of fixtures.videoFixtures) assert.equal(content.contentSchemas.videos.safeParse(content.newContentDraft('videos', video)).success, false);
  for (const invalid of [{ slug: '../escape' }, { publishedAt: 'bad-date' }, { coverImage: 'javascript:alert(1)' }, { coverImage: '//other-host/file.png' }]) {
    assert.equal(content.contentSchemas.blogs.safeParse({ ...blog, ...invalid }).success, false);
  }
  assert.equal(content.contentSchemas.videos.safeParse({ title: 'Video', youtubeId: 'invalid', publishedAt: '2026-05-20' }).success, false);
});

test('public reads exclude drafts and Mongo IDs, and never expose settings or mask database failures', async () => {
  let configured = true;
  let fail = false;
  const DataService = { isDatabaseConfigured: () => configured, listItems: async () => { if (fail) throw new Error('offline'); return [{ ...blog, _id: 'internal' }, { ...blog, isPublished: false }]; } };
  const { GET } = load('app/api/content/[type]/route.ts', { '@/services/DataService': { DataService }, '@/lib/fixtures': fixtures });
  const response = await GET(request('GET'), context());
  const payload = await response.json();
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0]._id, undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await GET(request('GET'), context('settings'))).status, 404);
  assert.equal((await GET(request('GET'), context('toString'))).status, 404);
  fail = true;
  assert.equal((await GET(request('GET'), context())).status, 503);
  configured = false;
  assert.equal((await (await GET(request('GET'), context())).json()).source, 'fixtures');
});

test('content mutations enforce admin authorization, validate content, persist CRUD, and reject duplicate slugs', async () => {
  let admin = false;
  let configured = true;
  const records = [];
  const DataService = {
    isSupportedDataType: (type) => Object.hasOwn(content.contentSchemas, type), isDatabaseConfigured: () => configured,
    listItems: async () => records,
    createItem: async (_type, item) => { records.push(item); return item; },
    updateItem: async (_type, id, update) => { const item = records.find((entry) => entry.id === id); return item ? Object.assign(item, update) : null; },
    deleteItem: async (_type, id) => { const index = records.findIndex((entry) => entry.id === id); if (index < 0) return false; records.splice(index, 1); return true; },
  };
  const mocks = { '@/services/DataService': { DataService }, '@/lib/auth': { getAdminSession: async () => admin ? { user: { isAdmin: true } } : null }, '@/lib/content': content, '@/lib/fixtures': fixtures };
  const { POST } = load('app/api/admin/data/[type]/route.ts', mocks);
  const { PUT, DELETE } = load('app/api/admin/data/[type]/[id]/route.ts', mocks);
  for (const [handler, method] of [[POST, 'POST'], [PUT, 'PUT'], [DELETE, 'DELETE']]) assert.equal((await handler(request(method, blog), context())).status, 401);
  admin = true;
  assert.equal((await POST(request('POST', { ...blog, slug: 'Invalid Slug' }), context())).status, 400);
  assert.equal((await POST(request('POST', { ...blog, id: 'test-id' }), context())).status, 200);
  assert.equal(records[0].content, blog.content);
  assert.equal((await POST(request('POST', blog), context())).status, 409);
  assert.equal((await PUT(request('PUT', { ...blog, title: 'Updated', id: 'forged-id', isPublished: false }), context())).status, 200);
  assert.equal(records[0].id, 'test-id');
  assert.equal(records[0].title, 'Updated');
  assert.equal(records[0].isPublished, false);
  assert.equal((await DELETE(request('DELETE'), context())).status, 200);
  assert.equal(records.length, 0);
  assert.equal((await DELETE(request('DELETE'), context())).status, 404);
  assert.equal((await PUT(request('PUT', blog), context())).status, 404);
  configured = false;
  assert.equal((await POST(request('POST', blog), context())).status, 500);
});

test('media uploads reject spoofed content and send real images to Blob storage', async () => {
  const uploaded = [];
  const { MediaService } = load('services/MediaService.ts', {
    'file-type': fileType,
    '@/lib/azure/storage': { AzureStorageClient: { uploadBlob: async (data, name, mime) => { uploaded.push({ data, name, mime }); return { url: `/api/media/${name}` }; } } },
  });
  await assert.rejects(MediaService.processAndUploadFile(new File(['<script>bad</script>'], 'bad.png', { type: 'image/png' })), /contents do not match/);
  await assert.rejects(MediaService.processAndUploadFile(new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })), /Invalid file type/);
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=', 'base64');
  const result = await MediaService.processAndUploadFile(new File([image], 'photo.png', { type: 'image/png' }));
  assert.equal(uploaded.length, 1);
  assert.equal(uploaded[0].mime, 'image/png');
  assert.match(result.url, /^\/api\/media\/.*photo\.png$/);
});

test('media reads stream private blobs, support video ranges, and reject invalid paths and ranges', async () => {
  const bytes = Buffer.from('0123456789');
  const { GET } = load('app/api/media/[name]/route.ts', { '@/lib/azure/storage': { AzureStorageClient: { getBlob: async () => ({
    getProperties: async () => ({ contentLength: bytes.length, contentType: 'video/mp4' }),
    download: async (start, count) => ({ readableStreamBody: Readable.from([bytes.subarray(start, start + count)]) }),
  }) } } });
  const get = (range, name = 'clip.mp4') => GET(new Request('https://example.test/api/media/clip.mp4', { headers: range ? { range } : {} }), { params: Promise.resolve({ name }) });
  assert.equal(await (await get()).text(), '0123456789');
  for (const [range, expected] of [['bytes=2-4', '234'], ['bytes=-3', '789'], ['bytes=8-', '89']]) {
    const response = await get(range);
    assert.equal(response.status, 206);
    assert.equal(await response.text(), expected);
  }
  for (const range of ['bytes=50-', 'bytes=-0', 'bytes=4-2', 'bytes=0-1,3-4']) assert.equal((await get(range)).status, 416);
  assert.equal((await get(null, '../secret.mp4')).status, 404);
});

test('local uploads are readable through the media route', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'rahultech-media-'));
  try {
    const { AzureStorageClient } = load('lib/azure/storage.ts', {}, {}, undefined, directory);
    const uploaded = await AzureStorageClient.uploadBlob(Buffer.from('image bytes'), 'cover.png', 'image/png');
    assert.equal(uploaded.url, '/api/media/cover.png');
    const { GET } = load('app/api/media/[name]/route.ts', { '@/lib/azure/storage': { AzureStorageClient } }, {}, undefined, directory);
    const response = await GET(new Request(`https://example.test${uploaded.url}`), { params: Promise.resolve({ name: 'cover.png' }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(await response.text(), 'image bytes');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('YouTube sync validates channel input, paginates public playlists and stores metadata without the API key', async () => {
  const stored = [];
  const calls = [];
  const channelId = `UC${'a'.repeat(22)}`;
  const DataService = { isDatabaseConfigured: () => true, updateItem: async () => null, createItem: async (_type, value) => stored.push(value), listItems: async () => stored };
  const { channelQuery, YouTubeService } = load('services/YouTubeService.ts', { './DataService': { DataService } }, { YOUTUBE_API_KEY: 'test-only-key' }, async (url, options) => {
    calls.push(url);
    assert.equal(new URL(url).hostname, 'www.googleapis.com');
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-only-key');
    if (url.includes('/channels?')) return Response.json({ items: [{ id: channelId, snippet: { title: 'My channel' }, contentDetails: { relatedPlaylists: { uploads: 'uploads-id' } } }] });
    return Response.json({ ...(url.includes('pageToken') ? {} : { nextPageToken: 'next' }), items: [{ id: `playlist-${calls.length}`, snippet: { title: 'A playlist' }, contentDetails: { itemCount: 3 } }] });
  });
  assert.equal(channelQuery('https://www.youtube.com/@example/videos').forHandle, '@example');
  assert.equal(channelQuery(channelId).id, channelId);
  assert.throws(() => channelQuery('https://other.example/@channel'));
  assert.throws(() => channelQuery('my password'));
  const snapshot = await YouTubeService.sync('@example');
  assert.equal(snapshot.playlists.length, 2);
  assert.equal(calls.length, 3);
  assert.equal(stored[0].id, 'youtube-channel');
  assert.equal(JSON.stringify(stored).includes('test-only-key'), false);
  assert.equal((await YouTubeService.getChannel()).title, 'My channel');
});