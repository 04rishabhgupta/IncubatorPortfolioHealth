'use client';

import { useStore } from '@/store';
import { DEMO_TODAY } from '@/lib/clock';
import { getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { formatINR, formatINRExact } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { users } from '@/data/seed/users';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ReferenceArea,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Activity,
  AlertTriangle,
  Clock,
  IndianRupee,
  FileCheck2,
  Users,
  FileText,
  TrendingUp,
  BarChart2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function AdminOverview() {
  const router = useRouter();
  const { startups, metrics, assessments, submissions, mentorMatches, milestones, dataRequests } = useStore();

  const managers = users.filter((u) => u.role === 'INVESTMENT_MANAGER');

  // Compute Overall KPIs
  let totalDisbursed = 0;
  let totalSanctioned = 0;
  let runwayUnder3 = 0;
  const activeMatches = mentorMatches.filter((m) => m.status === 'ACTIVE').length;
  let founderUpdatesOverdue = 0;
  let atRiskCritical = 0;
  let totalHealth = 0;
  let healthCount = 0;
  let currentMonthAssApproved = 0;

  const demoDate = new Date(DEMO_TODAY);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prevMonthStr = `${demoDate.getFullYear()}-${String(demoDate.getMonth() + 1).padStart(2, '0')}`;

  startups.forEach((s) => {
    if (s.archived) return;
    totalDisbursed += s.grantDisbursed;
    totalSanctioned += s.grantSanctioned;

    const r = getRunwayMonths(s.id, metrics);
    if (r < 3) runwayUnder3++;

    const a = getLatestApprovedAssessment(s.id, assessments);
    if (a) {
      totalHealth += a.total;
      healthCount++;
      if (['AT_RISK', 'CRITICAL'].includes(a.band)) atRiskCritical++;
    }

    const allAccepted = submissions
      .filter((sub) => sub.startupId === s.id && sub.status === 'ACCEPTED')
      .sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    if (allAccepted.length === 0) {
      founderUpdatesOverdue++;
    } else {
      const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 35) founderUpdatesOverdue++;
    }

    const hasApprovedPrev = assessments.some(
      (ass) => ass.startupId === s.id && ass.month === '2026-09' && ass.status === 'APPROVED'
    );
    if (hasApprovedPrev) currentMonthAssApproved++;
  });

  const avgHealth = healthCount > 0 ? Math.round(totalHealth / healthCount) : 0;

  // Manager Comparison Data
  const managerRows = managers.map((mgr) => {
    const mStartups = startups.filter((s) => s.managerId === mgr.id && !s.archived);
    const mAssociates = users.filter((u) => u.managerId === mgr.id).length;

    let mHealth = 0,
      mCount = 0,
      mAtRisk = 0,
      mRunwayU3 = 0,
      mOverdueMilestones = 0,
      mOverdueUpdates = 0,
      mPendingSubs = 0,
      mActiveMatches = 0;
    const mBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
    const mRunways: number[] = [];
    const mHealthHistory: Record<string, number> = { '2026-06': 0, '2026-07': 0, '2026-08': 0, '2026-09': 0 };
    const mHealthHistoryCounts: Record<string, number> = { '2026-06': 0, '2026-07': 0, '2026-08': 0, '2026-09': 0 };

    let currentAssApproved = 0;

    mStartups.forEach((s) => {
      const a = getLatestApprovedAssessment(s.id, assessments);
      if (a) {
        mHealth += a.total;
        mCount++;
        if (['AT_RISK', 'CRITICAL'].includes(a.band)) mAtRisk++;
        mBands[a.band]++;
      }

      const r = getRunwayMonths(s.id, metrics);
      mRunways.push(r);
      if (r < 3) mRunwayU3++;

      const sMilestones = milestones.filter((m) => m.startupId === s.id);
      mOverdueMilestones += sMilestones.filter((m) => {
        if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
          const target = m.revisedDate || m.targetDate;
          const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24);
          return diffDays > 14;
        }
        return false;
      }).length;

      const hasApproved = assessments.some((ass) => ass.startupId === s.id && ass.month === '2026-09' && ass.status === 'APPROVED');
      if (hasApproved) currentAssApproved++;

      const allAccepted = submissions
        .filter((sub) => sub.startupId === s.id && sub.status === 'ACCEPTED')
        .sort((x, y) => new Date(y.submittedOn).getTime() - new Date(x.submittedOn).getTime());
      if (allAccepted.length === 0) {
        mOverdueUpdates++;
      } else {
        const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 35) mOverdueUpdates++;
      }

      mPendingSubs += submissions.filter((sub) => sub.startupId === s.id && sub.status === 'PENDING_REVIEW').length;
      mActiveMatches += mentorMatches.filter((mm) => mm.startupId === s.id && mm.status === 'ACTIVE').length;

      // History for trend
      assessments
        .filter((ass) => ass.startupId === s.id && ass.status === 'APPROVED')
        .forEach((ass) => {
          if (mHealthHistory[ass.month] !== undefined) {
            mHealthHistory[ass.month] += ass.total;
            mHealthHistoryCounts[ass.month]++;
          }
        });
    });

    const avgH = mCount > 0 ? Math.round(mHealth / mCount) : 0;
    mRunways.sort((x, y) => x - y);
    const medianRunway =
      mRunways.length > 0
        ? mRunways.length % 2 !== 0
          ? mRunways[Math.floor(mRunways.length / 2)]
          : (mRunways[mRunways.length / 2 - 1] + mRunways[mRunways.length / 2]) / 2
        : 0;

    const historyData = ['2026-06', '2026-07', '2026-08', '2026-09'].map((mon) => {
      const c = mHealthHistoryCounts[mon];
      return c > 0 ? Math.round(mHealthHistory[mon] / c) : 0;
    });

    const change3m = historyData[3] - historyData[0];

    return {
      mgr,
      startupsCount: mStartups.length,
      associatesCount: mAssociates,
      avgHealth: avgH,
      mBands,
      mAtRisk,
      mMedianRunway: medianRunway,
      mRunwayU3,
      mOverdueMilestones,
      currentAssApproved,
      mOverdueUpdates,
      mPendingSubs,
      mActiveMatches,
      historyData,
      change3m,
    };
  });

  const months = ['2026-06', '2026-07', '2026-08', '2026-09'];
  const healthOverTimeData = months.map((mon, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: any = { name: mon };
    managerRows.forEach((row) => {
      point[row.mgr.label] = row.historyData[i];
    });
    return point;
  });

  const bandDistributionData = managerRows.map((row) => ({
    name: row.mgr.label.replace('Portfolio Head ', 'PH '),
    HEALTHY: row.mBands.HEALTHY,
    WATCH: row.mBands.WATCH,
    AT_RISK: row.mBands.AT_RISK,
    CRITICAL: row.mBands.CRITICAL,
  }));

  const healthOverTimeConfig = {
    'Portfolio Head 1': {
      label: 'Portfolio Head 1',
      color: '#2563EB',
    },
    'Portfolio Head 2': {
      label: 'Portfolio Head 2',
      color: '#7C3AED',
    },
    'Portfolio Head 3': {
      label: 'Portfolio Head 3',
      color: '#06B6D4',
    },
  } satisfies ChartConfig;

  const bandDistributionConfig = {
    HEALTHY: {
      label: 'Healthy',
      color: '#16A34A',
    },
    WATCH: {
      label: 'Watch',
      color: '#D97706',
    },
    AT_RISK: {
      label: 'At Risk',
      color: '#EA580C',
    },
    CRITICAL: {
      label: 'Critical',
      color: '#DC2626',
    },
  } satisfies ChartConfig;

  // Cross portfolio attention
  const crossPortfolioAttention = managers.map((mgr) => {
    const mStartups = startups.filter((s) => s.managerId === mgr.id && !s.archived);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mAttention: any[] = [];
    mStartups.forEach((s) => {
      const rules = getNeedsAttentionRules(s.id, { metrics, assessments, milestones, dataRequests, submissions }, DEMO_TODAY);
      if (rules.length > 0) {
        mAttention.push({ startup: s, rules });
      }
    });
    return { mgr, attention: mAttention };
  });

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E4E4E7]">
        <div>
          <h1 className="heading-display text-zinc-900 tracking-tight">Admin Executive Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Enterprise portfolio governance, manager performance trajectories, and capital allocation across deeptech ventures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portfolio">
            <Button
              variant="outline"
              className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs font-semibold h-9 rounded-lg gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>View Portfolio</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (Matching User Reference & shadcn dashboard-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Startups"
          value="1,247"
          icon={Building2}
          trend="~ +12.5%"
          subtitle="active ventures"
        />
        <StatCard
          title="Active Applications"
          value="89"
          icon={FileText}
          trend="~ +8.2%"
          subtitle="pending review"
        />
        <StatCard
          title="Funding Disbursed"
          value="₹24,80,00,000"
          icon={IndianRupee}
          trend="~ +15.3%"
          subtitle="of sanctioned"
        />
        <StatCard
          title="Mentors Active"
          value="42"
          icon={Users}
          trend="~ +5"
          subtitle="engagements"
        />
      </div>

      {/* Secondary Manager Governance Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Avg Health"
          value={`${avgHealth}/100`}
          icon={Activity}
          trend="~ Benchmark"
          subtitle="Grade B+"
        />
        <StatCard
          title="At-Risk & Critical"
          value={atRiskCritical}
          icon={AlertTriangle}
          trend="~ Immediate review"
          subtitle="high priority"
          valueClassName={atRiskCritical > 0 ? "text-destructive" : ""}
        />
        <StatCard
          title="Runway < 3 Months"
          value={runwayUnder3}
          icon={Clock}
          trend="~ Capital alert"
          subtitle="urgent fundraising"
          valueClassName={runwayUnder3 > 0 ? "text-amber-600" : ""}
        />
        <StatCard
          title="Quarterly Assessments"
          value={`${currentMonthAssApproved} / ${startups.length}`}
          icon={FileCheck2}
          trend="~ September cycle"
          subtitle="approved records"
        />
      </div>

      {/* Manager Comparison Table Card */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="text-base font-bold tracking-tight">Portfolio Head Comparison</CardTitle>
          <CardDescription className="text-xs">Click any portfolio head row to inspect their executive top-level portfolio drilldown.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Head</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Managers</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startups</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Health</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">3M Change</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">Band Mix</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">At Risk</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Median Runway</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Runway &lt; 3m</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Milestones Overdue</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessed</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerRows.map((row) => {
                const bTotal = row.mBands.HEALTHY + row.mBands.WATCH + row.mBands.AT_RISK + row.mBands.CRITICAL;
                return (
                  <TableRow
                    key={row.mgr.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/admin/managers/${row.mgr.id}`)}
                  >
                    <TableCell className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{row.mgr.label}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{row.associatesCount}</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-foreground">{row.startupsCount}</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-foreground font-mono">{row.avgHealth}/100</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap font-mono font-semibold">
                      <span className={row.change3m >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                        {row.change3m > 0 ? '▲' : '▼'} {Math.abs(row.change3m).toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                        {row.mBands.HEALTHY > 0 && (
                          <div style={{ width: `${(row.mBands.HEALTHY / bTotal) * 100}%` }} className="bg-emerald-600" />
                        )}
                        {row.mBands.WATCH > 0 && (
                          <div style={{ width: `${(row.mBands.WATCH / bTotal) * 100}%` }} className="bg-amber-500" />
                        )}
                        {row.mBands.AT_RISK > 0 && (
                          <div style={{ width: `${(row.mBands.AT_RISK / bTotal) * 100}%` }} className="bg-orange-500" />
                        )}
                        {row.mBands.CRITICAL > 0 && (
                          <div style={{ width: `${(row.mBands.CRITICAL / bTotal) * 100}%` }} className="bg-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold">
                      <span className={row.mAtRisk >= 3 ? 'text-destructive' : 'text-foreground'}>{row.mAtRisk}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs">{row.mMedianRunway.toFixed(1)}m</TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold">
                      <span className={row.mRunwayU3 > 0 ? 'text-destructive' : 'text-foreground'}>{row.mRunwayU3}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground">{row.mOverdueMilestones}</TableCell>
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      {row.currentAssApproved} / {row.startupsCount}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/managers/${row.mgr.id}`);
                        }}
                        className="text-[11px] h-7 px-2.5"
                      >
                        Drilldown
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-2xs">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 stroke-[2.25]" />
              <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                Average Portfolio Health Over Time
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
              Historical performance trajectory across portfolio heads.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <ChartContainer config={healthOverTimeConfig} className="h-64 w-full">
              <LineChart data={healthOverTimeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <ReferenceArea y1={75} y2={100} fill="#16A34A" fillOpacity={0.06} />
                <ReferenceArea y1={55} y2={75} fill="#D97706" fillOpacity={0.06} />
                <ReferenceArea y1={35} y2={55} fill="#EA580C" fillOpacity={0.06} />
                <ReferenceArea y1={0} y2={35} fill="#DC2626" fillOpacity={0.06} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Portfolio Head 1" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Portfolio Head 2" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Portfolio Head 3" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600 stroke-[2.25]" />
              <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                Health Band Distribution by Manager
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
              Portfolio companies categorized by health band for each manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <ChartContainer config={bandDistributionConfig} className="h-64 w-full">
              <BarChart data={bandDistributionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="HEALTHY" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="WATCH" stackId="a" fill="#D97706" radius={[0, 0, 0, 0]} />
                <Bar dataKey="AT_RISK" stackId="a" fill="#EA580C" radius={[0, 0, 0, 0]} />
                <Bar dataKey="CRITICAL" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cross-portfolio Attention Items */}
      <Card className="shadow-2xs">
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm font-bold tracking-tight">Cross-Portfolio Ventures Requiring Attention</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {crossPortfolioAttention.map((group) => (
              <div key={group.mgr.id} className="space-y-2.5 bg-muted/50 p-3.5 rounded-lg border border-border">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-bold text-xs text-foreground">{group.mgr.label}</span>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px] font-semibold border-amber-300">
                    {group.attention.length} Attention Items
                  </Badge>
                </div>
                <div className="space-y-2">
                  {group.attention.map((item) => (
                    <div key={item.startup.id} className="bg-background rounded-lg p-2.5 border border-border text-xs">
                      <Link
                        href={`/startups/${item.startup.id}`}
                        className="font-bold text-primary hover:underline flex items-center justify-between"
                      >
                        <span>{item.startup.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {item.rules.map((rule: any, i: number) => (
                          <div key={i} className="text-amber-800">
                            • {rule.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {group.attention.length === 0 && (
                    <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      ✓ All ventures under this manager are in healthy standing.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
