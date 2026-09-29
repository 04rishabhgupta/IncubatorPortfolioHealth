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
  const { startups, metrics, assessments, milestones, mentorMatches, dataRequests, addSubmission, updateDataRequest, updateMilestone } = useStore();

  const [finForm, setFinForm] = useState({ cashBalance: '', monthlyRevenue: '' });
  const [tracForm, setTracForm] = useState({ customerConversations: '', pilots: '', payingCustomers: '' });

  const startup = startups.find(s => s.founderToken === token);
  
  if (!startup) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-8 text-center">
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
    <div className="min-h-screen bg-[#F4F6F9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <h1 className="text-3xl font-bold text-black">Founder Portal: {startup.name}</h1>
            <p className="text-black/60 mt-1">Welcome back. Keep your profile updated.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge variant="outline" className="text-lg py-1 px-3 bg-blue-50 border-blue-200 text-blue-800">
              {startup.stage.replace('_', ' ')} • TRL {startup.trl}
            </Badge>
          </div>
        </div>

        {/* KPIs */}
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
              <div className="text-sm font-medium text-black/60">Milestones Done</div>
              <div className="text-2xl font-bold">{sMilestones.filter(m => m.status === 'COMPLETED').length} / {sMilestones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-black/60">Active Mentors</div>
              <div className="text-2xl font-bold">{sMatches.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Requests */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-black">Data Requests</CardTitle>
              <CardDescription>Provide requested metrics to your investment team.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {openRequests.length === 0 ? (
                <div className="text-center py-8 text-black/60">You have no open data requests!</div>
              ) : (
                openRequests.map(req => (
                  <div key={req.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{req.title}</h3>
                        <p className="text-sm text-black/60">Due: <span className="font-medium text-red-600">{req.dueDate}</span></p>
                      </div>
                      <Badge variant="outline">{req.type.replace('_', ' ')}</Badge>
                    </div>

                    {req.type === 'MONTHLY_FINANCIALS' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Cash Balance (₹)</Label>
                          <Input type="number" placeholder="e.g. 5000000" value={finForm.cashBalance} onChange={e => setFinForm({...finForm, cashBalance: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Monthly Revenue (₹)</Label>
                          <Input type="number" placeholder="e.g. 100000" value={finForm.monthlyRevenue} onChange={e => setFinForm({...finForm, monthlyRevenue: e.target.value})} />
                        </div>
                        <Button className="w-full bg-[#1E4133] text-white hover:bg-[#144B3B]" onClick={() => handleFinancialSubmit(req)}>Submit Financials</Button>
                      </div>
                    )}

                    {req.type === 'TRACTION' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Customer Conversations</Label>
                          <Input type="number" value={tracForm.customerConversations} onChange={e => setTracForm({...tracForm, customerConversations: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Active Pilots</Label>
                          <Input type="number" value={tracForm.pilots} onChange={e => setTracForm({...tracForm, pilots: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Paying Customers</Label>
                          <Input type="number" value={tracForm.payingCustomers} onChange={e => setTracForm({...tracForm, payingCustomers: e.target.value})} />
                        </div>
                        <Button className="w-full bg-[#1E4133] text-white hover:bg-[#144B3B]" onClick={() => handleTractionSubmit(req)}>Submit Traction Data</Button>
                      </div>
                    )}

                    {req.type === 'MILESTONE_STATUS' && (
                      <div className="space-y-4">
                        <p className="text-sm">Please update your milestones in the section below. Once updated, click submit to notify the team.</p>
                        <Button className="w-full bg-[#1E4133] text-white hover:bg-[#144B3B]" onClick={() => {
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
          <Card>
            <CardHeader>
              <CardTitle>Milestones Progress</CardTitle>
              <CardDescription>Update progress on your active milestones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sMilestones.length === 0 && <p className="text-sm text-black/60">No active milestones.</p>}
                {sMilestones.map(m => (
                  <div key={m.id} className="border rounded-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium">{m.title}</div>
                      <Badge variant="secondary">{m.category}</Badge>
                    </div>
                    <div className="text-xs text-black/60 flex gap-4">
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
                          <SelectTrigger className="h-8 text-xs">
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
                          className="h-8 text-xs w-20" 
                          placeholder="%" 
                          value={m.percentComplete} 
                          onChange={(e) => {
                            updateMilestone({ ...m, percentComplete: Number(e.target.value), lastUpdatedBy: 'FOUNDER', lastUpdatedOn: new Date().toISOString().split('T')[0] });
                          }}
                        />
                        <span className="text-xs text-black/60">% Done</span>
                      </div>
                    </div>
                    {['DELAYED', 'AT_RISK'].includes(m.status) && (
                      <Input 
                        placeholder="Reason for delay..." 
                        className="h-8 text-xs" 
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
