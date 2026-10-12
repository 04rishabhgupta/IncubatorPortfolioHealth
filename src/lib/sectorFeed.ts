import { SectorProfile } from '@/data/sectorProfiles';

export type FeedTopic = 'market' | 'regulation' | 'funding' | 'competitors';

export const FEED_TOPICS: FeedTopic[] = ['market', 'regulation', 'funding', 'competitors'];

export interface FeedItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null; // ISO
}

/** Builds the live search phrase for a sector + topic. All queries are scoped to the last 30 days. */
export function buildFeedQuery(profile: SectorProfile, topic: FeedTopic): string {
  const kw = `(${profile.keywords})`;
  switch (topic) {
    case 'market':
      return `${kw} India market when:30d`;
    case 'regulation':
      return `${kw} India (regulation OR guidelines OR notification OR rules OR policy OR draft) when:30d`;
    case 'funding':
      return `${kw} India startup (funding OR grant OR "call for proposals" OR raises OR scheme) when:30d`;
    case 'competitors':
      return `(${profile.competitors.map((c) => `"${c}"`).join(' OR ')}) when:30d`;
  }
}

export function googleNewsRssUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

/** Human-browsable version of the same search, used as "View all" / fallback link. */
export function googleNewsWebUrl(query: string): string {
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
}

const BLOCKED_SOURCES = /instagram|facebook|youtube|linkedin|twitter|^x$|threads/i;
const GENERIC_TITLES = /^(business news|latest news|news|top stories|headlines)$/i;

/**
 * Keeps only headlines that are actually about the sector (or, for competitors, about a
 * tracked company), and drops social-media reposts and generic index pages.
 */
export function filterRelevant(items: FeedItem[], profile: SectorProfile, topic: FeedTopic): FeedItem[] {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const terms =
    topic === 'competitors'
      ? profile.competitors.flatMap((c) => {
          // Match the full name, plus the first word when it is distinctive (e.g. "Tricog" for "Tricog Health").
          const first = c.split(' ')[0];
          const res = [new RegExp(escape(c), 'i')];
          if (c.includes(' ') && first.length >= 6 && !/^(quick|tata)$/i.test(first)) res.push(new RegExp(`\\b${escape(first)}\\b`, 'i'));
          return res;
        })
      : profile.matchTerms.map((t) => new RegExp(t, 'i'));
  return items.filter(
    (it) =>
      !BLOCKED_SOURCES.test(it.source) &&
      !GENERIC_TITLES.test(it.title.trim()) &&
      terms.some((re) => re.test(it.title))
  );
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

/** Minimal RSS 2.0 parser for Google News search feeds. No dependencies. */
export function parseRss(xml: string, limit = 100): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    let title = tag(block, 'title');
    const link = tag(block, 'link');
    const source = tag(block, 'source');
    const pub = tag(block, 'pubDate');
    if (!title || !link) continue;
    // Google News appends " - Source Name" to titles; drop it when it matches the source.
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const date = pub ? new Date(pub) : null;
    items.push({
      title,
      link,
      source: source || 'News',
      publishedAt: date && !isNaN(date.getTime()) ? date.toISOString() : null,
    });
  }
  items.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return items.slice(0, limit);
}

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Headline volume per day for the last `days` days (oldest first), including zero days. */
export function dailyCounts(items: FeedItem[], days = 30, now: number = Date.now()): DailyCount[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(new Date(now - i * 86400000).toISOString().slice(0, 10), 0);
  }
  for (const it of items) {
    if (!it.publishedAt) continue;
    const key = it.publishedAt.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets, ([date, count]) => ({ date, count }));
}

/** "3h ago", "2d ago" — relative to `now`. */
export function timeAgo(iso: string | null, now: number = Date.now()): string {
  if (!iso) return '';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
