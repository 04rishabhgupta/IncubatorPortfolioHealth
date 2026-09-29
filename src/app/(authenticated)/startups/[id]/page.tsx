'use client';

import { useStore } from '@/store';
import { can, scopeStartups } from '@/lib/rbac';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/utils';
import { getLatestApprovedAssessment, getRunwayMonths, getNeedsAttentionRules } from '@/lib/derived';
import { DEMO_TODAY } from '@/lib/clock';
import { users } from '@/data/seed/users';
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FittStartupPage } from '@/components/fitt/FittStartupPage';

export default function StartupPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { currentUser, startups, updateStartup, metrics, assessments, milestones, dataRequests, submissions, mentorMatches, teams } = useStore();
  
  if (!currentUser) return null;
  
  const accessibleStartups = scopeStartups(currentUser, startups);
  const startup = accessibleStartups.find(s => s.id === id);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [formData, setFormData] = useState({
    name: startup?.name || '',
    oneLiner: startup?.oneLiner || '',
    website: startup?.website || '',
    city: startup?.city || ''
  });
  
  if (!startup) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-4xl font-bold text-black mb-4">403</h1>
        <p className="text-xl text-black/60">You do not have permission to view this startup.</p>
        <Button className="mt-4" onClick={() => router.push('/portfolio')}>Return to Portfolio</Button>
      </div>
    );
  }

  if (startup.fittTracker) {
    return <FittStartupPage startup={startup} currentUser={currentUser} />;
  }

  const canEdit = can(currentUser, 'edit_startup', startup);

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

  const attentionRules = getNeedsAttentionRules(id, { metrics, assessments, milestones, dataRequests, submissions }, DEMO_TODAY);

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


  const manager = users.find(u => u.id === startup.managerId);
  const associate = users.find(u => u.id === startup.associateId);

  // Edit settings form


  const handleSaveSettings = () => {
    updateStartup({ ...startup, ...formData });
    toast.success('Startup details updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-4 text-black/60" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              {startup.name}
              {startup.archived && <Badge variant="secondary" className="bg-gray-200">Archived</Badge>}
            </h1>
            <p className="text-lg text-black/60 mt-1">{startup.oneLiner}</p>
            <div className="flex gap-2 mt-3 items-center text-sm">
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
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white border-b rounded-none pb-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Overview</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Metrics</TabsTrigger>
          <TabsTrigger value="founder-updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Founder Updates</TabsTrigger>
          <TabsTrigger value="assessments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Assessments</TabsTrigger>
          <TabsTrigger value="mentors" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Mentors</TabsTrigger>
          <TabsTrigger value="regulatory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Regulatory</TabsTrigger>
          <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Team</TabsTrigger>
          {canEdit && <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Settings</TabsTrigger>}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-black/60">Runway</div>
                  <div className={`text-2xl font-bold ${runway < 3 ? 'text-[#B42318]' : ''}`}>{runway.toFixed(1)}m</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-black/60">Health Band</div>
                  <div className="text-2xl font-bold">
                    {latestAss ? (
                      <span className={latestAss.band === 'HEALTHY' ? 'text-[#2E7D4F]' : latestAss.band === 'WATCH' ? 'text-[#B8860B]' : latestAss.band === 'AT_RISK' ? 'text-[#D2691E]' : 'text-[#B42318]'}>{latestAss.band}</span>
                    ) : '-'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-black/60">Net Burn</div>
                  <div className="text-2xl font-bold">{latestMetrics ? formatINR(latestMetrics.monthlyBurn) : '-'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-black/60">Milestones Done</div>
                  <div className="text-2xl font-bold">{sMilestones.filter(m => m.status === 'COMPLETED').length} / {sMilestones.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Health Dimensions (Latest)</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {dimensionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dimensionData} layout="vertical" margin={{ left: 30, right: 10, top: 0, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#144B3B" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-black/60 text-sm">No approved assessments yet.</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sMilestones.map(m => (
                      <div key={m.id} className="flex items-start gap-3">
                        {m.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /> : m.status === 'DELAYED' ? <XCircle className="w-5 h-5 text-red-600 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-500 mt-0.5" />}
                        <div>
                          <div className="font-medium text-sm text-black/80">{m.title}</div>
                          <div className="text-xs text-black/60">Target: {m.targetDate} {m.revisedDate && `(Revised: ${m.revisedDate})`}</div>
                        </div>
                      </div>
                    ))}
                    {sMilestones.length === 0 && <div className="text-sm text-black/60">No milestones recorded.</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader><CardTitle>Cash & Burn Trends</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip formatter={(value: any) => [formatINR(value * 100000), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="cash" name="Cash Balance (₹L)" stroke="#1E4133" strokeWidth={2} />
                    <Line type="monotone" dataKey="burn" name="Net Burn (₹L)" stroke="#dc2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="rev" name="Revenue (₹L)" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader><CardTitle>Metrics History</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-black/60 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Cash</th>
                      <th className="px-4 py-3">Burn</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Cust Convs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sMetrics.reverse().map(m => (
                      <tr key={m.id} className="border-b">
                        <td className="px-4 py-3 font-medium">{m.month}</td>
                        <td className="px-4 py-3">{formatINR(m.cashBalance)}</td>
                        <td className="px-4 py-3">{formatINR(m.monthlyBurn)}</td>
                        <td className="px-4 py-3">{formatINR(m.monthlyRevenue)}</td>
                        <td className="px-4 py-3">{m.customerConversations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <div key={a.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-lg">{a.month} <Badge className="ml-2">{a.status}</Badge></div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl">{a.total}</span>
                          <Badge className={`${a.band === 'HEALTHY' ? 'bg-[#2E7D4F]' : a.band === 'WATCH' ? 'bg-[#B8860B]' : a.band === 'AT_RISK' ? 'bg-[#D2691E]' : 'bg-[#B42318]'} text-white`}>{a.band}</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-black/60 space-y-1">
                        <div><span className="font-medium text-black/80">Strengths:</span> {a.strengths}</div>
                        <div><span className="font-medium text-black/80">Concerns:</span> {a.concerns}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
             <Card>
              <CardHeader><CardTitle>Mentor Connections</CardTitle></CardHeader>
              <CardContent>
                {sMatches.length === 0 ? <p className="text-sm text-black/60">No active mentor matches.</p> : (
                  <div className="space-y-4">
                    {sMatches.map(m => (
                      <div key={m.id} className="border rounded-md p-4">
                        <div className="font-medium">Mentor ID: {m.mentorId} <Badge className="ml-2 bg-green-600">{m.status}</Badge></div>
                        <div className="text-sm text-black/60 mt-1">Confirmed: {m.confirmedOn}</div>
                        <div className="mt-3 text-sm">
                          <div className="font-medium">Sessions ({m.sessions.length})</div>
                          {m.sessions.map(sess => (
                            <div key={sess.id} className="mt-1 pl-2 border-l-2 border-gray-200">
                              <div>{sess.date} - {sess.topic}</div>
                              <div className="text-xs text-black/60">Next step: {sess.nextStep}</div>
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
             <Card>
              <CardHeader><CardTitle>Regulatory Feed (Linked)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-black/60">Regulatory items associated with {startup.sector} and specific tags will appear here.</p>
                <div className="flex gap-2 mt-2">
                  {startup.regTags?.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
             <Card>
              <CardHeader><CardTitle>Team</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sTeam.map(t => (
                    <div key={t.id} className="border rounded-md p-4">
                      <div className="font-medium text-lg">{t.name}</div>
                      <div className="text-sm text-black font-semibold">{t.role} {t.isFounder && '(Founder)'}</div>
                      <div className="text-sm text-black/60 mt-1">{t.email} • {t.fullTime ? 'Full-time' : 'Part-time'}</div>
                    </div>
                  ))}
                  {sTeam.length === 0 && <p className="text-sm text-black/60">No team members listed.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {canEdit && (
            <TabsContent value="settings">
              <Card>
                <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
                <CardContent className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label>Startup Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>One-Liner</Label>
                    <Input value={formData.oneLiner} onChange={e => setFormData({...formData, oneLiner: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <Button onClick={handleSaveSettings} className="bg-[#1E4133] text-white hover:bg-[#144B3B]">Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

        </div>
      </Tabs>
    </div>
  );
}
