'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { DEMO_TODAY } from '@/lib/clock';
import { getLatestMetrics, getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { formatINR } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { AlertCircle, Lightbulb, TrendingDown, Users, ShieldAlert, ArrowRight, Activity, IndianRupee, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, CartesianGrid, } from 'recharts';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { columns, PortfolioRow } from './columns';
import { generateInsights } from '@/lib/insights';
import { regulatory as seedRegulatory } from '@/data/seed/regulatory';

export default function PortfolioDashboard() {
  const { currentUser, startups: allStartups, metrics, assessments, milestones, dataRequests, submissions, mentorMatches, mentors } = useStore();
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentUser) return null;

  const startups = scopeStartups(currentUser, allStartups).filter(s => !s.archived);

  // Compute KPIs
  let totalHealth = 0;
  let healthCount = 0;
  let atRiskCritical = 0;
  let runwayUnder3 = 0;
  let totalDisbursed = 0;
  let totalSanctioned = 0;
  let pendingSubmissions = 0;
  let awaitingAssessments = 0;
  
  const runwayValues: number[] = [];
  const healthBands = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
  const sectorCounts: Record<string, number> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attentionList: any[] = [];
  const tableData: PortfolioRow[] = [];

  startups.forEach(s => {
    const latestAss = getLatestApprovedAssessment(s.id, assessments);
    if (latestAss) {
      totalHealth += latestAss.total;
      healthCount++;
      if (['AT_RISK', 'CRITICAL'].includes(latestAss.band)) {
        atRiskCritical++;
      }
      healthBands[latestAss.band]++;
    }

    const runway = getRunwayMonths(s.id, metrics);
    runwayValues.push(runway);
    if (runway < 3) runwayUnder3++;

    totalDisbursed += s.grantDisbursed;
    totalSanctioned += s.grantSanctioned;

    sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;

    const sSub = submissions.filter(sub => sub.startupId === s.id && sub.status === 'PENDING_REVIEW');
    pendingSubmissions += sSub.length;

    const sAss = assessments.filter(a => a.startupId === s.id && (currentUser.role === 'ADMIN' ? a.status === 'AWAITING_APPROVAL' : (currentUser.role === 'INVESTMENT_MANAGER' ? a.status === 'AWAITING_APPROVAL' : a.status === 'DRAFT')));
    awaitingAssessments += sAss.length;

    const rules = getNeedsAttentionRules(s.id, { metrics, assessments, milestones, dataRequests, submissions }, DEMO_TODAY);
    if (rules.length > 0) {
      attentionList.push({ startup: s, rules, count: rules.length, health: latestAss?.total || 100 });
    }

    // Row Data
    const sMetrics = getLatestMetrics(s.id, metrics);
    const sMilestones = milestones.filter(m => m.startupId === s.id);
    const doneMilestones = sMilestones.filter(m => m.status === 'COMPLETED').length;
    const overdueMilestones = sMilestones.filter(m => {
      if (['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)) {
        const target = m.revisedDate || m.targetDate;
        const diffDays = (new Date(DEMO_TODAY).getTime() - new Date(target).getTime()) / (1000 * 3600 * 24);
        return diffDays > 14;
      }
      return false;
    }).length;

    const allAccepted = submissions.filter(sub => sub.startupId === s.id && sub.status === 'ACCEPTED').sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    let lastUpdateDays = null;
    if (allAccepted.length > 0) {
      lastUpdateDays = Math.floor((new Date(DEMO_TODAY).getTime() - new Date(allAccepted[0].submittedOn).getTime()) / (1000 * 3600 * 24));
    }

    const openRequests = dataRequests.filter(r => r.startupId === s.id && r.status === 'OPEN').length;
    const activeMentors = mentorMatches.filter(m => m.startupId === s.id && m.status === 'ACTIVE').length;

    tableData.push({
      startup: s,
      health: latestAss ? { total: latestAss.total, band: latestAss.band, delta: latestAss.delta3m } : null,
      runway,
      cash: sMetrics?.cashBalance || 0,
      burn: sMetrics?.monthlyBurn || 0,
      revenue: sMetrics?.monthlyRevenue || 0,
      milestonesText: `${doneMilestones}/${sMilestones.length} done`,
      overdueMilestones,
      lastUpdateDays,
      openRequests,
      activeMentors
    });
  });

  attentionList.sort((a, b) => b.count - a.count || a.health - b.health);

  const avgHealth = healthCount > 0 ? Math.round(totalHealth / healthCount) : 0;
  runwayValues.sort((a, b) => a - b);
  const medianRunway = runwayValues.length > 0 ? (runwayValues.length % 2 !== 0 ? runwayValues[Math.floor(runwayValues.length / 2)] : (runwayValues[runwayValues.length / 2 - 1] + runwayValues[runwayValues.length / 2]) / 2) : 0;

  // Chart data
  const sectorChartData = Object.entries(sectorCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const runBuckets = { '< 3m': 0, '3-6m': 0, '6-12m': 0, '12m+': 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const burnRevData: any[] = [];
  
  runwayValues.forEach(r => {
    if (r < 3) runBuckets['< 3m']++;
    else if (r < 6) runBuckets['3-6m']++;
    else if (r < 12) runBuckets['6-12m']++;
    else runBuckets['12m+']++;
  });
  const runwayChartData = Object.entries(runBuckets).map(([name, value]) => ({ name, value }));

  // Prepare Burn vs Rev data for top 10 startups (to not clutter the chart)
  const sortedByBurn = [...tableData].sort((a, b) => b.burn - a.burn).slice(0, 8);
  sortedByBurn.forEach(row => {
    burnRevData.push({
      name: row.startup.name,
      burn: row.burn / 100000,
      revenue: row.revenue / 100000
    });
  });

  const insights = generateInsights(startups, seedRegulatory, metrics, assessments, mentors, mentorMatches, DEMO_TODAY);

  const handleExport = (data: PortfolioRow[]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Startup,Sector,Stage,TRL,Health,Runway,Cash,Burn,Revenue\\n"
      + data.map(e => `${e.startup.name},${e.startup.sector},${e.startup.stage},${e.startup.trl},${e.health?.total || ''},${e.runway.toFixed(1)},${e.cash},${e.burn},${e.revenue}`).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfolio_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Portfolio Dashboard</h1>
          <p className="text-black/60 mt-1">Monitor the health, traction, and risks across your portfolio.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="overview">Portfolio overview</TabsTrigger>
              <TabsTrigger value="insights">AI insights ({insights.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#E3E7E0] rounded-full text-[#144B3B]"><Briefcase size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Startups</div>
                  <div className="text-3xl font-black text-black">{startups.length}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#E3E7E0] rounded-full text-[#144B3B]"><Activity size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Avg Health</div>
                  <div className="text-3xl font-black text-black">{avgHealth}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#B42318]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full text-[#B42318]"><AlertCircle size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">At Risk</div>
                  <div className="text-3xl font-black text-[#B42318]">{atRiskCritical}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-[#E3E7E0] rounded-full text-[#144B3B]"><IndianRupee size={24} /></div>
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Disbursed</div>
                  <div className="text-2xl font-black text-black">{formatINR(totalDisbursed)}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Median Runway</div>
                  <div className="text-3xl font-black text-black">{medianRunway.toFixed(1)}m</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Runway &lt; 3m</div>
                  <div className={`text-3xl font-black ${runwayUnder3 > 0 ? 'text-[#B42318]' : 'text-black'}`}>{runwayUnder3}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Pending Subs</div>
                  <div className="text-3xl font-black text-black">{pendingSubmissions}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div>
                  <div className="text-sm font-semibold text-black/60 uppercase tracking-wider">Assessments</div>
                  <div className="text-3xl font-black text-black">{awaitingAssessments}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Needs Attention */}
            <Card className="lg:col-span-1 shadow-sm border-none bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
              <CardHeader className="pb-3 border-b border-amber-200/50">
                <CardTitle className="text-lg flex items-center text-amber-900 font-bold tracking-tight">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px] sm:max-h-[600px]">
                {attentionList.length === 0 ? (
                  <div className="p-6 text-sm text-amber-800 text-center font-medium">All clear. Everything looks good!</div>
                ) : (
                  <div className="divide-y divide-amber-200/40">
                    {attentionList.map(item => (
                      <div key={item.startup.id} className="p-4 hover:bg-white/40 transition-colors">
                        <div className="font-bold text-sm mb-2">
                          <Link href={`/startups/${item.startup.id}`} className="hover:underline text-black">{item.startup.name}</Link>
                        </div>
                        <div className="space-y-1">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {item.rules.map((rule: any, i: number) => (
                            <div key={i} className="text-xs flex items-start text-black/80 font-medium">
                              <span className="mr-2 mt-0.5 text-amber-500">•</span>
                              <span className={rule.type === 'runway' ? 'text-[#B42318] font-bold' : ''}>{rule.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold tracking-tight text-black/60 uppercase">Runway Distribution</CardTitle></CardHeader>
                <CardContent className="h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={runwayChartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E7E0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#000' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#000' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" fill="#1E4133" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold tracking-tight text-black/60 uppercase">Sectors</CardTitle></CardHeader>
                <CardContent className="h-56 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorChartData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#000' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" fill="#BBC3BE" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-0 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold tracking-tight text-black/60 uppercase">High Burn Startups: Net Burn vs Revenue (₹ Lakhs)</CardTitle>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={burnRevData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E7E0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#000' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#000' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }} />
                      <Legend />
                      <Bar dataKey="burn" name="Net Burn" fill="#144B3B" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#BBC3BE" strokeWidth={3} dot={{r: 4}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4 mb-2">
              <CardTitle className="text-xl font-bold tracking-tight text-black">Startup Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns.filter(c => {
                  if (c.header === 'Manager') return currentUser.role === 'ADMIN';
                  if (c.header === 'Associate') return currentUser.role === 'ADMIN' || currentUser.role === 'INVESTMENT_MANAGER';
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

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map(insight => (
              <Card key={insight.id} className="border-t-4 shadow-sm" style={{ borderTopColor: insight.category === 'REGULATORY' ? '#6366f1' : insight.category === 'PORTFOLIO_RISK' ? '#ef4444' : '#10b981' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    {insight.category === 'REGULATORY' && <ShieldAlert className="w-5 h-5 text-indigo-500" />}
                    {insight.category === 'PORTFOLIO_RISK' && <TrendingDown className="w-5 h-5 text-red-500" />}
                    {insight.category === 'MENTOR_RECOMMENDATION' && <Users className="w-5 h-5 text-emerald-500" />}
                    <span className="text-xs font-semibold uppercase text-black/60 tracking-wider">{insight.category.replace('_', ' ')}</span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-black/80 mb-1">Why it matters:</h4>
                    <p className="text-sm text-black/60 leading-relaxed">{insight.whyItMatters}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-black/80 mb-2 flex items-center justify-between">
                      Affected Startups ({insight.startupsAffected.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {insight.startupsAffected.map(s => (
                        <Link key={s.id} href={`/startups/${s.id}`}>
                          <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">{s.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full justify-between bg-white text-black border border-primary hover:bg-gray-50">
                      {insight.suggestedAction.label}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {insights.length === 0 && (
              <div className="col-span-full text-center py-12 text-black/60">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No new insights right now.</p>
                <p>The AI engine is monitoring portfolio data and will surface recommendations here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
