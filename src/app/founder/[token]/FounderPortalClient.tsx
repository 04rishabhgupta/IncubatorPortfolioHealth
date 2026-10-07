'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Startup,
  MonthlyMetrics,
  HealthAssessment,
  Milestone,
  MentorMatch,
  DataRequest,
  FounderActionItem,
  MilestoneStatus,
} from '@/types';
import { getLatestApprovedAssessment, getRunwayMonths } from '@/lib/derived';
import {
  submitFounderDataAction,
  updateFounderMilestoneAction,
  confirmFounderMilestonesAction,
} from '@/app/actions/founder';
import { uploadMilestoneEvidenceAction } from '@/app/actions/storage';
import {
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Flame,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Paperclip,
  ExternalLink,
  FileCheck,
} from 'lucide-react';

interface FounderPortalClientProps {
  startup: Startup;
  metrics: MonthlyMetrics[];
  assessments: HealthAssessment[];
  initialMilestones: Milestone[];
  initialMentorMatches: MentorMatch[];
  initialDataRequests: DataRequest[];
  initialActionItems: FounderActionItem[];
  token: string;
}

export function FounderPortalClient({
  startup,
  metrics,
  assessments,
  initialMilestones,
  initialMentorMatches,
  initialDataRequests,
  initialActionItems,
  token,
}: FounderPortalClientProps) {
  const [dataRequests, setDataRequests] = useState<DataRequest[]>(initialDataRequests);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [submittingReqId, setSubmittingReqId] = useState<string | null>(null);

  // Form states
  const [finForms, setFinForms] = useState<Record<string, { cashBalance: string; monthlyRevenue: string }>>({});
  const [tracForms, setTracForms] = useState<
    Record<string, { customerConversations: string; pilots: string; payingCustomers: string }>
  >({});

  const runway = getRunwayMonths(startup.id, metrics);
  const latestAss = getLatestApprovedAssessment(startup.id, assessments);
  const openRequests = dataRequests.filter((r) => r.status === 'OPEN');
  const completedMilestonesCount = milestones.filter((m) => m.status === 'COMPLETED').length;

  const handleFinancialSubmit = async (req: DataRequest) => {
    const form = finForms[req.id] || { cashBalance: '', monthlyRevenue: '' };
    if (!form.cashBalance && !form.monthlyRevenue) {
      toast.error('Please enter at least one metric to submit');
      return;
    }

    setSubmittingReqId(req.id);
    try {
      const res = await submitFounderDataAction({
        token,
        requestId: req.id,
        payload: {
          cashBalance: form.cashBalance ? Number(form.cashBalance) : undefined,
          monthlyRevenue: form.monthlyRevenue ? Number(form.monthlyRevenue) : undefined,
        },
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      // Optimistically update request status to SUBMITTED
      setDataRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'SUBMITTED' } : r))
      );
      toast.success('Financial metrics submitted successfully! Your investment manager has been notified.');
      setFinForms((prev) => ({ ...prev, [req.id]: { cashBalance: '', monthlyRevenue: '' } }));
    } catch {
      toast.error('Failed to submit financials');
    } finally {
      setSubmittingReqId(null);
    }
  };

  const handleTractionSubmit = async (req: DataRequest) => {
    const form = tracForms[req.id] || { customerConversations: '', pilots: '', payingCustomers: '' };
    if (!form.customerConversations && !form.pilots && !form.payingCustomers) {
      toast.error('Please enter at least one traction metric');
      return;
    }

    setSubmittingReqId(req.id);
    try {
      const res = await submitFounderDataAction({
        token,
        requestId: req.id,
        payload: {
          customerConversations: form.customerConversations ? Number(form.customerConversations) : undefined,
          pilots: form.pilots ? Number(form.pilots) : undefined,
          payingCustomers: form.payingCustomers ? Number(form.payingCustomers) : undefined,
        },
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setDataRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'SUBMITTED' } : r))
      );
      toast.success('Traction data submitted successfully! Your team has been notified.');
      setTracForms((prev) => ({
        ...prev,
        [req.id]: { customerConversations: '', pilots: '', payingCustomers: '' },
      }));
    } catch {
      toast.error('Failed to submit traction data');
    } finally {
      setSubmittingReqId(null);
    }
  };

  const handleConfirmMilestones = async (req: DataRequest) => {
    setSubmittingReqId(req.id);
    try {
      const res = await confirmFounderMilestonesAction({
        token,
        requestId: req.id,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setDataRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'SUBMITTED' } : r))
      );
      toast.success('Milestone progress confirmed and submitted to management.');
    } catch {
      toast.error('Failed to confirm milestones');
    } finally {
      setSubmittingReqId(null);
    }
  };

  const handleMilestoneStatusChange = async (milestone: Milestone, newStatus: MilestoneStatus) => {
    const prevMilestones = milestones;
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestone.id
          ? {
              ...m,
              status: newStatus,
              lastUpdatedBy: 'FOUNDER',
              lastUpdatedOn: new Date().toISOString().split('T')[0],
              completedOn: newStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : m.completedOn,
              percentComplete: newStatus === 'COMPLETED' ? 100 : m.percentComplete,
            }
          : m
      )
    );

    try {
      const res = await updateFounderMilestoneAction({
        token,
        milestoneId: milestone.id,
        status: newStatus,
        percentComplete: newStatus === 'COMPLETED' ? 100 : milestone.percentComplete,
      });

      if (res.error) {
        setMilestones(prevMilestones);
        toast.error(res.error);
        return;
      }

      toast.success(`Milestone "${milestone.title}" updated to ${newStatus.replace('_', ' ')}`);
    } catch {
      setMilestones(prevMilestones);
      toast.error('Failed to update milestone status');
    }
  };

  const handleMilestonePercentChange = async (milestone: Milestone, percent: number) => {
    const clamped = Math.min(100, Math.max(0, percent));
    const nextStatus: MilestoneStatus = clamped === 100 ? 'COMPLETED' : clamped > 0 && milestone.status === 'NOT_STARTED' ? 'IN_PROGRESS' : milestone.status;

    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestone.id
          ? {
              ...m,
              percentComplete: clamped,
              status: nextStatus,
              lastUpdatedBy: 'FOUNDER',
              lastUpdatedOn: new Date().toISOString().split('T')[0],
            }
          : m
      )
    );

    try {
      const res = await updateFounderMilestoneAction({
        token,
        milestoneId: milestone.id,
        percentComplete: clamped,
        status: nextStatus,
      });

      if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to save progress percentage');
    }
  };

  const handleMilestoneDelayReasonBlur = async (milestone: Milestone, reason: string) => {
    if (reason === milestone.delayReason) return;
    try {
      const res = await updateFounderMilestoneAction({
        token,
        milestoneId: milestone.id,
        delayReason: reason,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Reason for delay saved');
      }
    } catch {
      toast.error('Failed to save delay reason');
    }
  };

  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);

  const handleEvidenceUpload = async (milestone: Milestone, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidenceId(milestone.id);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('milestoneId', milestone.id);
      formData.append('file', file);

      const res = await uploadMilestoneEvidenceAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestone.id
              ? {
                  ...m,
                  evidenceLink: res.evidenceLink || undefined,
                  lastUpdatedBy: 'FOUNDER',
                  lastUpdatedOn: new Date().toISOString().split('T')[0],
                }
              : m
          )
        );
        toast.success(`Evidence "${file.name}" uploaded to private cloud storage!`);
      }
    } catch {
      toast.error('Failed to upload evidence file');
    } finally {
      setUploadingEvidenceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 pb-16 antialiased">
      {/* Top Banner */}
      <div className="bg-white border-b border-zinc-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20">
              {startup.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                  {startup.name}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs flex items-center gap-1 py-0.5"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Founder Access
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{startup.oneLiner}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="secondary"
              className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 font-medium text-xs px-2.5 py-1"
            >
              Stage: {startup.stage.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 font-semibold text-xs px-2.5 py-1"
            >
              TRL {startup.trl}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-zinc-200 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Operating Runway
                </span>
                <Flame className={`w-4 h-4 ${runway < 3 ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    runway < 3 ? 'text-red-600' : 'text-zinc-900'
                  }`}
                >
                  {runway.toFixed(1)}
                </span>
                <span className="text-xs text-zinc-500 font-medium">months</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Based on reported cash & burn</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Portfolio Health
                </span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2">
                {latestAss ? (
                  <Badge
                    className={`text-sm px-2.5 py-0.5 font-bold ${
                      latestAss.band === 'HEALTHY'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : latestAss.band === 'WATCH'
                        ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : latestAss.band === 'AT_RISK'
                        ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100'
                        : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {latestAss.band.replace('_', ' ')}
                  </Badge>
                ) : (
                  <span className="text-sm font-semibold text-zinc-400">Pending Review</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">Latest approved assessment</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Milestones
                </span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-zinc-900">
                  {completedMilestonesCount}
                </span>
                <span className="text-sm text-zinc-400 font-mono">/ {milestones.length}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Completed targets</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 bg-white shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Active Mentors
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-zinc-900">
                  {initialMentorMatches.length}
                </span>
                <span className="text-xs text-zinc-500 font-medium">mentors matched</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">FITT Mentor Connect</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        {initialActionItems.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30 shadow-2xs">
            <CardHeader className="border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-zinc-950 text-base font-bold">
                  Recommended Action Items
                </CardTitle>
              </div>
              <CardDescription className="text-zinc-600 text-xs">
                Key interventions and priorities shared by your incubator investment team.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {initialActionItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-2xs hover:border-amber-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {item.title}
                    </h3>
                    <Badge variant="outline" className="text-[11px] font-mono text-zinc-500 self-start sm:self-auto">
                      Shared {item.sharedOn}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-600 mt-2 bg-zinc-50/70 p-3 rounded-lg border border-zinc-100">
                    <div>
                      <span className="font-bold text-zinc-800 block mb-0.5">Root Cause:</span>
                      {item.cause}
                    </div>
                    <div>
                      <span className="font-bold text-zinc-800 block mb-0.5">Potential Impact:</span>
                      {item.effect}
                    </div>
                    <div>
                      <span className="font-bold text-zinc-800 block mb-0.5">Recommended Fix:</span>
                      {item.fix}
                    </div>
                  </div>
                  {item.note && (
                    <p className="text-xs text-zinc-500 italic mt-2 pl-2 border-l-2 border-amber-300">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 2-Column Section: Data Requests & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Data Requests */}
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-zinc-950 text-base font-bold">Data Requests</CardTitle>
                </div>
                {openRequests.length > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5">
                    {openRequests.length} Pending
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-zinc-500">
                Submit requested monthly reporting and operating metrics to your investment team.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {openRequests.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-zinc-800">You are all caught up!</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    There are no open data requests pending your response. New requests will appear here.
                  </p>
                </div>
              ) : (
                openRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border border-zinc-200 rounded-xl p-4 sm:p-5 bg-white shadow-2xs space-y-4 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-950">{req.title}</h4>
                        {req.message && <p className="text-xs text-zinc-500 mt-0.5">{req.message}</p>}
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Due date:
                          </span>
                          <span className="font-bold text-red-600 font-mono">{req.dueDate}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold bg-zinc-50 text-zinc-700">
                        {req.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Monthly Financials Form */}
                    {req.type === 'MONTHLY_FINANCIALS' && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700">
                              Cash Balance (₹)
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 5000000"
                              className="h-9 text-xs font-mono"
                              value={finForms[req.id]?.cashBalance || ''}
                              onChange={(e) =>
                                setFinForms((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    cashBalance: e.target.value,
                                    monthlyRevenue: prev[req.id]?.monthlyRevenue || '',
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-zinc-700">
                              Monthly Revenue (₹)
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 250000"
                              className="h-9 text-xs font-mono"
                              value={finForms[req.id]?.monthlyRevenue || ''}
                              onChange={(e) =>
                                setFinForms((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    cashBalance: prev[req.id]?.cashBalance || '',
                                    monthlyRevenue: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 mt-1 flex items-center justify-center gap-1.5"
                          disabled={submittingReqId === req.id}
                          onClick={() => handleFinancialSubmit(req)}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {submittingReqId === req.id ? 'Submitting...' : 'Submit Financials'}
                        </Button>
                      </div>
                    )}

                    {/* Traction Form */}
                    {req.type === 'TRACTION' && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-zinc-700">
                              Conversations
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 25"
                              className="h-9 text-xs font-mono"
                              value={tracForms[req.id]?.customerConversations || ''}
                              onChange={(e) =>
                                setTracForms((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    customerConversations: e.target.value,
                                    pilots: prev[req.id]?.pilots || '',
                                    payingCustomers: prev[req.id]?.payingCustomers || '',
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-zinc-700">
                              Active Pilots
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 3"
                              className="h-9 text-xs font-mono"
                              value={tracForms[req.id]?.pilots || ''}
                              onChange={(e) =>
                                setTracForms((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    customerConversations: prev[req.id]?.customerConversations || '',
                                    pilots: e.target.value,
                                    payingCustomers: prev[req.id]?.payingCustomers || '',
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-zinc-700">
                              Customers
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 1"
                              className="h-9 text-xs font-mono"
                              value={tracForms[req.id]?.payingCustomers || ''}
                              onChange={(e) =>
                                setTracForms((prev) => ({
                                  ...prev,
                                  [req.id]: {
                                    customerConversations: prev[req.id]?.customerConversations || '',
                                    pilots: prev[req.id]?.pilots || '',
                                    payingCustomers: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 mt-1 flex items-center justify-center gap-1.5"
                          disabled={submittingReqId === req.id}
                          onClick={() => handleTractionSubmit(req)}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          {submittingReqId === req.id ? 'Submitting...' : 'Submit Traction Data'}
                        </Button>
                      </div>
                    )}

                    {/* Milestone Status Form */}
                    {req.type === 'MILESTONE_STATUS' && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <p className="text-xs text-zinc-600">
                          Please review and adjust your progress in the Milestones section. When your milestone
                          progress reflects current execution, click below to confirm.
                        </p>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 flex items-center justify-center gap-1.5"
                          disabled={submittingReqId === req.id}
                          onClick={() => handleConfirmMilestones(req)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {submittingReqId === req.id ? 'Confirming...' : 'Confirm Milestones Updated'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Milestones Section */}
          <Card className="border-zinc-200 bg-white shadow-2xs">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-zinc-950 text-base font-bold">Milestones Progress</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-zinc-600">
                  {completedMilestonesCount} / {milestones.length} Completed
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-500">
                Update progress percentages and statuses directly on your incubator milestones.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {milestones.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                  <p className="text-xs text-zinc-500">No active milestones configured for this startup.</p>
                </div>
              ) : (
                milestones.map((m) => (
                  <div
                    key={m.id}
                    className="border border-zinc-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-950 leading-snug">{m.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 font-mono">
                          <span>Target: {m.targetDate}</span>
                          {m.revisedDate && <span className="text-amber-600 font-semibold">Revised: {m.revisedDate}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[11px] bg-zinc-100 text-zinc-700">
                        {m.category}
                      </Badge>
                    </div>

                    {/* Progress slider / % indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500 font-mono">
                        <span>Progress</span>
                        <span className="font-bold text-zinc-800">{m.percentComplete}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : m.status === 'AT_RISK'
                              ? 'bg-orange-500'
                              : m.status === 'DELAYED'
                              ? 'bg-red-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${m.percentComplete}%` }}
                        />
                      </div>
                    </div>

                    {/* Status & % Controls */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <Label className="text-[11px] font-bold text-zinc-600 block mb-1">Status</Label>
                        <Select
                          value={m.status}
                          onValueChange={(val) => handleMilestoneStatusChange(m, val as MilestoneStatus)}
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

                      <div>
                        <Label className="text-[11px] font-bold text-zinc-600 block mb-1">
                          Completion %
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-8 text-xs font-mono border-zinc-200"
                            value={m.percentComplete}
                            onChange={(e) => handleMilestonePercentChange(m, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delay reason if delayed or at risk */}
                    {['DELAYED', 'AT_RISK'].includes(m.status) && (
                      <div className="pt-1 space-y-1">
                        <Label className="text-[11px] font-bold text-amber-700">
                          Reason for Delay / Roadblocks
                        </Label>
                        <Input
                          placeholder="Explain challenges or delays for your incubator mentor..."
                          className="h-8 text-xs border-amber-200 bg-amber-50/20 focus:border-amber-400"
                          defaultValue={m.delayReason || ''}
                          onBlur={(e) => handleMilestoneDelayReasonBlur(m, e.target.value)}
                        />
                      </div>
                    )}

                    {/* Evidence Attachment Section */}
                    <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {m.evidenceLink ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-emerald-600" />
                              Evidence Attached
                            </span>
                            <a
                              href={m.evidenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              View file <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">No evidence file attached yet</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingEvidenceId === m.id}
                            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.doc,.docx"
                            onChange={(e) => handleEvidenceUpload(m, e)}
                          />
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md border border-zinc-200 transition-colors">
                            <Paperclip className="w-3 h-3" />
                            {uploadingEvidenceId === m.id ? 'Uploading...' : m.evidenceLink ? 'Replace File' : 'Upload Evidence'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
