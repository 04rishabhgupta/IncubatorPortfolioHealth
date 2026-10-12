import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSectorProfile } from '@/data/sectorProfiles';
import {
  buildFeedQuery,
  FEED_TOPICS,
  FeedTopic,
  filterRelevant,
  googleNewsRssUrl,
  googleNewsWebUrl,
  parseRss,
  dailyCounts,
} from '@/lib/sectorFeed';

// Feeds are cached per sector+topic for 15 minutes so every user sees fresh data
// without the app hammering the upstream feed.
const REVALIDATE_SECONDS = 900;

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector') || '';
  const topic = (req.nextUrl.searchParams.get('topic') || '') as FeedTopic;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = getSectorProfile(sector);
  if (!profile || !FEED_TOPICS.includes(topic)) {
    return NextResponse.json({ error: 'Unknown sector or topic' }, { status: 400 });
  }

  const query = buildFeedQuery(profile, topic);
  const webUrl = googleNewsWebUrl(query);

  try {
    const res = await fetch(googleNewsRssUrl(query), {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { 'User-Agent': 'Mozilla/5.0 (FolioOS Sector Intelligence)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Feed returned ${res.status}`);
    const xml = await res.text();
    const relevant = filterRelevant(parseRss(xml, 100), profile, topic);
    return NextResponse.json({
      items: relevant.slice(0, 8),
      daily: dailyCounts(relevant, 30),
      total: relevant.length,
      fetchedAt: new Date().toISOString(),
      webUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        items: [],
        daily: [],
        total: 0,
        fetchedAt: new Date().toISOString(),
        webUrl,
        error: err instanceof Error ? err.message : 'Live feed unavailable',
      },
      { status: 200 }
    );
  }
}
