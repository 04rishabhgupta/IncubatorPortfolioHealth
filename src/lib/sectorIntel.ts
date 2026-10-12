import { RegulatoryItem, Sector, Startup } from '@/types';

export type ImpactLevel = 'High' | 'Medium' | 'Low' | 'Opportunity';

export interface ScoredRegulation {
  item: RegulatoryItem;
  impact: ImpactLevel;
  upcoming: boolean;
  keyDate?: { label: string; date: string };
  affected: Startup[]; // portfolio startups directly covered by the item's tags
}

const DAY = 24 * 3600 * 1000;

/**
 * Impact rules (kept simple and explainable to users):
 *  - Opportunity items are shown as "Opportunity".
 *  - High: a risk that is already effective, or takes effect within 180 days.
 *  - Medium: a risk still in consultation, or notified with a later effective date.
 *  - Low: anything else (e.g. indirect-only relevance).
 */
export function scoreRegulation(item: RegulatoryItem, sector: Sector, startups: Startup[], today: string): ScoredRegulation {
  const now = new Date(today).getTime();
  const effective = item.effectiveOn ? new Date(item.effectiveOn).getTime() : null;
  const closes = item.consultationClosesOn ? new Date(item.consultationClosesOn).getTime() : null;

  const upcoming = item.status === 'CONSULTATION' || (effective !== null && effective > now);

  let impact: ImpactLevel;
  if (item.kind === 'OPPORTUNITY') impact = 'Opportunity';
  else if (item.status === 'EFFECTIVE' || (effective !== null && effective - now <= 180 * DAY)) impact = 'High';
  else if (item.status === 'CONSULTATION' || item.status === 'NOTIFIED') impact = 'Medium';
  else impact = 'Low';

  // Indirect-only relevance (sector not directly regulated) is capped at Low.
  if (impact !== 'Opportunity' && !item.sectors.includes(sector)) impact = 'Low';

  let keyDate: ScoredRegulation['keyDate'];
  if (item.status === 'CONSULTATION' && closes !== null && closes > now) {
    keyDate = { label: 'Consultation closes', date: item.consultationClosesOn! };
  } else if (effective !== null && effective > now) {
    keyDate = { label: 'Takes effect', date: item.effectiveOn! };
  } else if (item.effectiveOn) {
    keyDate = { label: 'Effective since', date: item.effectiveOn };
  } else {
    keyDate = { label: 'Published', date: item.publishedOn };
  }

  const tags = new Set(item.directTags);
  const affected = startups.filter(
    (s) => s.sector === sector && (tags.size === 0 || (s.regTags || []).some((t) => tags.has(t)))
  );

  return { item, impact, upcoming, keyDate, affected };
}

const IMPACT_RANK: Record<ImpactLevel, number> = { High: 0, Medium: 1, Opportunity: 2, Low: 3 };

export function regulationsForSector(
  items: RegulatoryItem[],
  sector: Sector,
  startups: Startup[],
  today: string
): { latest: ScoredRegulation[]; upcoming: ScoredRegulation[] } {
  const relevant = items
    .filter((i) => i.sectors.includes(sector))
    .map((i) => scoreRegulation(i, sector, startups, today));

  const byImpactThenDate = (a: ScoredRegulation, b: ScoredRegulation) =>
    IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || (a.keyDate?.date || '').localeCompare(b.keyDate?.date || '');

  return {
    upcoming: relevant.filter((r) => r.upcoming).sort(byImpactThenDate),
    latest: relevant
      .filter((r) => !r.upcoming)
      .sort((a, b) => b.item.publishedOn.localeCompare(a.item.publishedOn)),
  };
}

export function fmtDate(d?: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
