'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { getLatestApprovedAssessment, getRunwayMonths } from '@/lib/derived';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DataRequest } from '@/types';

export default function FounderPortal() {
  const params = useParams();
  const token = params.token as string;
  const { startups, metrics, assessments, milestones, mentorMatches, dataRequests, founderActionItems, addSubmission, updateDataRequest, updateMilestone } = useStore();

  const [finForm, setFinForm] = useState({ cashBalance: '', monthlyRevenue: '' });
  const [tracForm, setTracForm] = useState({ customerConversations: '', pilots: '', payingCustomers: '' });

  const startup = startups.find(s => s.founderToken === token);
  
  if (!startup) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-black/60">Invalid token or startup not found.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sMetrics = metrics.filter(m => m.startupId === startup.id).sort((a, b) => a.month.localeCompare(b.month));
  const runway = getRunwayMonths(startup.id, metrics);
  
  const latestAss = getLatestApprovedAssessment(startup.id, assessments);
  
  const sMilestones = milestones.filter(m => m.startupId === startup.id);
  const sMatches = mentorMatches.filter(m => m.startupId === startup.id && m.status === 'ACTIVE');
  const openRequests = dataRequests.filter(r => r.startupId === startup.id && r.status === 'OPEN');
  const sActionItems = founderActionItems.filter(a => a.startupId === startup.id);

  const handleFinancialSubmit = (req: DataRequest) => {
    addSubmission({
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      requestId: req.id,
      startupId: startup.id,
      submittedOn: new Date().toISOString().split('T')[0],
      payload: { 
        cashBalance: Number(finForm.cashBalance), 
        monthlyRevenue: Number(finForm.monthlyRevenue) 
      },
      status: 'PENDING_REVIEW'
    });
    updateDataRequest({ ...req, status: 'SUBMITTED' });
    toast.success('Financials submitted successfully');
    setFinForm({ cashBalance: '', monthlyRevenue: '' });
  };

  const handleTractionSubmit = (req: DataRequest) => {
    addSubmission({
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      requestId: req.id,
      startupId: startup.id,
      submittedOn: new Date().toISOString().split('T')[0],
      payload: { 
        customerConversations: Number(tracForm.customerConversations), 
        pilots: Number(tracForm.pilots),
        payingCustomers: Number(tracForm.payingCustomers)
      },
      status: 'PENDING_REVIEW'
    });
    updateDataRequest({ ...req, status: 'SUBMITTED' });
    toast.success('Traction data submitted successfully');
    setTracForm({ customerConversations: '', pilots: '', payingCustomers: '' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-2xs border border-zinc-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">Founder Portal: {startup.name}</h1>
            <p className="text-zinc-500 text-sm mt-1">Welcome back. Keep your profile updated and upload operating metrics.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge variant="outline" className="text-sm py-1 px-3 bg-blue-50 border-blue-200 text-blue-700 font-semibold">
              {startup.stage.replace('_', ' ')} • TRL {startup.trl}
            </Badge>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-zinc-200 shadow-2xs">
            <CardContent className="p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Runway</div>
              <div className={`text-2xl font-black font-mono mt-1 ${runway < 3 ? 'text-red-600' : 'text-zinc-900'}`}>{runway.toFixed(1)}m</div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 shadow-2xs">
            <CardContent className="p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Health Band</div>
              <div className="text-2xl font-black font-mono mt-1">
                {latestAss ? (
                  <span className={latestAss.band === 'HEALTHY' ? 'text-emerald-600' : latestAss.band === 'WATCH' ? 'text-amber-600' : latestAss.band === 'AT_RISK' ? 'text-orange-600' : 'text-red-600'}>{latestAss.band}</span>
                ) : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 shadow-2xs">
            <CardContent className="p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Milestones Done</div>
              <div className="text-2xl font-black font-mono text-zinc-900 mt-1">{sMilestones.filter(m => m.status === 'COMPLETED').length} / {sMilestones.length}</div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 shadow-2xs">
            <CardContent className="p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Mentors</div>
              <div className="text-2xl font-black font-mono text-zinc-900 mt-1">{sMatches.length}</div>
            </CardContent>
          </Card>
        </div>

        {sActionItems.length > 0 && (
          <Card className="border-amber-200 shadow-2xs">
            <CardHeader className="bg-amber-50/50 border-b border-amber-100">
              <CardTitle className="text-zinc-900 text-lg">Action Items</CardTitle>
              <CardDescription>Shared by your investment team &mdash; please review and act on these.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {sActionItems.map(item => (
                <div key={item.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base text-zinc-900">{item.title}</h3>
                    <Badge variant="outline" className="text-xs font-mono">{item.sharedOn}</Badge>
                  </div>
                  <div className="text-sm text-zinc-600 space-y-1">
                    <div><span className="font-semibold text-zinc-900">Why:</span> {item.cause}</div>
                    <div><span className="font-semibold text-zinc-900">Effect:</span> {item.effect}</div>
                    <div><span className="font-semibold text-zinc-900">What to do:</span> {item.fix}</div>
                    {item.note && <div className="italic text-zinc-500 mt-1">&ldquo;{item.note}&rdquo;</div>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Requests */}
          <Card className="border-zinc-200 shadow-2xs">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <CardTitle className="text-zinc-900 text-lg">Data Requests</CardTitle>
              <CardDescription>Provide requested metrics to your investment team.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {openRequests.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">You have no open data requests!</div>
              ) : (
                openRequests.map(req => (
                  <div key={req.id} className="border border-zinc-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base text-zinc-900">{req.title}</h3>
                        <p className="text-sm text-zinc-500">Due: <span className="font-semibold text-red-600">{req.dueDate}</span></p>
                      </div>
                      <Badge variant="outline" className="text-xs">{req.type.replace('_', ' ')}</Badge>
                    </div>

                    {req.type === 'MONTHLY_FINANCIALS' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-zinc-700">Cash Balance (₹)</Label>
                          <Input type="number" placeholder="e.g. 5000000" value={finForm.cashBalance} onChange={e => setFinForm({...finForm, cashBalance: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-zinc-700">Monthly Revenue (₹)</Label>
                          <Input type="number" placeholder="e.g. 100000" value={finForm.monthlyRevenue} onChange={e => setFinForm({...finForm, monthlyRevenue: e.target.value})} />
                        </div>
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold" onClick={() => handleFinancialSubmit(req)}>Submit Financials</Button>
                      </div>
                    )}

                    {req.type === 'TRACTION' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-zinc-700">Customer Conversations</Label>
                          <Input type="number" value={tracForm.customerConversations} onChange={e => setTracForm({...tracForm, customerConversations: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-zinc-700">Active Pilots</Label>
                          <Input type="number" value={tracForm.pilots} onChange={e => setTracForm({...tracForm, pilots: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-zinc-700">Paying Customers</Label>
                          <Input type="number" value={tracForm.payingCustomers} onChange={e => setTracForm({...tracForm, payingCustomers: e.target.value})} />
                        </div>
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold" onClick={() => handleTractionSubmit(req)}>Submit Traction Data</Button>
                      </div>
                    )}

                    {req.type === 'MILESTONE_STATUS' && (
                      <div className="space-y-4">
                        <p className="text-sm text-zinc-600">Please update your milestones in the section below. Once updated, click submit to notify the team.</p>
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold" onClick={() => {
                          updateDataRequest({ ...req, status: 'SUBMITTED' });
                          toast.success('Milestone updates submitted');
                        }}>Confirm Milestones Updated</Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="border-zinc-200 shadow-2xs">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-200">
              <CardTitle className="text-zinc-900 text-lg">Milestones Progress</CardTitle>
              <CardDescription>Update progress on your active milestones.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {sMilestones.length === 0 && <p className="text-sm text-zinc-500">No active milestones.</p>}
                {sMilestones.map(m => (
                  <div key={m.id} className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-zinc-900 text-sm">{m.title}</div>
                      <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-700">{m.category}</Badge>
                    </div>
                    <div className="text-xs text-zinc-500 flex gap-4 font-mono">
                      <span>Target: {m.targetDate}</span>
                      {m.revisedDate && <span>Revised: {m.revisedDate}</span>}
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="w-1/3">
                        <Select 
                          value={m.status} 
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onValueChange={(val: any) => {
                            updateMilestone({ ...m, status: val, lastUpdatedBy: 'FOUNDER', lastUpdatedOn: new Date().toISOString().split('T')[0] });
                            toast.success('Milestone status updated');
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs border-zinc-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="DELAYED">Delayed</SelectItem>
                            <SelectItem value="AT_RISK">At Risk</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <Input 
                          type="number" 
                          className="h-8 text-xs w-20 border-zinc-200 font-mono" 
                          placeholder="%" 
                          value={m.percentComplete} 
                          onChange={(e) => {
                            updateMilestone({ ...m, percentComplete: Number(e.target.value), lastUpdatedBy: 'FOUNDER', lastUpdatedOn: new Date().toISOString().split('T')[0] });
                          }}
                        />
                        <span className="text-xs text-zinc-500 font-medium">% Done</span>
                      </div>
                    </div>
                    {['DELAYED', 'AT_RISK'].includes(m.status) && (
                      <Input 
                        placeholder="Reason for delay..." 
                        className="h-8 text-xs border-zinc-200" 
                        value={m.delayReason || ''}
                        onChange={(e) => {
                          updateMilestone({ ...m, delayReason: e.target.value, lastUpdatedBy: 'FOUNDER', lastUpdatedOn: new Date().toISOString().split('T')[0] });
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
