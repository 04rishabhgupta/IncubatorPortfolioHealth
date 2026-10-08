'use client';

import { useStore } from '@/store';
import { can, scopeStartups } from '@/lib/rbac';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { TODAY } from '@/lib/clock';
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Download,
  RefreshCw,
  Target,
  TrendingUp,
  Activity,
  IndianRupee,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FittStartupPage } from '@/components/fitt/FittStartupPage';
import { AIDiagnosticsTab } from '@/components/fitt/AIDiagnosticsTab';
import { parseStartupExcel, generateStartupExcel } from '@/lib/excelService';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { Startup } from '@/types';

export default function StartupPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isHydrated, currentUser, startups, updateStartup, metrics, assessments, milestones, dataRequests, submissions, mentorMatches, teams, users } = useStore();
  
  const user = currentUser || users[0];
  const accessibleStartups = user ? scopeStartups(user, startups) : startups;
  const startup =
    accessibleStartups.find(s => s.id === id || (id === 's31' && s.name.toLowerCase().includes('indigotex'))) ||
    startups.find(s => s.id === id || (id === 's31' && s.name.toLowerCase().includes('indigotex')));

  const [formData, setFormData] = useState({
    name: startup?.name || '',
    oneLiner: startup?.oneLiner || '',
    website: startup?.website || '',
    city: startup?.city || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);

  if (!startup) {
    if (!isHydrated) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Loading startup...</p>
        </div>
      );
    }
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-4xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-black/60">Startup not found.</p>
        <Button className="mt-4" onClick={() => router.push('/portfolio')}>Return to Portfolio</Button>
      </div>
    );
  }

  if (startup.fittTracker) {
    return <FittStartupPage startup={startup} currentUser={user} />;
  }

  const canEdit = can(user, 'edit_startup', startup);

  const sMetrics = metrics.filter(m => m.startupId === id).sort((a, b) => a.month.localeCompare(b.month));
  const latestMetrics = sMetrics[sMetrics.length - 1];
  const runway = getRunwayMonths(id, metrics);
  
  const sAssessments = assessments.filter(a => a.startupId === id).sort((a, b) => b.month.localeCompare(a.month));
  const latestAss = getLatestApprovedAssessment(id, assessments);
  
  const sMilestones = milestones.filter(m => m.startupId === id);
  const sDataRequests = dataRequests.filter(d => d.startupId === id);
  const sSubmissions = submissions.filter(s => s.startupId === id);
  const sMatches = mentorMatches.filter(m => m.startupId === id);
  const sTeam = teams.filter(t => t.startupId === id);

  const attentionRules = getNeedsAttentionRules(id, { metrics, assessments, milestones, dataRequests, submissions }, TODAY);

  // Dimension chart data
  const dimensionData = latestAss ? Object.entries(latestAss.dimensions).map(([key, val]) => ({
    name: key,
    score: val.finalScore,
  })) : [];

  // Metrics history data for chart
  const metricsHistoryData = sMetrics.map(m => ({
    month: m.month,
    cash: m.cashBalance / 100000,
    burn: m.monthlyBurn / 100000,
    rev: m.monthlyRevenue / 100000
  }));

  const dimensionChartConfig = {
    score: {
      label: 'Score',
      color: '#2563EB',
    },
  } satisfies ChartConfig;

  const trendsChartConfig = {
    cash: {
      label: 'Cash Balance',
      color: '#2563EB',
    },
    burn: {
      label: 'Net Burn',
      color: '#DC2626',
    },
    rev: {
      label: 'Revenue',
      color: '#16A34A',
    },
  } satisfies ChartConfig;

  const manager = users.find(u => u.id === startup.managerId);
  const associate = users.find(u => u.id === startup.associateId);

  // Edit settings form


  // Excel Upload Handler for real-time parameter & AI recalculation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseStartupExcel(buffer, startup);
        const updated: Startup = {
          ...startup,
          ...parsed,
          fittTracker: parsed.fittTracker || startup.fittTracker,
        };
        updated.investibility = computeInvestibilityScore(updated, metrics);
        updated.aiAnalysis = generateAIAnalysis(updated, metrics);
        const res = await updateStartup(updated);
        if (res?.error) {
          toast.error(`Failed to update startup: ${res.error}`);
          return;
        }
        toast.success(`Excel synced for ${startup.name}! Data and AI Diagnostics updated.`);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        toast.error('Failed to parse Excel file');
      } finally {
        setSyncing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    try {
      const buffer = generateStartupExcel(startup);
      const blob = new Blob([buffer as Uint8Array<ArrayBuffer>], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${startup.name.replace(/\s+/g, '_')}_Tracker.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded latest Excel data sheet');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  const handleSaveSettings = async () => {
    const res = await updateStartup({ ...startup, ...formData });
    if (res?.error) {
      toast.error(`Failed to update startup: ${res.error}`);
      return;
    }
    toast.success('Startup details updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 text-black/60" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              {startup.name}
              {startup.archived && <Badge variant="secondary" className="bg-gray-200">Archived</Badge>}
            </h1>
            <p className="text-lg text-black/60 mt-1">{startup.oneLiner}</p>
            <div className="flex gap-2 mt-3 items-center text-sm flex-wrap">
              <Badge variant="outline">{startup.sector}</Badge>
              <Badge variant="outline">{startup.stage.replace('_', ' ')}</Badge>
              <span className="text-black/60">TRL {startup.trl}</span>
              {startup.website && (
                <a href={startup.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                  <ExternalLink className="w-3 h-3 ml-1 mr-1" /> Website
                </a>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-black/60 space-y-1">
            <div>Manager: <span className="font-medium text-black/80">{manager?.label}</span></div>
            <div>Associate: <span className="font-medium text-black/80">{associate?.label || 'Unassigned'}</span></div>
            <div>Cohort: <span className="font-medium text-black/80">{startup.cohort}</span></div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={syncing}
                className="text-xs bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-none gap-1 font-semibold"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {syncing ? 'Syncing...' : 'Update via Excel (.xlsx)'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                className="text-xs border-zinc-200 gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white border-b border-zinc-200 rounded-none pb-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Overview</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent text-blue-600 font-semibold">AI Diagnostics & Investibility</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Metrics</TabsTrigger>
          <TabsTrigger value="founder-updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Founder Updates</TabsTrigger>
          <TabsTrigger value="assessments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Assessments</TabsTrigger>
          <TabsTrigger value="mentors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Mentors</TabsTrigger>
          <TabsTrigger value="regulatory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Regulatory</TabsTrigger>
          <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Team</TabsTrigger>
          {canEdit && <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent">Settings</TabsTrigger>}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            {attentionRules.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <h3 className="font-semibold text-amber-900 flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" /> Needs Attention
                </h3>
                <ul className="list-disc pl-6 text-sm text-amber-800 space-y-1">
                  {attentionRules.map((r, i) => <li key={i}>{r.text}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Operational Runway"
                value={`${runway.toFixed(1)}m`}
                icon={Clock}
                trend="~ Monthly cash burn"
                subtitle="available"
                valueClassName={runway < 3 ? "text-destructive" : ""}
              />
              <StatCard
                title="Health Band"
                value={latestAss ? latestAss.band : '-'}
                icon={Activity}
                trend="~ Latest evaluation"
                subtitle="approved"
                valueClassName={
                  latestAss?.band === 'HEALTHY'
                    ? 'text-emerald-600'
                    : latestAss?.band === 'WATCH'
                    ? 'text-amber-600'
                    : latestAss?.band === 'AT_RISK'
                    ? 'text-orange-600'
                    : 'text-destructive'
                }
              />
              <StatCard
                title="Monthly Net Burn"
                value={latestMetrics ? formatINR(latestMetrics.monthlyBurn) : '-'}
                icon={IndianRupee}
                trend="~ Last recorded cycle"
                subtitle="burn"
              />
              <StatCard
                title="Milestones Completed"
                value={`${sMilestones.filter((m) => m.status === 'COMPLETED').length} / ${sMilestones.length}`}
                icon={CheckCircle2}
                trend="~ Targets completed"
                subtitle="on track"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-zinc-200 shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600 stroke-[2.25]" />
                    <CardTitle className="text-sm sm:text-base text-zinc-900 font-bold tracking-tight">
                      Health Dimensions (Latest)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                    Score breakdown across core operational dimensions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                  {dimensionData.length > 0 ? (
                    <ChartContainer config={dimensionChartConfig} className="h-64 w-full">
                      <BarChart data={dimensionData} layout="vertical" margin={{ left: 30, right: 10, top: 0, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="score" fill="#2563EB" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : <div className="text-zinc-500 text-sm">No approved assessments yet.</div>}
                </CardContent>
              </Card>

              <Card className="border-zinc-200 shadow-2xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base text-zinc-900 font-bold tracking-tight">Milestones</CardTitle>
                  <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                    Active deliverables and completion status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    {sMilestones.map(m => (
                      <div key={m.id} className="flex items-start gap-3">
                        {m.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : m.status === 'DELAYED' ? <XCircle className="w-5 h-5 text-red-600 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-500 mt-0.5" />}
                        <div>
                          <div className="font-semibold text-sm text-zinc-900">{m.title}</div>
                          <div className="text-xs text-zinc-500 font-mono">Target: {m.targetDate} {m.revisedDate && `(Revised: ${m.revisedDate})`}</div>
                        </div>
                      </div>
                    ))}
                    {sMilestones.length === 0 && <div className="text-sm text-zinc-500">No milestones recorded.</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIDiagnosticsTab startup={startup} metrics={sMetrics} />
          </TabsContent>

          <TabsContent value="metrics">
            <Card className="border-zinc-200 shadow-2xs">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 stroke-[2.25]" />
                  <CardTitle className="text-sm sm:text-base text-zinc-900 font-bold tracking-tight">
                    Cash & Burn Trends
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-zinc-500 font-normal mt-0.5">
                  Monthly cash reserves, net burn rate, and revenue (₹ Lakhs).
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ChartContainer config={trendsChartConfig} className="h-72 w-full">
                  <LineChart data={metricsHistoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${formatINR(Number(value) * 100000)}`} />} />
                    <Legend />
                    <Line type="monotone" dataKey="cash" name="Cash Balance (₹L)" stroke="#2563EB" strokeWidth={2} />
                    <Line type="monotone" dataKey="burn" name="Net Burn (₹L)" stroke="#DC2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="rev" name="Revenue (₹L)" stroke="#16A34A" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card className="mt-6 shadow-2xs overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-border">
                <CardTitle className="text-base font-bold tracking-tight">Metrics History</CardTitle>
                <CardDescription className="text-xs">Historical financial and customer metrics logged across cycles.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</TableHead>
                      <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash</TableHead>
                      <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Burn</TableHead>
                      <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</TableHead>
                      <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cust Convs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...sMetrics].reverse().map(m => (
                      <TableRow key={m.id} className="hover:bg-muted/50">
                        <TableCell className="px-4 py-3 font-mono text-xs font-medium text-foreground">{m.month}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs">{formatINR(m.cashBalance)}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-destructive">{formatINR(m.monthlyBurn)}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-emerald-600">{formatINR(m.monthlyRevenue)}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs">{m.customerConversations}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="founder-updates">
            <Card>
              <CardHeader><CardTitle>Founder Updates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sDataRequests.length === 0 && <p className="text-sm text-black/60">No requests found.</p>}
                  {sDataRequests.map(req => {
                    const sub = sSubmissions.find(s => s.requestId === req.id);
                    return (
                      <div key={req.id} className="border rounded-md p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{req.title} <Badge className="ml-2" variant="outline">{req.type}</Badge></div>
                          <div className="text-sm text-black/60">Due: {req.dueDate} • Status: {req.status}</div>
                        </div>
                        <div>
                          {sub && <Badge className={`${sub.status === 'ACCEPTED' ? 'bg-green-600' : 'bg-amber-600'} text-white`}>{sub.status}</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments">
             <Card>
              <CardHeader><CardTitle>Health Assessments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sAssessments.length === 0 && <p className="text-sm text-black/60">No assessments found.</p>}
                  {sAssessments.map(a => (
                    <div key={a.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-base text-zinc-900">{a.month} <Badge className="ml-2" variant="outline">{a.status}</Badge></div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl font-mono text-zinc-900">{a.total}</span>
                          <Badge className={`${a.band === 'HEALTHY' ? 'bg-emerald-600' : a.band === 'WATCH' ? 'bg-amber-600' : a.band === 'AT_RISK' ? 'bg-orange-600' : 'bg-red-600'} text-white`}>{a.band}</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-600 space-y-1">
                        <div><span className="font-semibold text-zinc-900">Strengths:</span> {a.strengths}</div>
                        <div><span className="font-semibold text-zinc-900">Concerns:</span> {a.concerns}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
             <Card className="border-zinc-200 shadow-2xs">
              <CardHeader><CardTitle className="text-base text-zinc-900 font-bold">Mentor Connections</CardTitle></CardHeader>
              <CardContent>
                {sMatches.length === 0 ? <p className="text-sm text-zinc-500">No active mentor matches.</p> : (
                  <div className="space-y-4">
                    {sMatches.map(m => (
                      <div key={m.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                        <div className="font-semibold text-zinc-900 text-sm">Mentor ID: {m.mentorId} <Badge className="ml-2 bg-emerald-600 text-white">{m.status}</Badge></div>
                        <div className="text-sm text-zinc-500 mt-1 font-mono">Confirmed: {m.confirmedOn}</div>
                        <div className="mt-3 text-sm">
                          <div className="font-semibold text-zinc-900">Sessions ({m.sessions.length})</div>
                          {m.sessions.map(sess => (
                            <div key={sess.id} className="mt-1 pl-2 border-l-2 border-zinc-200">
                              <div className="text-zinc-900">{sess.date} - {sess.topic}</div>
                              <div className="text-xs text-zinc-500">Next step: {sess.nextStep}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regulatory">
             <Card className="border-zinc-200 shadow-2xs">
              <CardHeader><CardTitle className="text-base text-zinc-900 font-bold">Regulatory Feed (Linked)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">Regulatory items associated with {startup.sector} and specific tags will appear here.</p>
                <div className="flex gap-2 mt-2">
                  {startup.regTags?.map(t => <Badge key={t} variant="outline" className="border-zinc-200 text-zinc-700">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
             <Card className="border-zinc-200 shadow-2xs">
              <CardHeader><CardTitle className="text-base text-zinc-900 font-bold">Team</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sTeam.map(t => (
                    <div key={t.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                      <div className="font-bold text-base text-zinc-900">{t.name}</div>
                      <div className="text-sm text-blue-600 font-semibold">{t.role} {t.isFounder && '(Founder)'}</div>
                      <div className="text-sm text-zinc-500 mt-1">{t.email} • {t.fullTime ? 'Full-time' : 'Part-time'}</div>
                    </div>
                  ))}
                  {sTeam.length === 0 && <p className="text-sm text-zinc-500">No team members listed.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {canEdit && (
            <TabsContent value="settings">
              <Card className="border-zinc-200 shadow-2xs">
                <CardHeader><CardTitle className="text-base text-zinc-900 font-bold">Edit Details</CardTitle></CardHeader>
                <CardContent className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700">Startup Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700">One-Liner</Label>
                    <Input value={formData.oneLiner} onChange={e => setFormData({...formData, oneLiner: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700">Website</Label>
                    <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-zinc-700">City</Label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <Button onClick={handleSaveSettings} className="bg-blue-600 text-white hover:bg-blue-700 font-semibold">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

        </div>
      </Tabs>
    </div>
  );
}
