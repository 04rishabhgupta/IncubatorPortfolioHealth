'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { TODAY } from '@/lib/clock';
import { regulatory as seedRegulatory } from '@/data/seed/regulatory';
import { CROSS_SECTOR_FUNDING, FundingScheme, getSectorProfile, MarketFigure, researchLink } from '@/data/sectorProfiles';
import { fmtDate, regulationsForSector, ScoredRegulation } from '@/lib/sectorIntel';
import { getStartupHealth, getStartupRedFlags } from '@/lib/oversight';
import { ExtLink, GrowthBadge, ImpactBadge, LiveDot, LiveFeed, SECTOR_ICON } from '@/components/sectors/SectorUI';
import {
  CoverageByTopicChart,
  HeadlineVolumeChart,
  PortfolioHealthChart,
  RegulatoryCalendarChart,
} from '@/components/sectors/SectorCharts';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Gavel,
  Globe2,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const SECTIONS = [
  { id: 'charts', label: 'At a glance' },
  { id: 'regulations', label: 'Regulations' },
  { id: 'market', label: 'Market' },
  { id: 'competitors', label: 'News & competitors' },
  { id: 'funding', label: 'Funding' },
  { id: 'portfolio', label: 'Our startups' },
];

export default function SectorMasterView() {
  const params = useParams();
  const sectorParam = String(params.sector || '').toUpperCase();
  const profile = getSectorProfile(sectorParam);

  const {
    currentUser,
    startups: allStartups,
    regulatoryItems,
    metrics,
    assessments,
    milestones,
    dataRequests,
    submissions,
  } = useStore();

  const startups = useMemo(
    () =>
      currentUser && profile
        ? scopeStartups(currentUser, allStartups).filter((s) => !s.archived && s.sector === profile.sector)
        : [],
    [currentUser, allStartups, profile]
  );

  const regs = regulatoryItems && regulatoryItems.length > 0 ? regulatoryItems : seedRegulatory;
  const { latest, upcoming } = useMemo(
    () => (profile ? regulationsForSector(regs, profile.sector, startups, TODAY) : { latest: [], upcoming: [] }),
    [regs, profile, startups]
  );

  const portfolio = useMemo(() => {
    const ruleData = { metrics, assessments, milestones, dataRequests, submissions };
    return startups.map((s) => ({
      startup: s,
      health: getStartupHealth(s, assessments),
      flags: getStartupRedFlags(s, ruleData, TODAY).length,
    }));
  }, [startups, metrics, assessments, milestones, dataRequests, submissions]);

  if (!currentUser) return null;

  const healthChart = portfolio
    .filter((p) => p.health)
    .map((p) => ({ name: p.startup.name.replace(/ Private Limited$/i, ''), health: p.health!.total }))
    .sort((a, b) => a.health - b.health);

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Sector not found</h1>
        <Link href="/sectors" className="text-sm font-semibold text-blue-700 hover:underline">
          Back to Sector Intelligence
        </Link>
      </div>
    );
  }

  const Icon = SECTOR_ICON[profile.sector];
  const scored = portfolio.filter((p) => p.health);
  const avgHealth = scored.length ? Math.round(scored.reduce((n, p) => n + (p.health?.total || 0), 0) / scored.length) : null;
  const highUpcoming = upcoming.filter((r) => r.impact === 'High').length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div>
        <Link
          href="/sectors"
          className="inline-flex items-center gap-1 rounded text-xs font-semibold text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All sectors
        </Link>
        <header className="mt-3 flex flex-col gap-4 border-b border-[#E4E4E7] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${profile.accent}14`, color: profile.accent }}
              aria-hidden="true"
            >
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <h1 className="heading-display tracking-tight text-zinc-950" style={{ fontSize: 'var(--type-display)' }}>
                {profile.label}
              </h1>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{profile.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <LiveDot /> Live headlines refresh every 10 minutes
          </div>
        </header>
      </div>

      {/* Jump navigation */}
      <nav
        aria-label="Sections on this page"
        className="sticky top-16 z-30 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white/95 p-1 backdrop-blur"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Snapshot */}
      <section aria-label="Sector snapshot" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="India market"
          value={profile.market.india[0]?.value || 'Not tracked yet'}
          sub={profile.market.india[0] ? `${profile.market.india[0].period} · ${profile.market.india[0].source}` : undefined}
        />
        <Kpi
          icon={Globe2}
          label="Global market"
          value={profile.market.global[0]?.value || 'Not tracked yet'}
          sub={profile.market.global[0] ? `${profile.market.global[0].period} · ${profile.market.global[0].source}` : undefined}
        />
        <Kpi
          icon={Gavel}
          label="Upcoming regulations"
          value={String(upcoming.length)}
          sub={highUpcoming ? `${highUpcoming} high impact` : 'No high-impact items'}
          tone={highUpcoming ? 'red' : undefined}
        />
        <Kpi
          icon={Building2}
          label="Our startups here"
          value={String(startups.length)}
          sub={avgHealth !== null ? `Avg health ${avgHealth}/100` : 'No health scores yet'}
        />
      </section>

      {/* Charts */}
      <Section id="charts" icon={BarChart3} title="At a glance" subtitle={`Live and tracked signals for ${profile.label}.`}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <HeadlineVolumeChart sector={profile.sector} />
          <CoverageByTopicChart sector={profile.sector} />
          <RegulatoryCalendarChart upcoming={upcoming} today={TODAY} />
          {healthChart.length >= 2 ? (
            <PortfolioHealthChart data={healthChart} />
          ) : (
            <div className="flex flex-col justify-center rounded-2xl border border-[#E4E4E7] bg-white p-4">
              <h3 className="text-sm font-bold text-zinc-900">Health of our startups</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {healthChart.length === 1
                  ? `${healthChart[0].name} scores ${healthChart[0].health}/100. A comparison chart appears once two or more startups in this sector have scores.`
                  : 'No health scores for startups in this sector yet.'}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Regulations */}
      <Section id="regulations" icon={Gavel} title="Regulations" subtitle="What is changing, when, and which of our startups it touches.">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <RegList
            title="Upcoming regulations"
            icon={CalendarClock}
            items={upcoming}
            empty="No upcoming regulations tracked for this sector."
          />
          <RegList title="Latest in force" icon={CheckCircle2} items={latest} empty="No recent regulations tracked." />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-4 lg:col-span-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <Landmark className="h-4 w-4 text-zinc-500" aria-hidden="true" /> Key regulators
            </h3>
            <ul className="mt-3 space-y-3">
              {profile.regulators.map((r) => (
                <li key={r.name} className="text-xs">
                  <ExtLink href={r.url}>{r.name}</ExtLink>
                  <p className="mt-0.5 text-zinc-500">{r.role}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <LiveFeed
              sector={profile.sector}
              topic="regulation"
              title="Live regulatory updates"
              description="Policy, rules and draft notifications in the news (last 30 days)."
            />
          </div>
        </div>
      </Section>

      {/* Market */}
      <Section id="market" icon={TrendingUp} title="Market" subtitle="Size of the opportunity in India and globally, and how healthy the market is right now.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FigureCard title="India (TAM)" figures={profile.market.india} research={researchLink(profile, 'India')} />
          <FigureCard title="Global (TAM)" figures={profile.market.global} research={researchLink(profile, 'global')} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Market health</h3>
              <GrowthBadge signal={profile.market.growthSignal} />
            </div>
            <h4 className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Tailwinds
            </h4>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-zinc-700">
              {profile.market.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <h4 className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" /> Headwinds
            </h4>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-zinc-700">
              {profile.market.headwinds.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-zinc-400">FITT analyst view · reviewed {profile.market.asOf}</p>
          </div>
          <div className="lg:col-span-2">
            <LiveFeed
              sector={profile.sector}
              topic="market"
              title="Live market news"
              description="Demand, deals and market moves in the sector (last 30 days)."
            />
          </div>
        </div>
      </Section>

      {/* Competitors */}
      <Section id="competitors" icon={Building2} title="News & competitors" subtitle="What notable players in this space are doing.">
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
          <h3 className="text-sm font-bold text-zinc-900">Companies we track</h3>
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="Tracked companies">
            {profile.competitors.map((c) => (
              <li key={c}>
                <Badge variant="outline" className="text-xs font-medium">
                  {c}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <LiveFeed
          sector={profile.sector}
          topic="competitors"
          title="Live competitor news"
          description="Launches, funding rounds and partnerships from the companies above (last 30 days)."
          limit={8}
        />
      </Section>

      {/* Funding */}
      <Section id="funding" icon={Wallet} title="Funding opportunities" subtitle="Government schemes to apply for, plus the latest funding calls and deals.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <SchemeList title={`${profile.shortLabel} schemes`} schemes={profile.funding} />
            <SchemeList title="Open to all sectors" schemes={CROSS_SECTOR_FUNDING} />
          </div>
          <div className="lg:col-span-2">
            <LiveFeed
              sector={profile.sector}
              topic="funding"
              title="Live funding calls & deals"
              description="New grants, calls for proposals and funding rounds (last 30 days)."
              limit={8}
            />
          </div>
        </div>
      </Section>

      {/* Our startups */}
      <Section id="portfolio" icon={Building2} title="Our startups in this sector" subtitle="Startups you can access in this sector, with their current health.">
        {portfolio.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-xs text-zinc-500">
            None of your startups are in this sector yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {portfolio.map(({ startup, health, flags }) => (
              <li key={startup.id}>
                <Link
                  href={`/startups/${startup.id}`}
                  className="block rounded-2xl border border-[#E4E4E7] bg-white p-4 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div className="truncate text-sm font-semibold text-zinc-900">{startup.name}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{startup.oneLiner}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-600">
                      Health <b className="text-zinc-900">{health ? `${health.total}/100` : '—'}</b>
                    </span>
                    {health && <Badge variant="outline" className="text-[10px]">{health.band.replace('_', ' ')}</Badge>}
                    <span className={`inline-flex items-center gap-1 ${flags ? 'text-red-700' : 'text-green-700'}`}>
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      {flags} red flag{flags === 1 ? '' : 's'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  icon: typeof Gavel;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 space-y-4">
      <div>
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
          <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" /> {title}
        </h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Gavel;
  label: string;
  value: string;
  sub?: string;
  tone?: 'red';
}) {
  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </div>
      <div className={`mt-1 text-xl font-bold ${tone === 'red' ? 'text-red-600' : 'text-zinc-900'}`}>{value}</div>
      {sub && <div className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}

function RegList({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: typeof Gavel;
  items: ScoredRegulation[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white">
      <h3 className="flex items-center gap-2 border-b border-[#E4E4E7] px-4 py-3 text-sm font-bold text-zinc-900">
        <Icon className="h-4 w-4 text-zinc-500" aria-hidden="true" /> {title}
        <span className="ml-auto text-xs font-medium text-zinc-400">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-zinc-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-[#F4F4F5]">
          {items.map((r) => (
            <li key={r.item.id} className="space-y-1.5 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <ImpactBadge level={r.impact} />
                <span className="text-[11px] font-medium text-zinc-500">
                  {r.item.authority} · {r.item.status.charAt(0) + r.item.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-[13px] font-semibold leading-snug text-zinc-900">{r.item.title}</p>
              <p className="text-xs text-zinc-600">{r.item.summary}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                {r.keyDate && (
                  <span>
                    {r.keyDate.label}: <b className="text-zinc-800">{fmtDate(r.keyDate.date)}</b>
                  </span>
                )}
                <span>
                  Affects{' '}
                  <b className="text-zinc-800">
                    {r.affected.length ? r.affected.map((s) => s.name).join(', ') : 'none of our startups'}
                  </b>
                </span>
              </div>
              {r.item.whatToCheck?.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer select-none font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded">
                    What to check with founders
                  </summary>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-zinc-600">
                    {r.item.whatToCheck.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FigureCard({ title, figures, research }: { title: string; figures: MarketFigure[]; research: string }) {
  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      {figures.length === 0 ? (
        <div className="mt-3 text-xs text-zinc-500">
          Not tracked yet. No verified figure has been added for this market.{' '}
          <ExtLink href={research}>Research latest reports</ExtLink>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {figures.map((f) => (
            <li key={f.label} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-zinc-600">{f.label}</div>
                <div className="text-[11px] text-zinc-400">
                  Source: <ExtLink href={f.url}>{f.source}</ExtLink>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-bold text-zinc-900">{f.value}</div>
                <div className="text-[11px] text-zinc-500">{f.period}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SchemeList({ title, schemes }: { title: string; schemes: FundingScheme[] }) {
  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      <ul className="mt-3 space-y-3">
        {schemes.map((s) => (
          <li key={s.name} className="text-xs">
            <div className="font-semibold text-zinc-900">{s.name}</div>
            <div className="text-[11px] text-zinc-500">{s.body}</div>
            <p className="mt-1 text-zinc-600">{s.what}</p>
            <ExtLink href={s.url} className="mt-1 text-[11px]">
              Visit official site
            </ExtLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
