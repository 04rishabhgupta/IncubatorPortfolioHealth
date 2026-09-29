'use client';

import { useStore } from '@/store';
import { DEMO_TODAY } from '@/lib/clock';
import { getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { formatINR } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { users } from '@/data/seed/users';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceArea } from 'recharts';
import { useRouter } from 'next/navigation';

export default function AdminOverview() {
  const router = useRouter();
  const { startups, metrics, assessments, submissions, mentorMatches, milestones, dataRequests } = useStore();

  const managers = users.filter(u => u.role === 'INVESTMENT_MANAGER');

  // Compute Overall KPIs
  let totalDisbursed = 0;
  let totalSanctioned = 0;
  let runwayUnder3 = 0;
  const activeMatches = mentorMatches.filter(m => m.status === 'ACTIVE').length;
  let founderUpdatesOverdue = 0;
  let atRiskCritical = 0;
  let totalHealth = 0;
  let healthCount = 0;
  let currentMonthAssApproved = 0;
  
  const demoDate = new Date(DEMO_TODAY);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prevMonthStr = `${demoDate.getFullYear()}-${String(demoDate.getMonth() + 1).padStart(2, '0')}`; // assuming month is 0-indexed, wait, DEMO_TODAY is '2026-10-05', so demoDate.getMonth() is 9 (Oct). prev month is 09 (Sep).

  startups.forEach(s => {
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

    const allAccepted = submissions.filter(sub => sub.startupId === s.id && sub.status === 'ACCEPTED').sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    if (allAccepted.length === 0) {
      founderUpdatesOverdue++;
    } else {
      const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 35) founderUpdatesOverdue++;
    }

    const hasApprovedPrev = assessments.some(ass => ass.startupId === s.id && ass.month === '2026-09' && ass.status === 'APPROVED');
    if (hasApprovedPrev) currentMonthAssApproved++;
  });

  const avgHealth = healthCount > 0 ? Math.round(totalHealth / healthCount) : 0;

  // Manager Comparison Data
  const managerRows = managers.map(mgr => {
    const mStartups = startups.filter(s => s.managerId === mgr.id && !s.archived);
    const mAssociates = users.filter(u => u.managerId === mgr.id).length;
    
    let mHealth = 0, mCount = 0, mAtRisk = 0, mRunwayU3 = 0, mOverdueMilestones = 0, mOverdueUpdates = 0, mPendingSubs = 0, mActiveMatches = 0;
    const mBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
    const mRunways: number[] = [];
    const mHealthHistory: Record<string, number> = { '2026-06': 0, '2026-07': 0, '2026-08': 0, '2026-09': 0 };
    const mHealthHistoryCounts: Record<string, number> = { '2026-06': 0, '2026-07': 0, '2026-08': 0, '2026-09': 0 };
    
    let currentAssApproved = 0;

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
      mOverdueMilestones += sMilestones.filter(m => {
        if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
          const target = m.revisedDate || m.targetDate;
          return (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24) > 14;
        }
        return false;
      }).length;

      const allAccepted = submissions.filter(sub => sub.startupId === s.id && sub.status === 'ACCEPTED').sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
      if (allAccepted.length === 0 || (new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24) > 35) {
        mOverdueUpdates++;
      }

      mPendingSubs += submissions.filter(sub => sub.startupId === s.id && sub.status === 'PENDING_REVIEW').length;
      mActiveMatches += mentorMatches.filter(m => m.startupId === s.id && m.status === 'ACTIVE').length;

      if (assessments.some(ass => ass.startupId === s.id && ass.month === '2026-09' && ass.status === 'APPROVED')) currentAssApproved++;

      ['2026-06', '2026-07', '2026-08', '2026-09'].forEach(mon => {
        const mh = assessments.find(ass => ass.startupId === s.id && ass.month === mon && ass.status === 'APPROVED');
        if (mh) {
          mHealthHistory[mon] += mh.total;
          mHealthHistoryCounts[mon]++;
        }
      });
    });

    mRunways.sort((a, b) => a - b);
    const mMedianRunway = mRunways.length > 0 ? (mRunways.length % 2 !== 0 ? mRunways[Math.floor(mRunways.length / 2)] : (mRunways[mRunways.length / 2 - 1] + mRunways[mRunways.length / 2]) / 2) : 0;
    
    let change3m = 0;
    const avgSep = mHealthHistoryCounts['2026-09'] > 0 ? mHealthHistory['2026-09'] / mHealthHistoryCounts['2026-09'] : 0;
    const avgJun = mHealthHistoryCounts['2026-06'] > 0 ? mHealthHistory['2026-06'] / mHealthHistoryCounts['2026-06'] : 0;
    if (avgSep && avgJun) change3m = avgSep - avgJun;

    const historyData = ['2026-06', '2026-07', '2026-08', '2026-09'].map(m => mHealthHistoryCounts[m] > 0 ? Math.round(mHealthHistory[m] / mHealthHistoryCounts[m]) : null);

    return {
      mgr,
      associatesCount: mAssociates,
      startupsCount: mStartups.length,
      avgHealth: mCount > 0 ? Math.round(mHealth / mCount) : 0,
      change3m,
      mBands,
      mAtRisk,
      mMedianRunway,
      mRunwayU3,
      mOverdueMilestones,
      mOverdueUpdates,
      mPendingSubs,
      mActiveMatches,
      currentAssApproved,
      historyData
    };
  });

  managerRows.sort((a, b) => a.avgHealth - b.avgHealth); // weakest first

  // Charts data
  const healthOverTimeData = ['2026-06', '2026-07', '2026-08', '2026-09'].map((mon, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: any = { name: mon };
    managerRows.forEach(row => {
      point[row.mgr.label] = row.historyData[i];
    });
    return point;
  });

  const bandDistributionData = managerRows.map(row => ({
    name: row.mgr.label.replace('Investment Manager ', 'IM'),
    HEALTHY: row.mBands.HEALTHY,
    WATCH: row.mBands.WATCH,
    AT_RISK: row.mBands.AT_RISK,
    CRITICAL: row.mBands.CRITICAL
  }));

  // Cross portfolio attention
  const crossPortfolioAttention = managers.map(mgr => {
    const mStartups = startups.filter(s => s.managerId === mgr.id && !s.archived);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mAttention: any[] = [];
    mStartups.forEach(s => {
      const rules = getNeedsAttentionRules(s.id, { metrics, assessments, milestones, dataRequests, submissions }, DEMO_TODAY);
      if (rules.length > 0) {
        mAttention.push({ startup: s, rules });
      }
    });
    return { mgr, attention: mAttention };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">Admin Overview</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Startups</div>
            <div className="text-2xl font-bold">{startups.length}</div>
            <div className="text-xs text-black/60">across 3 managers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Portfolio average health</div>
            <div className="text-2xl font-bold">{avgHealth}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">At Risk + Critical</div>
            <div className="text-2xl font-bold text-[#B42318]">{atRiskCritical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Runway {'<'} 3 months</div>
            <div className={`text-2xl font-bold ${runwayUnder3 > 0 ? 'text-[#B42318]' : ''}`}>{runwayUnder3}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Grants disbursed</div>
            <div className="text-2xl font-bold">{formatINR(totalDisbursed)}</div>
            <div className="text-xs text-black/60">of {formatINR(totalSanctioned)} sanctioned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">September assessments</div>
            <div className="text-2xl font-bold">{currentMonthAssApproved} of 30</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Founder updates overdue</div>
            <div className="text-2xl font-bold">{founderUpdatesOverdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-black/60">Active mentor matches</div>
            <div className="text-2xl font-bold">{activeMatches}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Investment Manager</th>
                  <th className="px-4 py-3">Associates</th>
                  <th className="px-4 py-3">Startups</th>
                  <th className="px-4 py-3">Avg Health</th>
                  <th className="px-4 py-3">Change vs 3m</th>
                  <th className="px-4 py-3 min-w-[120px]">Band Mix</th>
                  <th className="px-4 py-3">At Risk + Critical</th>
                  <th className="px-4 py-3">Median Runway</th>
                  <th className="px-4 py-3">Runway {'<'} 3m</th>
                  <th className="px-4 py-3">Milestones Overdue</th>
                  <th className="px-4 py-3">Assmt Approved</th>
                  <th className="px-4 py-3">Updates Overdue</th>
                  <th className="px-4 py-3">Pending Subs</th>
                  <th className="px-4 py-3">Matches</th>
                </tr>
              </thead>
              <tbody>
                {managerRows.map(row => {
                  const bTotal = row.mBands.HEALTHY + row.mBands.WATCH + row.mBands.AT_RISK + row.mBands.CRITICAL;
                  return (
                    <tr key={row.mgr.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/managers/${row.mgr.id}`)}>
                      <td className="px-4 py-3 font-medium text-black whitespace-nowrap">{row.mgr.label}</td>
                      <td className="px-4 py-3">{row.associatesCount}</td>
                      <td className="px-4 py-3">{row.startupsCount}</td>
                      <td className="px-4 py-3 font-semibold">{row.avgHealth}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={row.change3m >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.change3m > 0 ? '▲' : '▼'} {Math.abs(row.change3m).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex h-3 w-full rounded overflow-hidden">
                          {row.mBands.HEALTHY > 0 && <div style={{width: `${(row.mBands.HEALTHY/bTotal)*100}%`}} className="bg-[#2E7D4F]" title={`Healthy: ${row.mBands.HEALTHY}`} />}
                          {row.mBands.WATCH > 0 && <div style={{width: `${(row.mBands.WATCH/bTotal)*100}%`}} className="bg-[#B8860B]" title={`Watch: ${row.mBands.WATCH}`} />}
                          {row.mBands.AT_RISK > 0 && <div style={{width: `${(row.mBands.AT_RISK/bTotal)*100}%`}} className="bg-[#D2691E]" title={`At Risk: ${row.mBands.AT_RISK}`} />}
                          {row.mBands.CRITICAL > 0 && <div style={{width: `${(row.mBands.CRITICAL/bTotal)*100}%`}} className="bg-[#B42318]" title={`Critical: ${row.mBands.CRITICAL}`} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${row.mAtRisk >= 3 ? 'text-red-600' : ''}`}>{row.mAtRisk}</span>
                      </td>
                      <td className="px-4 py-3">{row.mMedianRunway.toFixed(1)}m</td>
                      <td className="px-4 py-3 text-center">
                        <span className={row.mRunwayU3 > 0 ? 'text-red-600 font-medium' : ''}>{row.mRunwayU3}</span>
                      </td>
                      <td className="px-4 py-3">{row.mOverdueMilestones}</td>
                      <td className="px-4 py-3">
                        <span className={row.currentAssApproved < row.startupsCount ? 'text-amber-600 font-medium' : ''}>
                          {row.currentAssApproved} / {row.startupsCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.mOverdueUpdates}</td>
                      <td className="px-4 py-3">{row.mPendingSubs}</td>
                      <td className="px-4 py-3">{row.mActiveMatches}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Avg Health Over Time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthOverTimeData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <ReferenceArea y1={75} y2={100} fill="#2E7D4F" fillOpacity={0.1} />
                <ReferenceArea y1={55} y2={75} fill="#B8860B" fillOpacity={0.1} />
                <ReferenceArea y1={35} y2={55} fill="#D2691E" fillOpacity={0.1} />
                <ReferenceArea y1={0} y2={35} fill="#B42318" fillOpacity={0.1} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis domain={[0, 100]} tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Investment Manager 1" stroke="#1E4133" strokeWidth={2} />
                <Line type="monotone" dataKey="Investment Manager 2" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="Investment Manager 3" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Band Distribution by Manager</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandDistributionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="HEALTHY" stackId="a" fill="#2E7D4F" />
                <Bar dataKey="WATCH" stackId="a" fill="#B8860B" />
                <Bar dataKey="AT_RISK" stackId="a" fill="#D2691E" />
                <Bar dataKey="CRITICAL" stackId="a" fill="#B42318" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cross-portfolio Needs Attention</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {crossPortfolioAttention.map(group => (
              <div key={group.mgr.id} className="space-y-2">
                <h3 className="font-semibold text-lg text-black border-b pb-1 mb-2">
                  {group.mgr.label}: {group.attention.length} startups need attention
                </h3>
                {group.attention.map(item => (
                  <div key={item.startup.id} className="bg-amber-50/50 rounded-md p-3 text-sm">
                    <Link href={`/startups/${item.startup.id}`} className="font-medium hover:underline text-black">{item.startup.name}</Link>
                    <div className="text-xs text-black/60 mt-1 space-y-0.5">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {item.rules.map((rule: any, i: number) => (
                        <div key={i}>• {rule.text}</div>
                      ))}
                    </div>
                  </div>
                ))}
                {group.attention.length === 0 && <div className="text-sm text-gray-500">All clear.</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
