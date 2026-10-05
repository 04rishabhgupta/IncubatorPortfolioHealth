'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { toast } from 'sonner';
import { RequestType } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function SubmissionsPage() {
  const { currentUser, startups, submissions, dataRequests, updateSubmission, addDataRequest } = useStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'requests'>('pending');
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // New Request Form State
  const [targetStartupId, setTargetStartupId] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState<RequestType>('MONTHLY_FINANCIALS');
  const [dueDate, setDueDate] = useState('');

  if (!currentUser) return null;

  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map((s) => s.id));

  const scopedSubmissions = submissions
    .filter((s) => startupIds.has(s.startupId))
    .sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());

  const scopedRequests = dataRequests
    .filter((r) => startupIds.has(r.startupId))
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const pending = scopedSubmissions.filter((s) => s.status === 'PENDING_REVIEW');
  const accepted = scopedSubmissions.filter((s) => s.status === 'ACCEPTED');
  const openRequests = scopedRequests.filter((r) => r.status === 'OPEN');
  const overdueRequests = openRequests.filter((r) => new Date().getTime() > new Date(r.dueDate).getTime());

  const handleApprove = (subId: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;
    updateSubmission({
      ...sub,
      status: 'ACCEPTED',
      reviewedBy: currentUser.label,
      reviewedOn: new Date().toISOString().split('T')[0],
    });
    toast.success('Submission accepted and logged');
  };

  const handleReject = (subId: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;
    updateSubmission({
      ...sub,
      status: 'RETURNED',
      reviewedBy: currentUser.label,
      reviewedOn: new Date().toISOString().split('T')[0],
    });
    toast.error('Submission returned for founder revision');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const stId = targetStartupId || accessibleStartups[0]?.id;
    if (!stId) {
      toast.error('Please select a startup');
      return;
    }
    if (!reqTitle.trim()) {
      toast.error('Please provide a request title');
      return;
    }
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    addDataRequest({
      id: `dr-${Date.now().toString(36)}`,
      startupId: stId,
      createdBy: currentUser.id,
      createdOn: new Date().toISOString().split('T')[0],
      title: reqTitle.trim(),
      type: reqType,
      dueDate,
      status: 'OPEN',
    });

    toast.success('Data request created successfully');
    setRequestModalOpen(false);
    setReqTitle('');
    setDueDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4E4E7] gap-4">
        <div>
          <h1 className="heading-display text-zinc-900 tracking-tight" style={{ fontSize: 'var(--type-display)' }}>
            Founder Submissions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Review monthly MIS uploads, financial accounts, and track pending compliance data requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setRequestModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 rounded-lg gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Data Request</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Reviews"
          value={pending.length}
          icon={Clock}
          trend="~ Needs action"
          subtitle="awaiting verification"
          valueClassName={pending.length > 0 ? "text-amber-600" : ""}
        />
        <StatCard
          title="Accepted Submissions"
          value={accepted.length}
          icon={FileCheck}
          trend="~ Verified & logged"
          subtitle="records synced"
        />
        <StatCard
          title="Open Data Requests"
          value={openRequests.length}
          icon={FileText}
          trend="~ Active requests"
          subtitle="dispatched to founders"
        />
        <StatCard
          title="Overdue Filings"
          value={overdueRequests.length}
          icon={AlertTriangle}
          trend="~ Escalation required"
          subtitle="past submission deadline"
          valueClassName={overdueRequests.length > 0 ? "text-destructive" : ""}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'accepted' | 'requests')} className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="pending" className="font-medium text-xs">
            Pending Review ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="font-medium text-xs">
            Accepted ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="font-medium text-xs">
            Open Requests ({openRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING */}
        <TabsContent value="pending" className="mt-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold tracking-tight">Submissions Awaiting Verification</CardTitle>
              <CardDescription className="text-xs">Founders have submitted data files. Review and verify to update venture records.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted On</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Title</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((sub) => {
                    const s = accessibleStartups.find((st) => st.id === sub.startupId);
                    const req = scopedRequests.find((r) => r.id === sub.requestId);
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/50">
                        <TableCell className="px-5 py-3 font-semibold text-foreground">
                          {s ? (
                            <Link href={`/startups/${s.id}`} className="text-primary hover:underline flex items-center gap-1">
                              <span>{s.name}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 font-mono text-xs text-muted-foreground">{sub.submittedOn}</TableCell>
                        <TableCell className="px-5 py-3 font-medium text-foreground">{req?.title || 'Monthly Operating Update'}</TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge variant="outline" className="text-[10px]">
                            {req?.type || 'MIS'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(sub.id)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(sub.id)}
                            className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground font-medium">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                        No pending submissions. All portfolio company filings are verified!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ACCEPTED */}
        <TabsContent value="accepted" className="mt-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold tracking-tight">Accepted Submissions History</CardTitle>
              <CardDescription className="text-xs">Historical record of all approved filings, metrics, and certificates.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted On</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Title</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviewed By</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accepted.map((sub) => {
                    const s = accessibleStartups.find((st) => st.id === sub.startupId);
                    const req = scopedRequests.find((r) => r.id === sub.requestId);
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/50">
                        <TableCell className="px-5 py-3 font-semibold text-foreground">
                          {s ? (
                            <Link href={`/startups/${s.id}`} className="text-primary hover:underline flex items-center gap-1">
                              <span>{s.name}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 font-mono text-xs text-muted-foreground">{sub.submittedOn}</TableCell>
                        <TableCell className="px-5 py-3 font-medium text-foreground">{req?.title || 'Operating Metrics'}</TableCell>
                        <TableCell className="px-5 py-3 text-muted-foreground font-medium text-xs">{sub.reviewedBy || 'Associate Review'}</TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">VERIFIED</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {accepted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                        No accepted submissions recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: OPEN REQUESTS */}
        <TabsContent value="requests" className="mt-4">
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-bold tracking-tight">Active Data Requests</CardTitle>
              <CardDescription className="text-xs">Formal data requests issued to portfolio founders with statutory deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Title</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedRequests.map((req) => {
                    const s = accessibleStartups.find((st) => st.id === req.startupId);
                    const isOverdue = new Date().getTime() > new Date(req.dueDate).getTime() && req.status === 'OPEN';
                    return (
                      <TableRow key={req.id} className="hover:bg-muted/50">
                        <TableCell className="px-5 py-3 font-semibold text-foreground">
                          {s ? (
                            <Link href={`/startups/${s.id}`} className="text-primary hover:underline flex items-center gap-1">
                              <span>{s.name}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 font-medium text-foreground">{req.title}</TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge variant="outline" className="text-[10px]">
                            {req.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`px-5 py-3 font-mono text-xs ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          {req.dueDate} {isOverdue && '(Overdue)'}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge
                            className={`text-[10px] ${
                              isOverdue
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive'
                                : req.status === 'OPEN'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-600'
                            }`}
                          >
                            {isOverdue ? 'OVERDUE' : req.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E4E4E7] animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#E4E4E7]">
              <h2 className="text-lg font-bold text-zinc-900">Create New Data Request</h2>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 mt-4">
              <div>
                <Label className="text-xs font-semibold text-zinc-700">Portfolio Startup</Label>
                <select
                  value={targetStartupId}
                  onChange={(e) => setTargetStartupId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[#E4E4E7] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {accessibleStartups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700">Request Title</Label>
                <Input
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Q3 Utilization Certificate & Financial MIS"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700">Request Category</Label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as RequestType)}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[#E4E4E7] rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="MONTHLY_FINANCIALS">Monthly Financials & MIS</option>
                  <option value="MILESTONE_STATUS">Milestone Status & Evidence</option>
                  <option value="TRACTION">Traction & Growth KPIs</option>
                  <option value="CUSTOM">Custom Document / Utilization Certificate</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-zinc-700">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Send Data Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
