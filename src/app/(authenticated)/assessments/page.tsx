'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Clock,
  FileEdit,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AssessmentsPage() {
  const { currentUser, startups, assessments, updateAssessment, users } = useStore();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'APPROVED' | 'AWAITING_APPROVAL' | 'DRAFT'>('ALL');

  if (!currentUser) return null;

  const accessibleStartups = scopeStartups(currentUser, startups);
  const startupIds = new Set(accessibleStartups.map((s) => s.id));

  const scopedAssessments = assessments
    .filter((a) => startupIds.has(a.startupId))
    .sort((a, b) => b.month.localeCompare(a.month));

  const approved = scopedAssessments.filter((a) => a.status === 'APPROVED');
  const awaiting = scopedAssessments.filter((a) => a.status === 'AWAITING_APPROVAL');
  const drafts = scopedAssessments.filter((a) => a.status === 'DRAFT');

  const avgScore =
    approved.length > 0
      ? Math.round(approved.reduce((acc, cur) => acc + cur.total, 0) / approved.length)
      : 0;

  const filteredAssessments = scopedAssessments.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.status === activeFilter;
  });

  const handleQuickApprove = async (assessmentId: string) => {
    const ass = assessments.find((a) => a.id === assessmentId);
    if (!ass) return;
    const res = await updateAssessment({
      ...ass,
      status: 'APPROVED',
      approvedBy: currentUser.id,
    });
    if (res?.error) {
      toast.error(`Approval failed: ${res.error}`);
      return;
    }
    toast.success('Health assessment approved successfully');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="heading-display text-foreground tracking-tight">Health Assessments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quarterly and monthly venture health scorecards, risk band trajectory, and approval governance.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assessments"
          value={scopedAssessments.length}
          icon={Activity}
          trend="~ All evaluations"
          subtitle="across ventures"
        />
        <StatCard
          title="Approved Scorecards"
          value={approved.length}
          icon={CheckCircle2}
          trend={`~ Avg Score: ${avgScore}/100`}
          subtitle="finalized"
        />
        <StatCard
          title="Awaiting Approval"
          value={awaiting.length}
          icon={Clock}
          trend="~ Pending action"
          subtitle="submitted by portfolio managers"
          valueClassName={awaiting.length > 0 ? "text-amber-600" : ""}
        />
        <StatCard
          title="Draft In-Progress"
          value={drafts.length}
          icon={FileEdit}
          trend="~ Open drafts"
          subtitle="in preparation"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(v) => setActiveFilter(v as 'ALL' | 'APPROVED' | 'AWAITING_APPROVAL' | 'DRAFT')}
        className="w-full"
      >
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="ALL" className="font-medium text-xs">
            All Cycles ({scopedAssessments.length})
          </TabsTrigger>
          <TabsTrigger value="AWAITING_APPROVAL" className="font-medium text-xs">
            Awaiting Approval ({awaiting.length})
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="font-medium text-xs">
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="DRAFT" className="font-medium text-xs">
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table Card */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight">Assessment Scorecard Registry</CardTitle>
            <CardDescription className="text-xs">Continuous quarterly evaluation of technology milestones, operations, and governance.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Startup</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment Cycle</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval Status</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Score & Band</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prepared By</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved By</TableHead>
                <TableHead className="h-9 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((a) => {
                const s = accessibleStartups.find((st) => st.id === a.startupId);
                if (!s) return null;

                const preparer = users.find((u) => u.id === a.preparedBy);
                const approver = users.find((u) => u.id === a.approvedBy);

                return (
                  <TableRow key={a.id} className="hover:bg-muted/50">
                    <TableCell className="px-5 py-3 font-semibold text-foreground">
                      <Link href={`/startups/${s.id}`} className="text-primary hover:underline flex items-center gap-1">
                        <span>{s.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    </TableCell>
                    <TableCell className="px-5 py-3 font-mono text-xs text-muted-foreground font-medium">{a.month}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          a.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : a.status === 'AWAITING_APPROVAL'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {a.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">{a.total}</span>
                        <Badge
                          className={`text-[10px] font-bold ${
                            a.band === 'HEALTHY'
                              ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                              : a.band === 'WATCH'
                              ? 'bg-amber-500 hover:bg-amber-500 text-white'
                              : a.band === 'AT_RISK'
                              ? 'bg-orange-500 hover:bg-orange-500 text-white'
                              : 'bg-destructive hover:bg-destructive text-destructive-foreground'
                          }`}
                        >
                          {a.band}
                        </Badge>
                        {a.delta3m !== null && (
                          <span
                            className={`text-xs font-mono font-bold ${
                              a.delta3m >= 0 ? 'text-emerald-600' : 'text-destructive'
                            }`}
                          >
                            {a.delta3m > 0 ? '▲' : '▼'} {Math.abs(a.delta3m)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-xs text-muted-foreground">{preparer?.label || 'Staff'}</TableCell>
                    <TableCell className="px-5 py-3 text-xs text-muted-foreground">{approver?.label || '—'}</TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      {a.status === 'AWAITING_APPROVAL' && currentUser.role === 'INVESTMENT_MANAGER' ? (
                        <Button
                          size="sm"
                          onClick={() => handleQuickApprove(a.id)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Approve
                        </Button>
                      ) : (
                        <Link href={`/startups/${s.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            Inspect
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAssessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No assessments matching selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
