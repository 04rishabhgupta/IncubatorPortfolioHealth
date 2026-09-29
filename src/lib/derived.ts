import { MonthlyMetrics, HealthAssessment, Milestone, DataRequest, FounderSubmission } from '@/types';

export function getLatestMetrics(startupId: string, metrics: MonthlyMetrics[]): MonthlyMetrics | undefined {
  const startupMetrics = metrics.filter(m => m.startupId === startupId);
  startupMetrics.sort((a, b) => b.month.localeCompare(a.month));
  return startupMetrics[0];
}

export function getRunwayMonths(startupId: string, metrics: MonthlyMetrics[]): number {
  const latest = getLatestMetrics(startupId, metrics);
  if (!latest) return 99;
  return latest.monthlyBurn > 0 ? latest.cashBalance / latest.monthlyBurn : 99;
}

export function getLatestApprovedAssessment(startupId: string, assessments: HealthAssessment[]): HealthAssessment | undefined {
  const approved = assessments.filter(a => a.startupId === startupId && a.status === 'APPROVED');
  approved.sort((a, b) => b.month.localeCompare(a.month));
  return approved[0];
}

export function getNeedsAttentionRules(startupId: string, data: { metrics: MonthlyMetrics[], assessments: HealthAssessment[], milestones: Milestone[], dataRequests: DataRequest[], submissions: FounderSubmission[] }, demoToday: string) {
  const rules = [];
  const runway = getRunwayMonths(startupId, data.metrics);
  if (runway < 3) {
    rules.push({ text: `Runway ${runway.toFixed(1)} months`, type: 'runway' });
  }

  const approved = data.assessments.filter(a => a.startupId === startupId && a.status === 'APPROVED').sort((a, b) => b.month.localeCompare(a.month));
  if (approved.length > 0) {
    const latest = approved[0];
    if (latest.delta3m !== null && latest.delta3m <= -10) {
      rules.push({ text: `Health down ${Math.abs(latest.delta3m)} in 3 months`, type: 'health_drop' });
    }
  }

  const overdueMilestones = data.milestones.filter(m => m.startupId === startupId && ['NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'AT_RISK'].includes(m.status)).filter(m => {
    const target = m.revisedDate || m.targetDate;
    const diffTime = new Date(demoToday).getTime() - new Date(target).getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays > 14;
  });
  if (overdueMilestones.length > 0) {
    rules.push({ text: `${overdueMilestones.length} milestone${overdueMilestones.length > 1 ? 's' : ''} overdue`, type: 'milestone' });
  }

  const recentAcceptedSubmissions = data.submissions.filter(s => s.startupId === startupId && s.status === 'ACCEPTED').filter(s => {
    const diffTime = new Date(demoToday).getTime() - new Date(s.submittedOn).getTime();
    return (diffTime / (1000 * 3600 * 24)) <= 35;
  });
  if (recentAcceptedSubmissions.length === 0) {
    // Find how many days since last
    const allAccepted = data.submissions.filter(s => s.startupId === startupId && s.status === 'ACCEPTED').sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
    if (allAccepted.length > 0) {
      const diffTime = new Date(demoToday).getTime() - new Date(allAccepted[0].submittedOn).getTime();
      const days = Math.floor(diffTime / (1000 * 3600 * 24));
      rules.push({ text: `No founder update for ${days} days`, type: 'founder_update' });
    } else {
      rules.push({ text: `No founder update for >35 days`, type: 'founder_update' });
    }
  }

  const overdueRequests = data.dataRequests.filter(r => r.startupId === startupId && r.status === 'OPEN').filter(r => {
    return new Date(demoToday).getTime() > new Date(r.dueDate).getTime();
  });
  if (overdueRequests.length > 0) {
    rules.push({ text: 'Data request overdue', type: 'overdue_request' });
  }

  // September assessment missing if demoToday is after Oct 12.
  // Wait, the rule is "No approved assessment for the previous month after the 12th of the current month"
  const today = new Date(demoToday);
  if (today.getDate() > 12) {
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const hasApprovedPrev = data.assessments.some(a => a.startupId === startupId && a.month === prevMonthStr && a.status === 'APPROVED');
    if (!hasApprovedPrev) {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      rules.push({ text: `${monthNames[prevMonthDate.getMonth()]} assessment missing`, type: 'assessment_missing' });
    }
  }

  return rules;
}
