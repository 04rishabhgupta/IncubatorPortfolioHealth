'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Sector } from '@/types';
import { ScoredRegulation } from '@/lib/sectorIntel';
import { useSectorFeed } from '@/components/sectors/SectorUI';

/*
 * Colours come from the Folio OS palette (same hexes used across the app):
 *   red #DC2626 (critical / high impact) · blue-600 #2563EB (primary) · amber #D97706 (watch / medium)
 * Validated with the dataviz palette validator (light surface): all checks pass when stacked in the
 * order High → Opportunity → Medium, which keeps red and amber from touching. Every chart also has a
 * legend and a table view.
 */
export const IMPACT_COLORS = { High: '#DC2626', Opportunity: '#2563EB', Medium: '#D97706' } as const;
const SERIES_BLUE = '#2563EB';
const GRID = '#E4E4E7';
const AXIS_TICK = { fontSize: 11, fill: '#71717A' };

const impactConfig = {
  High: { label: 'High impact', color: IMPACT_COLORS.High },
  Opportunity: { label: 'Opportunity', color: IMPACT_COLORS.Opportunity },
  Medium: { label: 'Medium impact', color: IMPACT_COLORS.Medium },
} satisfies ChartConfig;

type ImpactKey = keyof typeof IMPACT_COLORS;
// Stack order matters: blue sits between red and amber.
const IMPACT_KEYS: ImpactKey[] = ['High', 'Opportunity', 'Medium'];

// ---------------------------------------------------------------------------
// Shared chrome: card, legend, table view
// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  description,
  children,
  table,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  table?: { columns: string[]; rows: (string | number)[][] };
}) {
  return (
    <figure className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
      <figcaption>
        <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </figcaption>
      <div className="mt-3">{children}</div>
      {table && table.rows.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer select-none rounded font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            View as table
          </summary>
          <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-[#E4E4E7]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#FAFAFA] text-zinc-500">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-3 py-1.5 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-zinc-800">
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j} className={`px-3 py-1.5 ${j > 0 ? 'tabular-nums' : ''}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#E4E4E7] text-xs text-zinc-500">
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Live headline volume per day (sector page)
// ---------------------------------------------------------------------------

const volumeConfig = { count: { label: 'Headlines', color: SERIES_BLUE } } satisfies ChartConfig;

function shortDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function HeadlineVolumeChart({ sector }: { sector: Sector }) {
  const { daily, total, loading } = useSectorFeed(sector, 'market');
  const data = useMemo(() => daily.map((d) => ({ ...d, label: shortDate(d.date) })), [daily]);
  const peak = data.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <ChartCard
      title="News momentum"
      description={`Relevant market headlines per day, last 30 days${total ? ` · ${total} in total` : ''}. Live.`}
      table={{ columns: ['Date', 'Headlines'], rows: data.filter((d) => d.count > 0).map((d) => [d.label, d.count]) }}
    >
      {loading && data.length === 0 ? (
        <div className="h-48 rounded-xl bg-zinc-50 motion-safe:animate-pulse" aria-label="Loading chart" />
      ) : peak === 0 ? (
        <EmptyChart text="No relevant headlines in the last 30 days." />
      ) : (
        <ChartContainer config={volumeConfig} className="aspect-auto h-48 w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={6} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={{ fill: '#F4F4F5' }} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// 2. Regulatory calendar: key dates in the next 12 months (sector page)
// ---------------------------------------------------------------------------

export function RegulatoryCalendarChart({ upcoming, today }: { upcoming: ScoredRegulation[]; today: string }) {
  const data = useMemo(() => {
    const start = new Date(today);
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: `${d.toLocaleDateString('en-IN', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`,
        High: 0,
        Medium: 0,
        Opportunity: 0,
      };
    });
    for (const r of upcoming) {
      if (!r.keyDate || r.impact === 'Low') continue;
      const m = months.find((x) => x.key === r.keyDate!.date.slice(0, 7));
      if (m) m[r.impact as ImpactKey] += 1;
    }
    return months;
  }, [upcoming, today]);

  const total = data.reduce((n, d) => n + d.High + d.Medium + d.Opportunity, 0);

  return (
    <ChartCard
      title="Regulatory calendar"
      description="When upcoming rules take effect or close consultation, next 12 months."
      table={{
        columns: ['Month', 'High', 'Opportunity', 'Medium'],
        rows: data.filter((d) => d.High + d.Medium + d.Opportunity > 0).map((d) => [d.month, d.High, d.Opportunity, d.Medium]),
      }}
    >
      {total === 0 ? (
        <EmptyChart text="No key regulatory dates in the next 12 months." />
      ) : (
        <ChartContainer config={impactConfig} className="aspect-auto h-48 w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={{ fill: '#F4F4F5' }} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent className="text-zinc-700" />} />
            {IMPACT_KEYS.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                name={impactConfig[k].label}
                stackId="cal"
                fill={`var(--color-${k})`}
                stroke="#FFFFFF"
                strokeWidth={2}
                radius={i === IMPACT_KEYS.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={22}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// 3. Health of our startups in the sector (sector page, 2+ startups)
// ---------------------------------------------------------------------------

const healthConfig = { health: { label: 'Health score', color: SERIES_BLUE } } satisfies ChartConfig;

export function PortfolioHealthChart({ data }: { data: { name: string; health: number }[] }) {
  return (
    <ChartCard
      title="Health of our startups"
      description="Latest health score out of 100 (75+ is healthy)."
      table={{ columns: ['Startup', 'Health'], rows: data.map((d) => [d.name, d.health]) }}
    >
      <ChartContainer config={healthConfig} className="aspect-auto w-full" style={{ height: Math.max(120, data.length * 36) }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={140} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <ChartTooltip cursor={{ fill: '#F4F4F5' }} content={<ChartTooltipContent hideIndicator />} />
          <Bar
            dataKey="health"
            fill="var(--color-health)"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            label={{ position: 'right', fontSize: 11, fill: '#3F3F46' }}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// 4. Live coverage by topic, last 30 days (sector page)
// ---------------------------------------------------------------------------

const topicConfig = { headlines: { label: 'Headlines', color: SERIES_BLUE } } satisfies ChartConfig;

export function CoverageByTopicChart({ sector }: { sector: Sector }) {
  const market = useSectorFeed(sector, 'market');
  const regulation = useSectorFeed(sector, 'regulation');
  const funding = useSectorFeed(sector, 'funding');
  const competitors = useSectorFeed(sector, 'competitors');
  const loading = market.loading || regulation.loading || funding.loading || competitors.loading;

  const data = [
    { topic: 'Market', headlines: market.total },
    { topic: 'Regulation', headlines: regulation.total },
    { topic: 'Funding', headlines: funding.total },
    { topic: 'Competitors', headlines: competitors.total },
  ];
  const total = data.reduce((n, d) => n + d.headlines, 0);

  return (
    <ChartCard
      title="Coverage by topic"
      description="Relevant headlines per topic in the last 30 days. Live."
      table={{ columns: ['Topic', 'Headlines'], rows: data.map((d) => [d.topic, d.headlines]) }}
    >
      {loading && total === 0 ? (
        <div className="h-48 rounded-xl bg-zinc-50 motion-safe:animate-pulse" aria-label="Loading chart" />
      ) : total === 0 ? (
        <EmptyChart text="No relevant headlines in the last 30 days." />
      ) : (
        <ChartContainer config={topicConfig} className="aspect-auto h-48 w-full">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="topic" width={84} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={{ fill: '#F4F4F5' }} content={<ChartTooltipContent hideIndicator />} />
            <Bar
              dataKey="headlines"
              fill="var(--color-headlines)"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              label={{ position: 'right', fontSize: 11, fill: '#3F3F46' }}
            />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
