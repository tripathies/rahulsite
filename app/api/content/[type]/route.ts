import { NextResponse } from 'next/server';
import { DataService } from '@/services/DataService';
import { adventureFixtures, blogFixtures, projectFixtures, videoFixtures } from '@/lib/fixtures';

const defaults = {
  blogs: blogFixtures,
  adventures: adventureFixtures,
  projects: projectFixtures,
  videos: videoFixtures,
  about: [],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!Object.hasOwn(defaults, type)) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }
  const contentType = type as keyof typeof defaults;
  if (!DataService.isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, data: defaults[contentType], source: 'fixtures' });
  }
  try {
    const items = await DataService.listItems(contentType);
    const data = items.filter((item) => item.isPublished !== false).map((item) => {
      const publicItem = { ...item };
      delete publicItem._id;
      return publicItem;
    });
    return NextResponse.json({ ok: true, data, source: 'cosmos' }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Content is temporarily unavailable.' }, { status: 503 });
  }
}