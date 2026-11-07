import { YouTubeService } from '@/services/YouTubeService';

export async function GET() {
  try {
    return Response.json({ ok: true, data: await YouTubeService.getChannel() }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return Response.json({ ok: false, error: 'Channel content is temporarily unavailable.' }, { status: 503 });
  }
}