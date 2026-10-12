import {
  ActivityLog,
  Band,
  DataRequest,
  FounderSubmission,
  HealthAssessment,
  Mentor,
  MentorMatch,
  MentorRequest,
  Milestone,
  MonthlyMetrics,
  Startup,
  User,
} from '@/types';
import { getLatestApprovedAssessment, getNeedsAttentionRules } from '@/lib/derived';

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface StartupHealth {
  total: number;
  band: Band;
  delta: number | null;
  source: 'Health Assessment' | 'FITT 6-Month Review';
  asOf?: string;
  concerns?: string;
}

// Same thresholds the FITT tracker UI uses (75 / 60 / 45 % of max).
export function bandFromPct(pct: number): Band {
  if (pct >= 75) return 'HEALTHY';
  if (pct >= 60) return 'WATCH';
  if (pct >= 45) return 'AT_RISK';
  return 'CRITICAL';
}

/**
 * Latest approved health assessment, falling back to the FITT tracker's
 * most recent 6-month review for startups onboarded from a FITT workbook.
 */
export function getStartupHealth(startup: Startup, assessments: HealthAssessment[]): StartupHealth | null {
  const latest = getLatestApprovedAssessment(startup.id, assessments);
  if (latest) {
    return {
      total: latest.total,
      band: latest.band,
      delta: latest.delta3m,
      source: 'Health Assessment',
      asOf: latest.month,
      concerns: latest.concerns || undefined,
    };
  }

  const reviews = startup.fittTracker?.sixMonthReviews || [];
  const review = reviews[reviews.length - 1];
  if (review && typeof review.overallPct === 'number') {
    const total = Math.round(review.overallPct);
    const prev = reviews.length > 1 ? reviews[reviews.length - 2] : undefined;
    return {
      total,
      band: bandFromPct(total),
      delta: prev && typeof prev.overallPct === 'number' ? total - Math.round(prev.overallPct) : null,
      source: 'FITT 6-Month Review',
      asOf: startup.fittTracker?.checkedOn || review.cycle,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Red flags
// ---------------------------------------------------------------------------

export interface StartupRedFlag {
  text: string;
  source: 'AI Analysis' | 'FITT Check-in' | 'Needs Attention' | 'Portfolio Rule';
  evidence?: string;
  critical: boolean;
}

interface RuleData {
  metrics: MonthlyMetrics[];
  assessments: HealthAssessment[];
  milestones: Milestone[];
  dataRequests: DataRequest[];
  submissions: FounderSubmission[];
}

// Rules that describe a genuine risk. Reporting-cadence reminders
// ("no founder update", "assessment missing") are left out to keep the list signal-only.
const RISK_RULES = new Set(['runway', 'health_drop', 'milestone', 'overdue_request']);

export function getStartupRedFlags(startup: Startup, data: RuleData, today: string): StartupRedFlag[] {
  const flags: StartupRedFlag[] = [];

  for (const text of startup.aiAnalysis?.redFlags || []) {
    flags.push({ text, source: 'AI Analysis', critical: false });
  }

  for (const f of startup.fittTracker?.redFlags || []) {
    if (f.value) {
      flags.push({
        text: f.text.replace(/^⚑\s*/, ''),
        source: 'FITT Check-in',
        evidence: f.evidence || undefined,
        critical: true,
      });
    }
  }

  for (const n of startup.fittTracker?.needsAttention || []) {
    if (n.critical) {
      flags.push({ text: n.issue, source: 'Needs Attention', evidence: n.cause || undefined, critical: true });
    }
  }

  for (const r of getNeedsAttentionRules(startup.id, data, today)) {
    if (RISK_RULES.has(r.type)) {
      flags.push({ text: r.text, source: 'Portfolio Rule', critical: r.type === 'runway' });
    }
  }

  const seen = new Set<string>();
  return flags.filter((f) => {
    const key = f.text.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Mentor Connect timeline
// ---------------------------------------------------------------------------

export type MentorEventKind = 'REQUESTED' | 'GRANTED' | 'DECLINED' | 'SESSION' | 'CLOSED';

export interface MentorEvent {
  id: string;
  date: string;
  kind: MentorEventKind;
  title: string;
  detail?: string;
}

export interface MentorSummary {
  pending: number;
  granted: number;
  declined: number;
  activeMatches: number;
  sessions: number;
  events: MentorEvent[];
}

export function getMentorSummary(
  startupId: string,
  requests: MentorRequest[],
  matches: MentorMatch[],
  mentors: Mentor[],
  users: User[]
): MentorSummary {
  const mentorName = (id?: string) => mentors.find((m) => m.id === id)?.name || 'a mentor';
  const userName = (id?: string) => users.find((u) => u.id === id)?.label || id || 'staff';

  const sReqs = requests.filter((r) => r.startupId === startupId);
  const sMatches = matches.filter((m) => m.startupId === startupId);
  const events: MentorEvent[] = [];

  for (const r of sReqs) {
    events.push({
      id: `req-${r.id}`,
      date: r.createdOn,
      kind: 'REQUESTED',
      title: `Mentor requested by ${r.raisedBy === 'FOUNDER' ? 'founder' : 'FITT staff'}`,
      detail: [r.challenge, r.expertiseNeeded?.length ? `Needs: ${r.expertiseNeeded.join(', ')}` : '']
        .filter(Boolean)
        .join(' · '),
    });
    if (r.status === 'DECLINED') {
      events.push({
        id: `dec-${r.id}`,
        date: r.createdOn,
        kind: 'DECLINED',
        title: 'Request declined',
        detail: r.note,
      });
    }
  }

  for (const m of sMatches) {
    events.push({
      id: `match-${m.id}`,
      date: m.confirmedOn,
      kind: 'GRANTED',
      title: `Granted: matched with ${mentorName(m.mentorId)}`,
      detail: `Confirmed by ${userName(m.confirmedBy)}`,
    });
    for (const s of m.sessions || []) {
      events.push({
        id: `sess-${m.id}-${s.id}`,
        date: s.date,
        kind: 'SESSION',
        title: `Session with ${mentorName(m.mentorId)}: ${s.topic}`,
        detail: [s.nextStep ? `Next: ${s.nextStep}` : '', s.rating ? `Rated ${s.rating}/5` : '']
          .filter(Boolean)
          .join(' · '),
      });
    }
    if (m.status === 'CLOSED') {
      const last = [...(m.sessions || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
      events.push({
        id: `closed-${m.id}`,
        date: last?.date || m.confirmedOn,
        kind: 'CLOSED',
        title: `Mentorship with ${mentorName(m.mentorId)} closed`,
      });
    }
  }

  events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return {
    pending: sReqs.filter((r) => r.status === 'PENDING').length,
    granted: sReqs.filter((r) => r.status === 'MATCHED').length,
    declined: sReqs.filter((r) => r.status === 'DECLINED').length,
    activeMatches: sMatches.filter((m) => m.status === 'ACTIVE').length,
    sessions: sMatches.reduce((n, m) => n + (m.sessions?.length || 0), 0),
    events,
  };
}

export function getRecentActivity(startupId: string, logs: ActivityLog[], limit = 5): ActivityLog[] {
  return logs
    .filter((l) => l.startupId === startupId)
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    .slice(0, limit);
}
