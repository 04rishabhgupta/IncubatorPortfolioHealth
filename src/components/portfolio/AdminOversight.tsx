'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store';
import { TODAY } from '@/lib/clock';
import { Startup, Band } from '@/types';
import {
  getStartupHealth,
  getStartupRedFlags,
  getMentorSummary,
  getRecentActivity,
  StartupHealth,
  StartupRedFlag,
  MentorEvent,
  MentorEventKind,
} from '@/lib/oversight';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  HeartPulse,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const BAND_STYLE: Record<Band, string> = {
  HEALTHY: 'bg-[#16A34A] text-white',
  WATCH: 'bg-[#D97706] text-white',
  AT_RISK: 'bg-[#EA580C] text-white',
  CRITICAL: 'bg-[#DC2626] text-white',
};

const BAND_RANK: Record<Band, number> = { CRITICAL: 0, AT_RISK: 1, WATCH: 2, HEALTHY: 3 };

const EVENT_STYLE: Record<MentorEventKind, { icon: typeof Clock; cls: string; label: string }> = {
  REQUESTED: { icon: Clock, cls: 'text-zinc-500', label: 'Requested' },
  GRANTED: { icon: CheckCircle2, cls: 'text-[#16A34A]', label: 'Granted' },
  DECLINED: { icon: XCircle, cls: 'text-[#DC2626]', label: 'Declined' },
  SESSION: { icon: MessageSquare, cls: 'text-[#2563EB]', label: 'Session' },
  CLOSED: { icon: CheckCircle2, cls: 'text-zinc-400', label: 'Closed' },
};

function fmtDate(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function HealthBadge({ health }: { health: StartupHealth | null }) {
  if (!health) return <span className="text-xs text-zinc-400">No score</span>;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-semibold text-sm text-zinc-900">{health.total}</span>
      <Badge className={`${BAND_STYLE[health.band]} text-[10px]`}>{health.band.replace('_', ' ')}</Badge>
      {health.delta !== null && health.delta !== 0 && (
        <span className={`text-[11px] ${health.delta > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
          {health.delta > 0 ? '▲' : '▼'} {Math.abs(health.delta)}
        </span>
      )}
    </div>
  );
}

// ===========================================================================
// 1. Admin Oversight — health & red flags per startup
// ===========================================================================

interface OversightRow {
  startup: Startup;
  health: StartupHealth | null;
  flags: StartupRedFlag[];
}

export function AdminOversight({ startups }: { startups: Startup[] }) {
  const { metrics, assessments, milestones, dataRequests, submissions, activityLogs } = useStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'ALL' | 'FLAGGED'>('ALL');

  const rows: OversightRow[] = useMemo(() => {
    const ruleData = { metrics, assessments, milestones, dataRequests, submissions };
    return startups
      .map((s) => ({
        startup: s,
        health: getStartupHealth(s, assessments),
        flags: getStartupRedFlags(s, ruleData, TODAY),
      }))
      .sort((a, b) => {
        // Worst health first, then most red flags
        const ra = a.health ? BAND_RANK[a.health.band] : 4;
        const rb = b.health ? BAND_RANK[b.health.band] : 4;
        if (ra !== rb) return ra - rb;
        return b.flags.length - a.flags.length;
      });
  }, [startups, metrics, assessments, milestones, dataRequests, submissions]);

  const totals = useMemo(
    () => ({
      healthy: rows.filter((r) => r.health?.band === 'HEALTHY').length,
      atRisk: rows.filter((r) => r.health && (r.health.band === 'AT_RISK' || r.health.band === 'CRITICAL')).length,
      flags: rows.reduce((n, r) => n + r.flags.length, 0),
      critical: rows.reduce((n, r) => n + r.flags.filter((f) => f.critical).length, 0),
      flaggedStartups: rows.filter((r) => r.flags.length > 0).length,
    }),
    [rows]
  );

  const visible = rows.filter((r) => (filter === 'FLAGGED' ? r.flags.length > 0 : true));
  const allOpen = visible.length > 0 && visible.every((r) => expanded[r.startup.id]);

  return (
    <Card className="shadow-xs border border-[#E4E4E7] bg-white rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#E4E4E7] pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#2563EB]" />
              Portfolio Oversight
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Health and red flags for every startup you head.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', 'FLAGGED'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                className="text-xs h-7"
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All' : 'With red flags'}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => setExpanded(allOpen ? {} : Object.fromEntries(visible.map((r) => [r.startup.id, true])))}
            >
              {allOpen ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={ShieldCheck} label="Healthy" value={totals.healthy} sub={`of ${rows.length} startups`} tone="green" />
          <Stat icon={HeartPulse} label="At risk / critical" value={totals.atRisk} tone={totals.atRisk ? 'red' : 'zinc'} />
          <Stat
            icon={AlertTriangle}
            label="Red flags"
            value={totals.flags}
            sub={`${totals.flaggedStartups} startup${totals.flaggedStartups === 1 ? '' : 's'}`}
            tone={totals.flags ? 'red' : 'zinc'}
          />
          <Stat icon={AlertTriangle} label="Critical flags" value={totals.critical} tone={totals.critical ? 'red' : 'zinc'} />
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-[#E4E4E7]">
        {visible.length === 0 && <div className="p-6 text-center text-xs text-zinc-400">No startups match this filter.</div>}
        {visible.map((r) => {
          const open = !!expanded[r.startup.id];
          const activity = open ? getRecentActivity(r.startup.id, activityLogs) : [];
          return (
            <div key={r.startup.id}>
              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [r.startup.id]: !open }))}
                className="w-full flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2 md:w-72 min-w-0">
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                  )}
                  <span className="font-semibold text-sm text-zinc-900 truncate">{r.startup.name}</span>
                </div>
                <div className="md:w-48">
                  <HealthBadge health={r.health} />
                </div>
                <div>
                  {r.flags.length ? (
                    <Badge className="bg-[#DC2626] text-white text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {r.flags.length} flag{r.flags.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <span className="text-xs text-[#16A34A] font-semibold">No flags</span>
                  )}
                </div>
              </button>

              {open && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 pb-4 pt-1 bg-zinc-50/60">
                  {/* Health */}
                  <section className="bg-white border border-[#E4E4E7] rounded-xl p-3 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                      <HeartPulse className="h-3.5 w-3.5" /> Startup health
                    </h4>
                    <HealthBadge health={r.health} />
                    {r.health ? (
                      <p className="text-[11px] text-zinc-500">
                        Source: {r.health.source}
                        {r.health.asOf ? ` · ${r.health.asOf}` : ''}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500">No approved assessment or FITT 6-month review yet.</p>
                    )}
                    {r.health?.concerns && (
                      <p className="text-xs text-zinc-700 bg-[#F4F4F5] rounded-lg p-2">
                        <b>Concerns:</b> {r.health.concerns}
                      </p>
                    )}
                    {activity.length > 0 && (
                      <div className="pt-2 border-t border-[#E4E4E7] space-y-1.5">
                        <div className="text-[11px] font-semibold text-zinc-500">Recent activity</div>
                        {activity.map((a) => (
                          <div key={a.id} className="text-[11px] text-zinc-700">
                            <span className="text-zinc-400">{fmtDate(a.at)}</span> · {a.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/startups/${r.startup.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline pt-1"
                    >
                      Open startup <ExternalLink className="h-3 w-3" />
                    </Link>
                  </section>

                  {/* Red flags */}
                  <section className="lg:col-span-2 bg-white border border-[#E4E4E7] rounded-xl p-3 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Red flags ({r.flags.length})
                    </h4>
                    {r.flags.length === 0 && <p className="text-xs text-[#16A34A]">No active red flags.</p>}
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                      {r.flags.map((f, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <span
                            className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${f.critical ? 'bg-[#DC2626]' : 'bg-[#D97706]'}`}
                          />
                          <div>
                            <span className="text-zinc-900 font-medium">{f.text}</span>
                            <span className="ml-1.5 text-[10px] text-zinc-400">{f.source}</span>
                            {f.evidence && <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-3">{f.evidence}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// 2. Mentor Activity — everything that has happened in Mentor Connect
// ===========================================================================

interface FeedEvent extends MentorEvent {
  startup: Startup;
}

export function MentorActivity({ startups }: { startups: Startup[] }) {
  const { mentorRequests, mentorMatches, mentors, users } = useStore();
  const [kind, setKind] = useState<'ALL' | MentorEventKind>('ALL');
  const [startupId, setStartupId] = useState<string>('ALL');

  const { feed, totals } = useMemo(() => {
    const feed: FeedEvent[] = [];
    const totals = { pending: 0, granted: 0, declined: 0, active: 0, sessions: 0 };
    for (const s of startups) {
      const m = getMentorSummary(s.id, mentorRequests, mentorMatches, mentors, users);
      totals.pending += m.pending;
      totals.granted += m.granted;
      totals.declined += m.declined;
      totals.active += m.activeMatches;
      totals.sessions += m.sessions;
      for (const e of m.events) feed.push({ ...e, startup: s });
    }
    feed.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { feed, totals };
  }, [startups, mentorRequests, mentorMatches, mentors, users]);

  const visible = feed.filter(
    (e) => (kind === 'ALL' || e.kind === kind) && (startupId === 'ALL' || e.startup.id === startupId)
  );

  return (
    <Card className="shadow-xs border border-[#E4E4E7] bg-white rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-[#E4E4E7] pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#2563EB]" />
              Mentor Activity
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Everything that has happened in Mentor Connect: requests raised, granted matches, sessions and closures.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={startupId}
              onChange={(e) => setStartupId(e.target.value)}
              className="h-7 rounded-md border border-[#E4E4E7] bg-white px-2 text-xs text-zinc-700"
              aria-label="Filter by startup"
            >
              <option value="ALL">All startups</option>
              {startups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'ALL' | MentorEventKind)}
              className="h-7 rounded-md border border-[#E4E4E7] bg-white px-2 text-xs text-zinc-700"
              aria-label="Filter by event type"
            >
              <option value="ALL">All events</option>
              {(Object.keys(EVENT_STYLE) as MentorEventKind[]).map((k) => (
                <option key={k} value={k}>
                  {EVENT_STYLE[k].label}
                </option>
              ))}
            </select>
            <Link href="/mentor-connect">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                Mentor Connect <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat icon={Clock} label="Pending requests" value={totals.pending} tone={totals.pending ? 'amber' : 'zinc'} />
          <Stat icon={CheckCircle2} label="Granted" value={totals.granted} tone="green" />
          <Stat icon={XCircle} label="Declined" value={totals.declined} tone={totals.declined ? 'red' : 'zinc'} />
          <Stat icon={Users} label="Active mentorships" value={totals.active} tone="blue" />
          <Stat icon={MessageSquare} label="Sessions logged" value={totals.sessions} tone="blue" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            {feed.length === 0
              ? 'No mentor requests or matches yet. Activity from Mentor Connect will appear here.'
              : 'No activity matches these filters.'}
          </div>
        ) : (
          <ol className="divide-y divide-[#E4E4E7]">
            {visible.map((e) => {
              const { icon: Icon, cls, label } = EVENT_STYLE[e.kind];
              return (
                <li key={`${e.startup.id}-${e.id}`} className="flex gap-3 px-4 py-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cls}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Link
                        href={`/startups/${e.startup.id}`}
                        className="text-xs font-semibold text-zinc-900 hover:text-[#2563EB] hover:underline"
                      >
                        {e.startup.name}
                      </Link>
                      <Badge variant="outline" className={`text-[10px] ${cls}`}>
                        {label}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-800 mt-0.5">{e.title}</div>
                    {e.detail && <p className="text-[11px] text-zinc-500 line-clamp-2">{e.detail}</p>}
                  </div>
                  <div className="text-[11px] text-zinc-400 whitespace-nowrap">{fmtDate(e.date)}</div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  sub?: string;
  tone: 'red' | 'amber' | 'blue' | 'green' | 'zinc';
}) {
  const color = {
    red: 'text-[#DC2626]',
    amber: 'text-[#D97706]',
    blue: 'text-[#2563EB]',
    green: 'text-[#16A34A]',
    zinc: 'text-zinc-900',
  }[tone];
  return (
    <div className="border border-[#E4E4E7] rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-400">{sub}</div>}
    </div>
  );
}
