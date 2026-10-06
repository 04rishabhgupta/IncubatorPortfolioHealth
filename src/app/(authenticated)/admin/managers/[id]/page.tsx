'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useParams } from 'next/navigation';
import { users } from '@/data/seed/users';
import { getLatestApprovedAssessment, getRunwayMonths, getLatestMetrics } from '@/lib/derived';
import { DEMO_TODAY } from '@/lib/clock';
import { DataTable } from '@/components/ui/data-table';
import { columns, PortfolioRow } from '@/app/(authenticated)/portfolio/columns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StartupComparison } from '@/components/portfolio/StartupComparison';
import { formatINR } from '@/lib/utils';
import { Startup } from '@/types';
import { generateStartupExcel } from '@/lib/excelService';
import { toast } from 'sonner';

export default function ManagerDrillDown() {
  const params = useParams();
  const mgrId = params.id as string;
  const { startups, metrics, assessments, submissions, mentorMatches, milestones, dataRequests } = useStore();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'associates' | 'compare'>('portfolio');

  const manager = users.find((u) => u.id === mgrId);
  if (!manager) return <div className="p-8 text-center text-red-600 font-bold">Manager not found</div>;

  const associates = users.filter((u) => u.managerId === mgrId);
  const mStartups = startups.filter((s) => s.managerId === mgrId && !s.archived);

  // Compute stats for manager
  let mHealth = 0,
    mCount = 0,
    mInvestTotal = 0,
    mInvestCount = 0,
    mAtRisk = 0,
    totalDisbursed = 0;

  const mBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
  const mRunways: number[] = [];
  const mHealthHistory: Record<string, number> = { '2026-06': 0, '2026-09': 0 };
  const mHealthHistoryCounts: Record<string, number> = { '2026-06': 0, '2026-09': 0 };

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
      toast.success(`Exported ${s.name} workbook`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel');
    }
  };

  mStartups.forEach((s) => {
    const a = getLatestApprovedAssessment(s.id, assessments);
    if (a) {
      mHealth += a.total;
      mCount++;
      mBands[a.band]++;
      if (['AT_RISK', 'CRITICAL'].includes(a.band)) mAtRisk++;
    }

    if (s.investibility?.total) {
      mInvestTotal += s.investibility.total;
      mInvestCount++;
    }

    totalDisbursed += s.grantDisbursed;

    const r = getRunwayMonths(s.id, metrics);
    mRunways.push(r);

    const sMilestones = milestones.filter((m) => m.startupId === s.id);
    const overdueM = sMilestones.filter((m) => {
      if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
        const target = m.revisedDate || m.targetDate;
        return (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24) > 14;
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

    const act = mentorMatches.filter((m) => m.startupId === s.id && m.status === 'ACTIVE').length;

    ['2026-06', '2026-09'].forEach((mon) => {
      const mh = assessments.find((ass) => ass.startupId === s.id && ass.month === mon && ass.status === 'APPROVED');
      if (mh) {
        mHealthHistory[mon] += mh.total;
        mHealthHistoryCounts[mon]++;
      }
    });

    // Populate TableRow
    const sMetrics = getLatestMetrics(s.id, metrics);
    const doneMilestones = sMilestones.filter((m) => m.status === 'COMPLETED').length;
    const openRequests = dataRequests.filter((req) => req.startupId === s.id && req.status === 'OPEN').length;

    tableData.push({
      startup: s,
      health: a ? { total: a.total, band: a.band, delta: a.delta3m } : null,
      investibility: s.investibility ? { total: s.investibility.total, grade: s.investibility.grade } : null,
      redFlags: s.aiAnalysis?.redFlags || [],
      runway: r,
      cash: sMetrics?.cashBalance || 0,
      burn: sMetrics?.monthlyBurn || 0,
      revenue: sMetrics?.monthlyRevenue || 0,
      milestonesText: `${doneMilestones}/${sMilestones.length} done`,
      overdueMilestones: overdueM,
      lastUpdateDays,
      openRequests,
      activeMentors: act,
      onDownload: (st) => handleDownloadExcel(st),
    });
  });

  mRunways.sort((a, b) => a - b);
  const mMedianRunway =
    mRunways.length > 0
      ? mRunways.length % 2 !== 0
        ? mRunways[Math.floor(mRunways.length / 2)]
        : (mRunways[mRunways.length / 2 - 1] + mRunways[mRunways.length / 2]) / 2
      : 0;

  const avgHealth = mCount > 0 ? Math.round(mHealth / mCount) : 0;
  const avgInvest = mInvestCount > 0 ? Math.round(mInvestTotal / mInvestCount) : 76;

  let change3m = 0;
  const avgSep = mHealthHistoryCounts['2026-09'] > 0 ? mHealthHistory['2026-09'] / mHealthHistoryCounts['2026-09'] : 0;
  const avgJun = mHealthHistoryCounts['2026-06'] > 0 ? mHealthHistory['2026-06'] / mHealthHistoryCounts['2026-06'] : 0;
  if (avgSep && avgJun) change3m = avgSep - avgJun;

  // Associates Breakdown
  const associateRows = associates.map((assoc) => {
    const aStartups = mStartups.filter((s) => s.associateId === assoc.id);
    let aHealth = 0,
      aCount = 0;
    aStartups.forEach((s) => {
      const ah = getLatestApprovedAssessment(s.id, assessments);
      if (ah) {
        aHealth += ah.total;
        aCount++;
      }
    });
    return {
      assoc,
      startupsCount: aStartups.length,
      avgHealth: aCount > 0 ? Math.round(aHealth / aCount) : 0,
    };
  });

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
    link.setAttribute('download', `${manager.label.replace(' ', '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{manager.label} Portfolio</h1>
            <span className="text-[11px] bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full font-bold">
              Top-Level View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {associates.length} Portfolio Managers • {mStartups.length} Startups • Avg Health: <span className="font-bold text-zinc-900">{avgHealth}</span>
            <span className={`ml-2 font-bold ${change3m >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              ({change3m > 0 ? '▲' : '▼'} {Math.abs(change3m).toFixed(1)} vs 3m ago)
            </span>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'portfolio' | 'associates' | 'compare')} className="w-auto">
          <TabsList className="bg-[#F4F4F5] border border-[#E4E4E7] p-1 rounded-xl">
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-xs font-semibold">
              Portfolio Table ({mStartups.length})
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-xs font-semibold">
              Compare Startups
            </TabsTrigger>
            <TabsTrigger value="associates" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-xs font-semibold">
              Portfolio Managers ({associates.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Startups</div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight mt-1">{mStartups.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Active ventures</span>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Avg Health</div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight mt-1">{avgHealth}</div>
            <span className="text-[11px] text-muted-foreground font-medium block mt-0.5">0-100 score</span>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Investibility</div>
            <div className="text-2xl font-bold text-emerald-600 font-mono tracking-tight mt-1">{avgInvest}/100</div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Grade A</span>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Disbursed</div>
            <div className="text-xl font-bold text-foreground font-mono tracking-tight mt-1">{formatINR(totalDisbursed)}</div>
            <span className="text-[11px] text-muted-foreground font-medium block mt-0.5">Grants</span>
          </CardContent>
        </Card>
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Median Runway</div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight mt-1">{mMedianRunway.toFixed(1)}m</div>
            <span className="text-[11px] text-muted-foreground font-medium block mt-0.5">Cash buffer</span>
          </CardContent>
        </Card>
        <Card className="shadow-2xs border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="text-[11px] text-destructive uppercase font-bold tracking-wider">At Risk / Alerts</div>
            <div className="text-2xl font-bold text-destructive font-mono tracking-tight mt-1">{mAtRisk}</div>
            <span className="text-[11px] text-destructive font-medium block mt-0.5">Requires review</span>
          </CardContent>
        </Card>
      </div>

      {/* TAB 1: Manager Top-Level Portfolio Table */}
      {activeTab === 'portfolio' && (
        <Card className="shadow-2xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base font-bold tracking-tight">
              {manager.label} Portfolio Companies
            </CardTitle>
            <CardDescription className="text-xs">Comprehensive view of ventures supervised under this portfolio head.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <DataTable
              columns={columns.filter((c) => c.header !== 'Portfolio Head')}
              data={tableData}
              showExport={true}
              onExport={handleExport}
            />
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Startup Comparison */}
      {activeTab === 'compare' && (
        <StartupComparison availableStartups={mStartups} />
      )}

      {/* TAB 3: Associates Breakdown */}
      {activeTab === 'associates' && (
        <Card className="shadow-2xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base font-bold tracking-tight">Assigned Portfolio Managers</CardTitle>
            <CardDescription className="text-xs">Portfolio Managers reporting to {manager.label} and their respective portfolio health averages.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Manager</TableHead>
                  <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Startups</TableHead>
                  <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associateRows.map((row) => (
                  <TableRow key={row.assoc.id} className="hover:bg-muted/50">
                    <TableCell className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {row.assoc.label.charAt(0)}
                      </div>
                      <span>{row.assoc.label}</span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 font-mono font-bold text-foreground">{row.startupsCount}</TableCell>
                    <TableCell className="px-5 py-3.5">
                      <span className="font-mono font-bold text-sm text-primary">{row.avgHealth}</span>
                      <span className="text-muted-foreground">/100</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
