import { Database } from '@/types/database';
import {
  Startup,
  MonthlyMetrics,
  Milestone,
  TeamMember,
  HealthAssessment,
  DataRequest,
  FounderSubmission,
  Mentor,
  MentorRequest,
  MentorMatch,
  FounderActionItem,
  ActivityLog,
  AppNotification,
  RegulatoryItem,
  User,
  Sector,
  Stage,
  IPStatus,
  CommercialSignal,
  RegTag,
  FittTracker,
  InvestibilityScore,
  Dimension,
  Band,
  MCSector,
  MCExpertise,
  MCStage,
  MilestoneCategory,
  MilestoneStatus,
  RequestType,
  Role,
} from '@/types';

type StartupRow = Database['public']['Tables']['startups']['Row'];
type FittTrackerRow = Database['public']['Tables']['startup_fitt_trackers']['Row'];
type MetricRow = Database['public']['Tables']['monthly_metrics']['Row'];
type MilestoneRow = Database['public']['Tables']['milestones']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type AssessmentRow = Database['public']['Tables']['health_assessments']['Row'];
type DataRequestRow = Database['public']['Tables']['data_requests']['Row'];
type SubmissionRow = Database['public']['Tables']['founder_submissions']['Row'];
type MentorRow = Database['public']['Tables']['mentors']['Row'];
type MentorRequestRow = Database['public']['Tables']['mentor_requests']['Row'];
type MentorMatchRow = Database['public']['Tables']['mentor_matches']['Row'];
type MentorSessionRow = Database['public']['Tables']['mentor_sessions']['Row'];
type ActionItemRow = Database['public']['Tables']['founder_action_items']['Row'];
type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type RegulatoryItemRow = Database['public']['Tables']['regulatory_items']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function startupFromRow(row: StartupRow, fittTracker?: FittTrackerRow | null): Startup {
  return {
    id: row.id,
    name: row.name,
    oneLiner: row.one_liner || '',
    sector: row.sector as Sector,
    stage: row.stage as Stage,
    cohort: row.cohort,
    foundedOn: row.founded_on,
    website: row.website ?? undefined,
    city: row.city || '',
    managerId: row.manager_id,
    associateId: row.associate_id,
    trl: row.trl,
    trlUpdatedOn: row.trl_updated_on,
    ipStatus: row.ip_status as IPStatus,
    ipOwnershipClear: row.ip_ownership_clear,
    commercialSignal: row.commercial_signal as CommercialSignal,
    grantSanctioned: Number(row.grant_sanctioned),
    grantDisbursed: Number(row.grant_disbursed),
    founderToken: '', // Hashed on DB, populated if needed by founder link
    archived: row.archived,
    regTags: (row.reg_tags || []) as RegTag[],
    fittTracker: fittTracker?.data ? (fittTracker.data as unknown as FittTracker) : undefined,
    investibility: row.investibility ? (row.investibility as unknown as InvestibilityScore) : undefined,
    aiAnalysis: row.ai_analysis ? (row.ai_analysis as unknown as Startup['aiAnalysis']) : undefined,
  };
}

export function metricFromRow(row: MetricRow): MonthlyMetrics {
  return {
    id: row.id,
    startupId: row.startup_id,
    month: row.month,
    cashBalance: Number(row.cash_balance),
    monthlyBurn: Number(row.monthly_burn),
    monthlyRevenue: Number(row.monthly_revenue),
    customerConversations: row.customer_conversations,
    pilots: row.pilots,
    lois: row.lois,
    payingCustomers: row.paying_customers,
    teamFullTime: row.team_full_time,
    teamPartTime: row.team_part_time,
    keyLearnings: row.key_learnings ?? undefined,
    source: row.source as MonthlyMetrics['source'],
    recordedOn: row.recorded_on,
  };
}

export function milestoneFromRow(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    category: row.category as MilestoneCategory,
    targetDate: row.target_date,
    revisedDate: row.revised_date ?? undefined,
    delayReason: row.delay_reason ?? undefined,
    status: row.status as MilestoneStatus,
    percentComplete: row.percent_complete,
    evidenceNote: row.evidence_note ?? undefined,
    evidenceLink: row.evidence_link ?? undefined,
    completedOn: row.completed_on ?? undefined,
    lastUpdatedBy: row.last_updated_by as Milestone['lastUpdatedBy'],
    lastUpdatedOn: row.last_updated_on,
  };
}

export function teamMemberFromRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    startupId: row.startup_id,
    name: row.name,
    role: row.role,
    isFounder: row.is_founder,
    fullTime: row.full_time,
    equityPct: row.equity_pct !== null ? Number(row.equity_pct) : undefined,
    email: row.email,
    phone: row.phone ?? undefined,
  };
}

export function assessmentFromRow(row: AssessmentRow): HealthAssessment {
  return {
    id: row.id,
    startupId: row.startup_id,
    month: row.month,
    profile: row.profile as HealthAssessment['profile'],
    dimensions: (row.dimensions as unknown as Record<Dimension, { autoScore: number; autoReason: string; finalScore: number; comment?: string }>) || {},
    total: row.total,
    band: row.band as Band,
    delta3m: row.delta_3m,
    strengths: row.strengths,
    concerns: row.concerns,
    actions: (row.actions as unknown as HealthAssessment['actions']) || [],
    status: row.status as HealthAssessment['status'],
    preparedBy: row.prepared_by,
    submittedOn: row.submitted_on ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    approvedOn: row.approved_on ?? undefined,
    returnComment: row.return_comment ?? undefined,
  };
}

export function dataRequestFromRow(row: DataRequestRow): DataRequest {
  return {
    id: row.id,
    startupId: row.startup_id,
    type: row.type as RequestType,
    title: row.title,
    message: row.message ?? undefined,
    customQuestions: (row.custom_questions as unknown as DataRequest['customQuestions']) ?? undefined,
    milestoneIds: row.milestone_ids ?? undefined,
    month: row.month ?? undefined,
    dueDate: row.due_date,
    createdBy: row.created_by,
    createdOn: row.created_on,
    status: row.status as DataRequest['status'],
  };
}

export function founderSubmissionFromRow(row: SubmissionRow): FounderSubmission {
  return {
    id: row.id,
    requestId: row.request_id || '',
    startupId: row.startup_id,
    submittedOn: row.submitted_on,
    payload: (row.payload as Record<string, unknown>) || {},
    status: row.status as FounderSubmission['status'],
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedOn: row.reviewed_on ?? undefined,
    reviewComment: row.review_comment ?? undefined,
  };
}

export function mentorFromRow(row: MentorRow): Mentor {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    phone: row.phone ?? undefined,
    linkedin: row.linkedin ?? undefined,
    sectors: (row.sectors || []) as MCSector[],
    expertise: (row.expertise || []) as MCExpertise[],
    stages: (row.stages || []) as MCStage[],
    geography: row.geography as Mentor['geography'],
    availability: row.availability as Mentor['availability'],
    maxActiveMatches: row.max_active_matches,
    bio: row.bio,
    active: row.active,
  };
}

export function mentorRequestFromRow(row: MentorRequestRow): MentorRequest {
  return {
    id: row.id,
    startupId: row.startup_id,
    challenge: row.challenge,
    expertiseNeeded: (row.expertise_needed || []) as MCExpertise[],
    raisedBy: row.raised_by as MentorRequest['raisedBy'],
    createdOn: row.created_on,
    ranked: (row.ranked as unknown as MentorRequest['ranked']) ?? undefined,
    recommendedMentorId: row.recommended_mentor_id ?? undefined,
    status: row.status as MentorRequest['status'],
    mentorId: row.mentor_id ?? undefined,
    note: row.note ?? undefined,
    fittTaskN: row.fitt_task_n ?? undefined,
  };
}

export function mentorMatchFromRow(
  row: MentorMatchRow,
  sessions: MentorSessionRow[] = []
): MentorMatch {
  return {
    id: row.id,
    requestId: row.request_id || '',
    startupId: row.startup_id,
    mentorId: row.mentor_id,
    confirmedBy: row.confirmed_by,
    confirmedOn: row.confirmed_on,
    status: row.status as MentorMatch['status'],
    sessions: sessions.map((s) => ({
      id: s.id,
      date: s.date,
      topic: s.topic,
      nextStep: s.next_step,
      rating: s.rating as 1 | 2 | 3 | 4 | 5 | undefined,
    })),
  };
}

export function founderActionItemFromRow(row: ActionItemRow): FounderActionItem {
  return {
    id: row.id,
    startupId: row.startup_id,
    title: row.title,
    cause: row.cause,
    effect: row.effect,
    fix: row.fix,
    note: row.note ?? undefined,
    sharedBy: row.shared_by,
    sharedOn: row.shared_on,
  };
}

export function activityLogFromRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    startupId: row.startup_id,
    at: row.at,
    actor: row.actor,
    text: row.text,
  };
}

export function notificationFromRow(row: NotificationRow, read = false): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type as AppNotification['type'],
    startupId: row.startup_id ?? undefined,
    startupName: row.startup_name ?? undefined,
    createdAt: row.created_at,
    read,
    targetRole: (row.target_role as Role) ?? undefined,
    targetUserId: row.target_user_id ?? undefined,
    actionUrl: row.action_url ?? undefined,
  };
}

export function regulatoryItemFromRow(row: RegulatoryItemRow): RegulatoryItem {
  return {
    id: row.id,
    title: row.title,
    authority: row.authority,
    kind: row.kind as RegulatoryItem['kind'],
    status: row.status as RegulatoryItem['status'],
    publishedOn: row.published_on,
    consultationClosesOn: row.consultation_closes_on ?? undefined,
    effectiveOn: row.effective_on ?? undefined,
    summary: row.summary,
    sectors: (row.sectors || []) as Sector[],
    directTags: (row.direct_tags || []) as RegTag[],
    indirectTags: (row.indirect_tags || []) as RegTag[],
    whatToCheck: row.what_to_check || [],
    isSample: true,
  };
}

export function userFromProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as Role,
    label: row.label,
    managerId: row.manager_id ?? undefined,
  };
}
