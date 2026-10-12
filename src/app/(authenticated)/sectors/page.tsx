'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { TODAY } from '@/lib/clock';
import { regulatory as seedRegulatory } from '@/data/seed/regulatory';
import { SECTOR_PROFILES } from '@/data/sectorProfiles';
import { regulationsForSector } from '@/lib/sectorIntel';
import { GrowthBadge, LiveDot, SECTOR_ICON, useSectorFeed } from '@/components/sectors/SectorUI';
import { SectorProfile } from '@/data/sectorProfiles';
import { timeAgo } from '@/lib/sectorFeed';
import { ArrowRight, Building2, Gavel, Search, TrendingUp } from 'lucide-react';

export default function SectorIntelligencePage() {
  const { currentUser, startups: allStartups, regulatoryItems } = useStore();
  const [query, setQuery] = useState('');

  const startups = useMemo(
    () => (currentUser ? scopeStartups(currentUser, allStartups).filter((s) => !s.archived) : []),
    [currentUser, allStartups]
  );
  const regs = regulatoryItems && regulatoryItems.length > 0 ? regulatoryItems : seedRegulatory;

  if (!currentUser) return null;

  const q = query.trim().toLowerCase();
  const profiles = SECTOR_PROFILES.filter(
    (p) => !q || p.label.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <header className="flex flex-col gap-4 border-b border-[#E4E4E7] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-display tracking-tight text-zinc-950" style={{ fontSize: 'var(--type-display)' }}>
            Sector Intelligence
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-zinc-500 sm:text-sm">
            A master view of every sector we invest in: regulations, market size and health, competitor news and
            funding opportunities. Headlines refresh automatically.
          </p>
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search sectors</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sectors…"
            className="h-9 w-full rounded-lg border border-[#E4E4E7] bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </label>
      </header>

      {profiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No sectors match “{query}”.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Sectors">
          {profiles.map((p) => {
            const sectorStartups = startups.filter((s) => s.sector === p.sector);
            const { upcoming } = regulationsForSector(regs, p.sector, sectorStartups, TODAY);
            const high = upcoming.filter((r) => r.impact === 'High').length;
            return (
              <li key={p.sector}>
                <SectorTile
                  profile={p}
                  portfolioCount={sectorStartups.length}
                  upcomingCount={upcoming.length}
                  highCount={high}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SectorTile({
  profile: p,
  portfolioCount,
  upcomingCount,
  highCount,
}: {
  profile: SectorProfile;
  portfolioCount: number;
  upcomingCount: number;
  highCount: number;
}) {
  const Icon = SECTOR_ICON[p.sector];
  const headline = p.market.india[0];
  const { items, loading } = useSectorFeed(p.sector, 'market');
  const latest = items[0];

  return (
    <Link
      href={`/sectors/${p.sector}`}
      className="group flex h-full flex-col rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      aria-label={`Open ${p.label} sector master view`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${p.accent}14`, color: p.accent }}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{p.label}</h2>
            <p className="text-xs text-zinc-500">{p.tagline}</p>
          </div>
        </div>
        <ArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
          aria-hidden="true"
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Metric icon={TrendingUp} label="India market" value={headline ? headline.value : '—'} sub={headline?.period} />
        <Metric
          icon={Gavel}
          label="Upcoming regs"
          value={String(upcomingCount)}
          sub={highCount ? `${highCount} high impact` : 'none high'}
          alert={highCount > 0}
        />
        <Metric icon={Building2} label="Your startups" value={String(portfolioCount)} sub="in portfolio" />
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <GrowthBadge signal={p.market.growthSignal} />
      </div>

      <div className="mt-4 border-t border-[#F4F4F5] pt-3 text-xs">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-zinc-500">
          <LiveDot /> Latest headline
        </div>
        {loading && !latest ? (
          <div className="h-3 w-4/5 rounded bg-zinc-100 motion-safe:animate-pulse" aria-label="Loading headline" />
        ) : latest ? (
          <p className="line-clamp-2 text-zinc-800">
            {latest.title}
            <span className="text-zinc-400"> · {latest.source}{latest.publishedAt ? `, ${timeAgo(latest.publishedAt)}` : ''}</span>
          </p>
        ) : (
          <p className="text-zinc-400">Open the sector to see live news.</p>
        )}
      </div>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#FAFAFA] px-2.5 py-2">
      <dt className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        <Icon className="h-3 w-3" aria-hidden="true" /> {label}
      </dt>
      <dd className={`mt-0.5 truncate text-base font-bold ${alert ? 'text-red-600' : 'text-zinc-900'}`}>{value}</dd>
      {sub && <dd className="truncate text-[10px] text-zinc-400">{sub}</dd>}
    </div>
  );
}
