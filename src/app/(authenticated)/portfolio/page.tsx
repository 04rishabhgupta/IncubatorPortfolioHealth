'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { TODAY } from '@/lib/clock';
import { getLatestMetrics, getLatestApprovedAssessment, getRunwayMonths } from '@/lib/derived';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { columns, PortfolioRow } from './columns';
import { StartupEditModal } from '@/components/portfolio/StartupEditModal';
import { StartupComparison } from '@/components/portfolio/StartupComparison';
import { generateStartupExcel } from '@/lib/excelService';
import { ConnectStartupModal } from '@/components/demoday/ConnectStartupModal';
import { Startup } from '@/types';
import { toast } from 'sonner';
import { Send, Sparkles, ArrowLeft } from 'lucide-react';
import { generateInsights } from '@/lib/insights';
import { regulatory as seedRegulatory } from '@/data/seed/regulatory';

function PortfolioContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const {
    currentUser,
    startups: allStartups,
    metrics,
    assessments,
    milestones,
    dataRequests,
    submissions,
    mentorMatches,
    mentors,
    regulatoryItems,
  } = useStore();

  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedStartupId, setSelectedStartupId] = useState<string | undefined>(undefined);

  if (!currentUser) return null;

  const startups = scopeStartups(currentUser, allStartups).filter((s) => !s.archived);

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

  // If tab is compare, show StartupComparison tool
  if (tab === 'compare') {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
          <div>
            <h1 className="heading-display text-zinc-950 tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
              Startup Benchmarking
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Side-by-side comparative analysis of portfolio startups across valuation, health, runway, and TRL.
            </p>
          </div>
          <Link href="/portfolio">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
            </Button>
          </Link>
        </div>
        <StartupComparison availableStartups={startups} />
      </div>
    );
  }

  // If tab is insights, show AI Diagnostics
  if (tab === 'insights') {
    const activeRegulatory = regulatoryItems && regulatoryItems.length > 0 ? regulatoryItems : seedRegulatory;
    const insights = generateInsights(startups, activeRegulatory, metrics, assessments, mentors, mentorMatches, TODAY);

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
          <div>
            <h1 className="heading-display text-zinc-950 tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
              AI Diagnostics & Risk Signals
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Automated venture diagnostics, regulatory mandates, and risk intelligence feed.
            </p>
          </div>
          <Link href="/portfolio">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>
                <b>AI Diagnostics & Regulatory Intelligence Feed:</b> Grounded in database-synced regulatory mandates and portfolio performance.
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-white border-blue-200 text-blue-700 font-medium">
              Database Feed Active
            </Badge>
          </div>
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
      </div>
    );
  }

  // Row Data for Startup Directory Table
  const tableData: PortfolioRow[] = startups.map((s) => {
    const latestAss = getLatestApprovedAssessment(s.id, assessments);
    const runway = getRunwayMonths(s.id, metrics);
    const sMetrics = getLatestMetrics(s.id, metrics);
    const sMilestones = milestones.filter((m) => m.startupId === s.id);
    const doneMilestones = sMilestones.filter((m) => m.status === 'COMPLETED').length;
    const overdueMilestones = sMilestones.filter((m) => {
      if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
        const target = m.revisedDate || m.targetDate;
        const diffDays = (new Date(TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24);
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
        (new Date(TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24)
      );
    }

    const openRequests = dataRequests.filter((r) => r.startupId === s.id && r.status === 'OPEN').length;
    const activeMentors = mentorMatches.filter((m) => m.startupId === s.id && m.status === 'ACTIVE').length;

    return {
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
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
        <div>
          <h1 className="heading-display text-zinc-950 tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
            Startup Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Active portfolio startups with real-time health, investibility rating, red flag detection, and action tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedStartupId(undefined);
              setConnectModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Pitch to VC
          </Button>
        </div>
      </div>

      {/* Startup Directory Table */}
      <Card className="shadow-xs border border-[#E4E4E7] bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#E4E4E7] pb-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">
              Active Cohort Startups ({startups.length})
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Portfolio startups with real-time health, investibility rating, red flag detection, and action tools.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            columns={columns.filter((c) => {
              if (c.header === 'Portfolio Head') return currentUser.role === 'ADMIN';
              if (c.header === 'Portfolio Manager')
                return currentUser.role === 'ADMIN' || currentUser.role === 'INVESTMENT_MANAGER';
              return true;
            })}
            data={tableData}
            showExport={currentUser.role !== 'INVESTMENT_ASSOCIATE'}
            onExport={handleExport}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingStartup && (
        <StartupEditModal
          startup={editingStartup}
          isOpen={!!editingStartup}
          onClose={() => setEditingStartup(null)}
          onDeleted={() => setEditingStartup(null)}
        />
      )}

      {/* Connect to VC Modal */}
      <ConnectStartupModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        preselectedStartupId={selectedStartupId}
      />
    </div>
  );
}

export default function PortfolioDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading Startup Directory...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
