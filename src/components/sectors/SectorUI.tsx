'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sector } from '@/types';
import { DailyCount, FeedItem, FeedTopic, timeAgo } from '@/lib/sectorFeed';
import { ImpactLevel } from '@/lib/sectorIntel';
import {
  Atom,
  Brain,
  Cpu,
  ExternalLink,
  HeartPulse,
  Plane,
  RefreshCw,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from 'lucide-react';

export const SECTOR_ICON: Record<Sector, LucideIcon> = {
  MEDTECH: HeartPulse,
  AGRITECH: Sprout,
  AI_ML: Brain,
  CYBERSECURITY: ShieldCheck,
  UAV: Plane,
  SEMICONDUCTOR: Cpu,
  ADVANCED_MATERIALS: Atom,
};

const IMPACT_STYLE: Record<ImpactLevel, string> = {
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  Opportunity: 'bg-blue-50 text-blue-700 border-blue-200',
};

/** Impact is always conveyed with text, never colour alone. */
export function ImpactBadge({ level }: { level: ImpactLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${IMPACT_STYLE[level]}`}
    >
      {level === 'Opportunity' ? 'Opportunity' : `${level} impact`}
    </span>
  );
}

export function GrowthBadge({ signal }: { signal: 'Strong' | 'Steady' | 'Cautious' }) {
  const cls =
    signal === 'Strong'
      ? 'bg-green-50 text-green-700 border-green-200'
      : signal === 'Steady'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {signal} growth
    </span>
  );
}

export function LiveDot() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
    </span>
  );
}

interface FeedState {
  items: FeedItem[];
  daily: DailyCount[];
  total: number;
  fetchedAt: string | null;
  webUrl: string | null;
  error: string | null;
  loading: boolean;
}

const POLL_MS = 10 * 60 * 1000;

/** Fetches a live feed and refreshes it every 10 minutes while the page is open. */
export function useSectorFeed(sector: Sector, topic: FeedTopic) {
  const [state, setState] = useState<FeedState>({ items: [], daily: [], total: 0, fetchedAt: null, webUrl: null, error: null, loading: true });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`/api/sector-intel?sector=${sector}&topic=${topic}`, { cache: 'no-store' });
      const json = await res.json();
      setState({
        items: json.items || [],
        daily: json.daily || [],
        total: json.total || 0,
        fetchedAt: json.fetchedAt || new Date().toISOString(),
        webUrl: json.webUrl || null,
        error: json.error || (res.ok ? null : 'Live feed unavailable'),
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Live feed unavailable' }));
    }
  }, [sector, topic]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { ...state, reload: load };
}

export function LiveFeed({
  sector,
  topic,
  title,
  description,
  limit = 6,
}: {
  sector: Sector;
  topic: FeedTopic;
  title: string;
  description?: string;
  limit?: number;
}) {
  const { items, fetchedAt, webUrl, error, loading, reload } = useSectorFeed(sector, topic);
  const headingId = `feed-${topic}`;

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-[#E4E4E7] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[#E4E4E7] px-4 py-3">
        <div>
          <h3 id={headingId} className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <LiveDot /> {title}
          </h3>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {fetchedAt && !loading && (
            <span className="hidden text-[11px] text-zinc-400 sm:inline">Updated {timeAgo(fetchedAt)}</span>
          )}
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E4E4E7] text-zinc-600 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
            aria-label={`Refresh ${title}`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'motion-safe:animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading && items.length === 0 ? (
          <ul className="divide-y divide-[#F4F4F5]" aria-label="Loading headlines">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="space-y-2 px-4 py-3">
                <div className="h-3 w-4/5 rounded bg-zinc-100 motion-safe:animate-pulse" />
                <div className="h-2.5 w-1/3 rounded bg-zinc-100 motion-safe:animate-pulse" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-zinc-500">
            {error ? 'Live headlines could not be loaded right now.' : 'No headlines in the last 30 days.'}
            {webUrl && (
              <>
                {' '}
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                >
                  Search Google News
                </a>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#F4F4F5]">
            {items.slice(0, limit).map((it) => (
              <li key={it.link}>
                <a
                  href={it.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block px-4 py-3 hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                >
                  <span className="block text-[13px] font-medium leading-snug text-zinc-900 group-hover:text-blue-700">
                    {it.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                  <span className="mt-1 block text-[11px] text-zinc-500">
                    {it.source}
                    {it.publishedAt && ` · ${timeAgo(it.publishedAt)}`}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {webUrl && items.length > 0 && (
        <div className="border-t border-[#E4E4E7] px-4 py-2 text-right">
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
          >
            View all on Google News <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
}

export function ExtLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${className}`}
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
