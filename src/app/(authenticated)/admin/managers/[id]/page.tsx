'use client';

import { useStore } from '@/store';
import { useParams } from 'next/navigation';
import { users } from '@/data/seed/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLatestApprovedAssessment, getRunwayMonths } from '@/lib/derived';
import { DEMO_TODAY } from '@/lib/clock';
import { DataTable } from '@/components/ui/data-table';
import { columns, PortfolioRow } from '@/app/(authenticated)/portfolio/columns';
import { getLatestMetrics } from '@/lib/derived';

export default function ManagerDrillDown() {
  const params = useParams();
  const mgrId = params.id as string;
  const { startups, metrics, assessments, submissions, mentorMatches, milestones, dataRequests } = useStore();

  const manager = users.find(u => u.id === mgrId);
  if (!manager) return <div className="p-8 text-center text-red-600">Manager not found</div>;

  const associates = users.filter(u => u.managerId === mgrId);
  const mStartups = startups.filter(s => s.managerId === mgrId && !s.archived);

  // Compute stats for manager
  let mHealth = 0, mCount = 0, mAtRisk = 0, mRunwayU3 = 0, mOverdueUpdates = 0, mPendingSubs = 0, mActiveMatches = 0;
  const mBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
  const mRunways: number[] = [];
  const mHealthHistory: Record<string, number> = { '2026-06': 0, '2026-09': 0 };
  const mHealthHistoryCounts: Record<string, number> = { '2026-06': 0, '2026-09': 0 };
  let currentAssApproved = 0;

  const tableData: PortfolioRow[] = [];

  mStartups.forEach(s => {
    const a = getLatestApprovedAssessment(s.id, assessments);
    if (a) {
      mHealth += a.total;
      mCount++;
      mBands[a.band]++;
      if (['AT_RISK', 'CRITICAL'].includes(a.band)) mAtRisk++;
    }
    
    const r = getRunwayMonths(s.id, metrics);
    mRunways.push(r);
    if (r < 3) mRunwayU3++;

    const sMilestones = milestones.filter(m => m.startupId === s.id);
    const overdueM = sMilestones.filter(m => {
      if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
        const target = m.revisedDate || m.targetDate;
        return (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24) > 14;
      }
      return false;
    }).length;
    

    const allAccepted = submissions.filter(sub => sub.startupId === s.id && sub.status === 'ACCEPTED').sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    let lastUpdateDays = null;
    if (allAccepted.length > 0) {
      lastUpdateDays = Math.floor((new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24));
    }
    if (lastUpdateDays === null || lastUpdateDays > 35) {
      mOverdueUpdates++;
    }

    const pend = submissions.filter(sub => sub.startupId === s.id && sub.status === 'PENDING_REVIEW').length;
    mPendingSubs += pend;
    
    const act = mentorMatches.filter(m => m.startupId === s.id && m.status === 'ACTIVE').length;
    mActiveMatches += act;

    if (assessments.some(ass => ass.startupId === s.id && ass.month === '2026-09' && ass.status === 'APPROVED')) currentAssApproved++;

    ['2026-06', '2026-09'].forEach(mon => {
      const mh = assessments.find(ass => ass.startupId === s.id && ass.month === mon && ass.status === 'APPROVED');
      if (mh) {
        mHealthHistory[mon] += mh.total;
        mHealthHistoryCounts[mon]++;
      }
    });

    // Populate TableRow
    const sMetrics = getLatestMetrics(s.id, metrics);
    const doneMilestones = sMilestones.filter(m => m.status === 'COMPLETED').length;
    const openRequests = dataRequests.filter(req => req.startupId === s.id && req.status === 'OPEN').length;

    tableData.push({
      startup: s,
      health: a ? { total: a.total, band: a.band, delta: a.delta3m } : null,
      runway: r,
      cash: sMetrics?.cashBalance || 0,
      burn: sMetrics?.monthlyBurn || 0,
      revenue: sMetrics?.monthlyRevenue || 0,
      milestonesText: `${doneMilestones}/${sMilestones.length} done`,
      overdueMilestones: overdueM,
      lastUpdateDays,
      openRequests,
      activeMentors: act
    });
  });

  mRunways.sort((a, b) => a - b);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mMedianRunway = mRunways.length > 0 ? (mRunways.length % 2 !== 0 ? mRunways[Math.floor(mRunways.length / 2)] : (mRunways[mRunways.length / 2 - 1] + mRunways[mRunways.length / 2]) / 2) : 0;
  
  const avgHealth = mCount > 0 ? Math.round(mHealth / mCount) : 0;
  let change3m = 0;
  const avgSep = mHealthHistoryCounts['2026-09'] > 0 ? mHealthHistory['2026-09'] / mHealthHistoryCounts['2026-09'] : 0;
  const avgJun = mHealthHistoryCounts['2026-06'] > 0 ? mHealthHistory['2026-06'] / mHealthHistoryCounts['2026-06'] : 0;
  if (avgSep && avgJun) change3m = avgSep - avgJun;

  // Associates Breakdown
  const associateRows = associates.map(assoc => {
    const aStartups = mStartups.filter(s => s.associateId === assoc.id);
    let aHealth = 0, aCount = 0;
    aStartups.forEach(s => {
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
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Startup,Sector,Stage,TRL,Health,Runway,Cash,Burn,Revenue\\n"
      + data.map(e => `${e.startup.name},${e.startup.sector},${e.startup.stage},${e.startup.trl},${e.health?.total || ''},${e.runway.toFixed(1)},${e.cash},${e.burn},${e.revenue}`).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${manager.label.replace(' ', '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">{manager.label} Overview</h1>
          <p className="text-black/60">{associates.length} Associates • {mStartups.length} Startups • Avg Health: {avgHealth} 
            <span className={`ml-2 ${change3m >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({change3m > 0 ? '▲' : '▼'} {Math.abs(change3m).toFixed(1)} vs 3m ago)
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Startups</div><div className="text-xl font-bold">{mStartups.length}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Avg Health</div><div className="text-xl font-bold">{avgHealth}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">At Risk + Critical</div><div className="text-xl font-bold text-[#B42318]">{mAtRisk}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Runway {'<'} 3m</div><div className={`text-xl font-bold ${mRunwayU3 > 0 ? 'text-[#B42318]' : ''}`}>{mRunwayU3}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Assmt Approved</div><div className="text-xl font-bold">{currentAssApproved}/{mStartups.length}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Updates Overdue</div><div className="text-xl font-bold">{mOverdueUpdates}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Pending Subs</div><div className="text-xl font-bold">{mPendingSubs}</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xs text-black/60">Matches</div><div className="text-xl font-bold">{mActiveMatches}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Associates Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Associate</th>
                  <th className="px-4 py-3">Startups</th>
                  <th className="px-4 py-3">Avg Health</th>
                </tr>
              </thead>
              <tbody>
                {associateRows.map(row => (
                  <tr key={row.assoc.id} className="border-b">
                    <td className="px-4 py-3 font-medium text-black">{row.assoc.label}</td>
                    <td className="px-4 py-3">{row.startupsCount}</td>
                    <td className="px-4 py-3">{row.avgHealth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manager Portfolio</CardTitle></CardHeader>
        <CardContent>
          <DataTable 
            columns={columns.filter(c => c.header !== 'Manager')} 
            data={tableData}
            showExport={true}
            onExport={handleExport}
          />
        </CardContent>
      </Card>
    </div>
  );
}
