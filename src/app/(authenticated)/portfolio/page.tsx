'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { DEMO_TODAY } from '@/lib/clock';
import { getLatestMetrics, getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { formatINR, formatINRExact } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  AlertCircle,
  ShieldAlert,
  Activity,
  IndianRupee,
  Briefcase,
  Building2,
  FileText,
  Users,
  Sparkles,
  BarChart2,
  Clock,
  AlertTriangle,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ComposedChart, Line, Legend, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { columns, PortfolioRow } from './columns';
import { generateInsights } from '@/lib/insights';
import { regulatory as seedRegulatory } from '@/data/seed/regulatory';
import { StartupEditModal } from '@/components/portfolio/StartupEditModal';
import { StartupComparison } from '@/components/portfolio/StartupComparison';
import { generateStartupExcel } from '@/lib/excelService';
import { Startup } from '@/types';
import { toast } from 'sonner';

export default function PortfolioDashboard() {
  const { currentUser, startups: allStartups, metrics, assessments, milestones, dataRequests, submissions, mentorMatches, mentors } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'compare'>('overview');
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);

  if (!currentUser) return null;

  const startups = scopeStartups(currentUser, allStartups).filter((s) => !s.archived);

  // Compute KPIs
  let totalHealth = 0;
  let healthCount = 0;
  let totalInvestibility = 0;
  let investibilityCount = 0;
  let atRiskCritical = 0;
  let runwayUnder3 = 0;
  let totalDisbursed = 0;
  let totalSanctioned = 0;

  const runwayValues: number[] = [];
  const healthBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
  const sectorCounts: Record<string, number> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attentionList: any[] = [];
  const tableData: PortfolioRow[] = [];

  const handleDownloadExcel = (s: Startup) => {
    try {
      const buffer = generateStartupExcel(s);
      const blob = new Blob([buffer as Uint8Array<ArrayBuffer>], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${s.name.replace(/\s+/g, '_')}_FITT_Tracker.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${s.name} Excel workbook`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel');
    }
  };

  startups.forEach((s) => {
    const latestAss = getLatestApprovedAssessment(s.id, assessments);
    if (latestAss) {
      totalHealth += latestAss.total;
      healthCount++;
      if (['AT_RISK', 'CRITICAL'].includes(latestAss.band)) {
        atRiskCritical++;
      }
      healthBands[latestAss.band]++;
    }

    if (s.investibility?.total) {
      totalInvestibility += s.investibility.total;
      investibilityCount++;
    }

    const runway = getRunwayMonths(s.id, metrics);
    runwayValues.push(runway);
    if (runway < 3) runwayUnder3++;

    totalDisbursed += s.grantDisbursed;
    totalSanctioned += s.grantSanctioned;

    sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;

    const rules = getNeedsAttentionRules(
      s.id,
      { metrics, assessments, milestones, dataRequests, submissions },
      DEMO_TODAY
    );
    if (rules.length > 0) {
      attentionList.push({ startup: s, rules, count: rules.length, health: latestAss?.total || 100 });
    }

    // Row Data
    const sMetrics = getLatestMetrics(s.id, metrics);
    const sMilestones = milestones.filter((m) => m.startupId === s.id);
    const doneMilestones = sMilestones.filter((m) => m.status === 'COMPLETED').length;
    const overdueMilestones = sMilestones.filter((m) => {
      if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
        const target = m.revisedDate || m.targetDate;
        const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24);
        return diffDays > 14;
      }
      return false;
    }).length;

    const allAccepted = submissions
      .filter((sub) => sub.startupId === s.id && sub.status === 'ACCEPTED')
      .sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    let lastUpdateDays = null;
    if (allAccepted.length > 0) {
      lastUpdateDays = Math.floor(
        (new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24)
      );
    }

    const openRequests = dataRequests.filter((r) => r.startupId === s.id && r.status === 'OPEN').length;
    const activeMentors = mentorMatches.filter((m) => m.startupId === s.id && m.status === 'ACTIVE').length;

    tableData.push({
      startup: s,
      health: latestAss ? { total: latestAss.total, band: latestAss.band, delta: latestAss.delta3m } : null,
      investibility: s.investibility ? { total: s.investibility.total, grade: s.investibility.grade } : null,
      redFlags: s.aiAnalysis?.redFlags || [],
      runway,
      cash: sMetrics?.cashBalance || 0,
      burn: sMetrics?.monthlyBurn || 0,
      revenue: sMetrics?.monthlyRevenue || 0,
      milestonesText: `${doneMilestones}/${sMilestones.length} done`,
      overdueMilestones,
      lastUpdateDays,
      openRequests,
      activeMentors,
      onEdit: (st) => setEditingStartup(st),
      onDownload: (st) => handleDownloadExcel(st),
    });
  });

  attentionList.sort((a, b) => b.count - a.count || a.health - b.health);

  const avgHealth = healthCount > 0 ? Math.round(totalHealth / healthCount) : 0;
  const avgInvestibility = investibilityCount > 0 ? Math.round(totalInvestibility / investibilityCount) : 76;

  runwayValues.sort((a, b) => a - b);
  const medianRunway =
    runwayValues.length > 0
      ? runwayValues.length % 2 !== 0
        ? runwayValues[Math.floor(runwayValues.length / 2)]
        : (runwayValues[runwayValues.length / 2 - 1] + runwayValues[runwayValues.length / 2]) / 2
      : 0;

  // Chart data
  const sectorChartData = Object.entries(sectorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const runBuckets = { '< 3m': 0, '3-6m': 0, '6-12m': 0, '12m+': 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const burnRevData: any[] = [];

  runwayValues.forEach((r) => {
    if (r < 3) runBuckets['< 3m']++;
    else if (r < 6) runBuckets['3-6m']++;
    else if (r < 12) runBuckets['6-12m']++;
    else runBuckets['12m+']++;
  });
  const runwayChartData = Object.entries(runBuckets).map(([name, value]) => ({ name, value }));

  const sortedByBurn = [...tableData].sort((a, b) => b.burn - a.burn).slice(0, 8);
  sortedByBurn.forEach((row) => {
    burnRevData.push({
      name: row.startup.name,
      burn: row.burn / 100000,
      revenue: row.revenue / 100000,
    });
  });

  const insights = generateInsights(startups, seedRegulatory, metrics, assessments, mentors, mentorMatches, DEMO_TODAY);

  const runwayChartConfig = {
    value: {
      label: 'Startups',
      color: '#2563EB',
    },
  } satisfies ChartConfig;

  const sectorChartConfig = {
    value: {
      label: 'Startups',
      color: '#16A34A',
    },
  } satisfies ChartConfig;

  const burnRevChartConfig = {
    burn: {
      label: 'Net Burn',
      color: '#2563EB',
    },
    revenue: {
      label: 'Revenue',
      color: '#D97706',
    },
  } satisfies ChartConfig;

  const handleExport = (data: PortfolioRow[]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Startup,Sector,Stage,TRL,Health,Investibility,Runway,Cash,Burn,Revenue\n' +
      data
        .map(
          (e) =>
            `${e.startup.name},${e.startup.sector},${e.startup.stage},${e.startup.trl},${e.health?.total || ''},${
              e.investibility?.total || ''
            },${e.runway.toFixed(1)},${e.cash},${e.burn},${e.revenue}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'portfolio_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Portfolio Dashboard</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Executive overview of deeptech ventures, health trajectory, investibility rating, and capital runway.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'insights' | 'compare')} className="w-auto">
            <TabsList className="bg-muted p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-xs font-semibold">
                Portfolio Overview
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs font-semibold">
                Compare Startups ({startups.length})
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs font-semibold">
                AI Diagnostics ({insights.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* TAB 1: PORTFOLIO OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPIs (Aligned with user reference & shadcn dashboard-01) */}
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
              value="₹24,80,00,000.00"
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

          {/* Secondary Governance & Health KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Portfolio Avg Health"
              value={`${avgHealth}/100`}
              icon={Activity}
              trend="~ Benchmark"
              subtitle="Grade B+"
            />
            <StatCard
              title="Investibility Rating"
              value={`${avgInvestibility}/100`}
              icon={Sparkles}
              trend="~ Grade A"
              subtitle="investor-ready"
            />
            <StatCard
              title="Median Runway"
              value={`${medianRunway.toFixed(1)}m`}
              icon={Clock}
              trend="~ Cash buffer"
              subtitle="operational runway"
            />
            <StatCard
              title="Ventures at Risk"
              value={atRiskCritical}
              icon={AlertTriangle}
              trend={runwayUnder3 > 0 ? `~ ${runwayUnder3} runway < 3m` : '~ Healthy'}
              subtitle="requiring review"
              valueClassName={atRiskCritical > 0 ? "text-destructive" : ""}
            />
          </div>

          {/* Visual Analytics & Needs Attention */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Needs Attention Column */}
            <Card className="lg:col-span-1 shadow-sm border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/30 flex flex-col rounded-2xl">
              <CardHeader className="pb-3 border-b border-amber-200/60">
                <CardTitle className="text-base flex items-center text-amber-950 font-bold tracking-tight">
                  <AlertCircle className="w-5 h-5 mr-2 text-[#D97706]" />
                  Needs Attention ({attentionList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto max-h-[380px]">
                {attentionList.length === 0 ? (
                  <div className="p-6 text-sm text-amber-800 text-center font-medium">
                    All portfolio companies are operating smoothly!
                  </div>
                ) : (
                  <div className="divide-y divide-amber-200/40">
                    {attentionList.map((item) => (
                      <div key={item.startup.id} className="p-4 hover:bg-white/60 transition-colors">
                        <div className="font-bold text-sm mb-1.5 flex items-center justify-between">
                          <Link href={`/startups/${item.startup.id}`} className="hover:underline text-zinc-900">
                            {item.startup.name}
                          </Link>
                          <Badge variant="outline" className="text-[10px] bg-white border-amber-300">
                            TRL {item.startup.trl}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {item.rules.map((rule: any, i: number) => (
                            <div key={i} className="text-xs flex items-start text-zinc-700 font-medium">
                              <span className="mr-2 mt-0.5 text-amber-600">•</span>
                              <span className={rule.type === 'runway' ? 'text-[#DC2626] font-bold' : ''}>
                                {rule.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts: Runway & Sectors */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 stroke-[2.25]" />
                    <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Capital Runway Distribution
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                    Startups grouped by operational runway remaining.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-52 pt-2">
                  <ChartContainer config={runwayChartConfig} className="h-full w-full">
                    <BarChart data={runwayChartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-blue-600 stroke-[2.25]" />
                    <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Deeptech Sector Allocation
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                    Distribution of deeptech focus domains across the portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-52 pt-2">
                  <ChartContainer config={sectorChartConfig} className="h-full w-full">
                    <BarChart
                      data={sectorChartData}
                      layout="vertical"
                      margin={{ left: 10, right: 10, top: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={90}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Net Burn vs Revenue */}
              <Card className="shadow-2xs sm:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600 stroke-[2.25]" />
                    <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                      Net Burn vs. Monthly Revenue (₹ Lakhs)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                    Monthly burn against top-line revenue across active ventures.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-56 pt-2">
                  <ChartContainer config={burnRevChartConfig} className="h-full w-full">
                    <ComposedChart data={burnRevData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="burn" fill="var(--color-burn)" radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Startup Directory Table */}
          <Card className="shadow-xs border border-[#E4E4E7] bg-white rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#E4E4E7] pb-4">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">Startup Directory</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Portfolio startups with real-time health, investibility rating, red flag detection, and action tools.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <DataTable
                columns={columns.filter((c) => {
                  if (c.header === 'Manager') return currentUser.role === 'ADMIN';
                  if (c.header === 'Associate')
                    return currentUser.role === 'ADMIN' || currentUser.role === 'INVESTMENT_MANAGER';
                  return true;
                })}
                data={tableData}
                showExport={currentUser.role !== 'INVESTMENT_ASSOCIATE'}
                onExport={handleExport}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: COMPARE STARTUPS */}
      {activeTab === 'compare' && (
        <StartupComparison availableStartups={startups} />
      )}

      {/* TAB 3: AI DIAGNOSTICS & RED FLAGS */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => (
              <Card key={ins.id} className="border border-[#E4E4E7] bg-white shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="pb-2 bg-[#F4F4F5] border-b border-[#E4E4E7] flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] ${
                        ins.category === 'PORTFOLIO_RISK'
                          ? 'bg-[#DC2626] text-white'
                          : ins.category === 'REGULATORY'
                          ? 'bg-[#EA580C] text-white'
                          : 'bg-[#2563EB] text-white'
                      }`}
                    >
                      {ins.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    {ins.startupsAffected.length} Startup{ins.startupsAffected.length > 1 ? 's' : ''} Affected
                  </span>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="font-bold text-sm text-zinc-900">{ins.title}</div>
                  <div className="bg-[#F4F4F5] p-2.5 rounded-lg text-xs text-zinc-700">
                    <b className="text-zinc-900">Why it matters:</b> {ins.whyItMatters}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ins.startupsAffected.map((s) => (
                      <Link key={s.id} href={`/startups/${s.id}`}>
                        <Badge variant="outline" className="text-[10px] hover:bg-blue-50 cursor-pointer">
                          {s.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs text-[#2563EB] border-[#2563EB] hover:bg-blue-50">
                      {ins.suggestedAction.label}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStartup && (
        <StartupEditModal
          startup={editingStartup}
          isOpen={!!editingStartup}
          onClose={() => setEditingStartup(null)}
          onDeleted={() => setEditingStartup(null)}
        />
      )}
    </div>
  );
}
