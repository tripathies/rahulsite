import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/DataService';
import { getAdminSession } from '@/lib/auth';
import { contentSchemas, type ContentType } from '@/lib/content';
import { randomUUID } from 'node:crypto';
import { toMediaUrls } from '@/lib/mediaUrl';
import {
  adventureFixtures,
  blogFixtures,
  projectFixtures,
  videoFixtures,
} from '@/lib/fixtures';

const fixtureMap = {
  blogs: blogFixtures,
  adventures: adventureFixtures,
  projects: projectFixtures,
  videos: videoFixtures,
  settings: [],
  about: [],
};

function normalizePayload(type: string, payload: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    ...payload,
    id: typeof payload.id === 'string' && payload.id ? payload.id : `${type}-${randomUUID()}`,
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  if (!DataService.isSupportedDataType(type)) {
    return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 });
  }

  if (!DataService.isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, data: fixtureMap[type], source: 'fixtures', isPlaceholder: true });
  }

  try {
    const data = toMediaUrls(await DataService.listItems(type));
    return NextResponse.json({ ok: true, data, source: 'cosmos' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: 'Cosmos DB is unavailable. ' + (err?.message || 'Unknown error') }, { status: 503 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  // Defense-in-depth: verify admin session even though middleware guards this route
  const session = await getAdminSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = await params;

  if (!DataService.isSupportedDataType(type)) {
    return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 });
  }

  if (!DataService.isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Database not configured. Set Cosmos DB environment variables.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const schema = contentSchemas[type as ContentType];
  const parsed = schema?.safeParse(body);
  if (schema && !parsed?.success) {
    return NextResponse.json({ ok: false, error: parsed?.error?.issues[0]?.message ?? 'Invalid content' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: 'Invalid content' }, { status: 400 });
  }
  const created = normalizePayload(type, parsed?.success ? parsed.data : body);

  try {
    const existing = await DataService.listItems(type);
    if (existing.some((item) => item.id === created.id || (created.slug && item.slug === created.slug))) {
      return NextResponse.json({ ok: false, error: 'An item with this slug or ID already exists.' }, { status: 409 });
    }
    const data = await DataService.createItem(type, created);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'Database insert failed: ' + (err?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
