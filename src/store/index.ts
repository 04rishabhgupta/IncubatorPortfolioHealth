import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Startup, MonthlyMetrics, HealthAssessment, Mentor, MentorMatch, MentorRequest, Milestone, TeamMember, DataRequest, FounderSubmission, ActivityLog, User, FounderActionItem } from '@/types';
import { startups as seedStartups } from '@/data/seed/startups';
import { metrics as seedMetrics } from '@/data/seed/metrics';
import { assessments as seedAssessments } from '@/data/seed/assessments';
import { mentors as seedMentors } from '@/data/seed/mentors';
import { mentorMatches as seedMatches } from '@/data/seed/mentorMatches';
import { mentorRequests as seedRequests } from '@/data/seed/mentorRequests';
import { milestones as seedMilestones } from '@/data/seed/milestones';
import { teams as seedTeams } from '@/data/seed/teams';
import { dataRequests as seedDataRequests } from '@/data/seed/dataRequests';
import { submissions as seedSubmissions } from '@/data/seed/submissions';
import { users } from '@/data/seed/users';

interface StoreState {
  currentUser: User | null;
  startups: Startup[];
  metrics: MonthlyMetrics[];
  assessments: HealthAssessment[];
  mentors: Mentor[];
  mentorMatches: MentorMatch[];
  mentorRequests: MentorRequest[];
  milestones: Milestone[];
  teams: TeamMember[];
  dataRequests: DataRequest[];
  submissions: FounderSubmission[];
  activityLogs: ActivityLog[];
  founderActionItems: FounderActionItem[];

  // Actions
  login: (user: User) => void;
  logout: () => void;
  resetDemoData: () => void;
  updateAssignment: (startupId: string, managerId: string, associateId: string | null, actor: string) => void;
  addFounderActionItems: (items: Omit<FounderActionItem, 'id'>[]) => void;
  
  // Minimal setters for the demo purposes
  updateStartup: (startup: Startup) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;
  upsertMetric: (metric: MonthlyMetrics) => void;
  updateMilestone: (milestone: Milestone) => void;
  updateAssessment: (assessment: HealthAssessment) => void;
  addAssessment: (assessment: HealthAssessment) => void;
  addMentorRequest: (req: MentorRequest) => void;
  updateMentorRequest: (req: MentorRequest) => void;
  addMentorMatch: (match: MentorMatch) => void;
  updateMentorMatch: (match: MentorMatch) => void;
  addDataRequest: (req: DataRequest) => void;
  updateDataRequest: (req: DataRequest) => void;
  addSubmission: (sub: FounderSubmission) => void;
  updateSubmission: (sub: FounderSubmission) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Zustand's persist middleware snapshots the ENTIRE store to localStorage on
// every set() call (no partialize is configured, since most of this state is
// meant to accumulate demo interactions across reloads). That means a returning
// browser's saved `startups`/`metrics`/etc arrays can predate a newly-added
// seed record (e.g. a new startup) and would silently shadow it forever on
// rehydration. Reconcile by id: keep every persisted record (preserving any
// in-session edits), but append any seed record whose id isn't present yet,
// so new seed data always surfaces for returning users without discarding
// their session state.
const removedStartupIds = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']);

function reconcileById<T extends { id: string; startupId?: string }>(seedArr: T[], persistedArr: T[] | undefined): T[] {
  if (!persistedArr) return seedArr;
  const filteredPersisted = persistedArr.filter(x => {
    if (removedStartupIds.has(x.id)) return false;
    if (x.startupId && removedStartupIds.has(x.startupId)) return false;
    return true;
  });
  const known = new Set(filteredPersisted.map((x) => x.id));
  const missing = seedArr.filter((x) => !known.has(x.id));
  return missing.length ? [...filteredPersisted, ...missing] : filteredPersisted;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentUser: null,
      startups: seedStartups,
      metrics: seedMetrics,
      assessments: seedAssessments,
      mentors: seedMentors,
      mentorMatches: seedMatches,
      mentorRequests: seedRequests,
      milestones: seedMilestones,
      teams: seedTeams,
      dataRequests: seedDataRequests,
      submissions: seedSubmissions,
      activityLogs: [],
      founderActionItems: [],

      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),

      resetDemoData: () => set({
        startups: seedStartups,
        metrics: seedMetrics,
        assessments: seedAssessments,
        mentors: seedMentors,
        mentorMatches: seedMatches,
        mentorRequests: seedRequests,
        milestones: seedMilestones,
        teams: seedTeams,
        dataRequests: seedDataRequests,
        submissions: seedSubmissions,
        activityLogs: [],
        founderActionItems: []
      }),

      updateAssignment: (startupId, managerId, associateId, actor) => set((state) => {
        const startup = state.startups.find(s => s.id === startupId);
        if (!startup) return {};
        let resolvedAssociateId = associateId && associateId !== '' ? associateId : null;
        if (resolvedAssociateId) {
          const assoc = users.find(u => u.id === resolvedAssociateId);
          if (!assoc || assoc.managerId !== managerId) resolvedAssociateId = null;
        }
        const changes: string[] = [];
        if (managerId !== startup.managerId) changes.push(`manager reassigned to ${managerId}`);
        if (resolvedAssociateId !== startup.associateId) changes.push(`associate set to ${resolvedAssociateId ?? 'unassigned'}`);
        if (changes.length === 0) return {};
        const updated: Startup = { ...startup, managerId, associateId: resolvedAssociateId };
        return {
          startups: state.startups.map(s => s.id === startupId ? updated : s),
          activityLogs: [{ id: generateId(), startupId, at: new Date().toISOString(), actor, text: changes.join('; ') }, ...state.activityLogs]
        };
      }),

      addFounderActionItems: (items) => set((state) => ({
        founderActionItems: [...state.founderActionItems, ...items.map(i => ({ ...i, id: generateId() }))]
      })),

      updateStartup: (startup) => set((state) => ({ startups: state.startups.map(s => s.id === startup.id ? startup : s) })),
      addActivityLog: (log) => set((state) => ({ activityLogs: [{ ...log, id: generateId() }, ...state.activityLogs] })),
      upsertMetric: (metric) => set((state) => {
        const exists = state.metrics.find(m => m.id === metric.id || (m.startupId === metric.startupId && m.month === metric.month));
        if (exists) {
          return { metrics: state.metrics.map(m => m.id === exists.id ? { ...metric, id: exists.id } : m) };
        }
        return { metrics: [...state.metrics, metric] };
      }),
      updateMilestone: (milestone) => set((state) => ({ milestones: state.milestones.map(m => m.id === milestone.id ? milestone : m) })),
      updateAssessment: (assessment) => set((state) => ({ assessments: state.assessments.map(a => a.id === assessment.id ? assessment : a) })),
      addAssessment: (assessment) => set((state) => ({ assessments: [...state.assessments, assessment] })),
      addMentorRequest: (req) => set((state) => ({ mentorRequests: [...state.mentorRequests, req] })),
      updateMentorRequest: (req) => set((state) => ({ mentorRequests: state.mentorRequests.map(r => r.id === req.id ? req : r) })),
      addMentorMatch: (match) => set((state) => ({ mentorMatches: [...state.mentorMatches, match] })),
      updateMentorMatch: (match) => set((state) => ({ mentorMatches: state.mentorMatches.map(m => m.id === match.id ? match : m) })),
      addDataRequest: (req) => set((state) => ({ dataRequests: [...state.dataRequests, req] })),
      updateDataRequest: (req) => set((state) => ({ dataRequests: state.dataRequests.map(d => d.id === req.id ? req : d) })),
      addSubmission: (sub) => set((state) => ({ submissions: [...state.submissions, sub] })),
      updateSubmission: (sub) => set((state) => ({ submissions: state.submissions.map(s => s.id === sub.id ? sub : s) }))
    }),
    {
      name: 'fitt-portfolio-os-v4',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<StoreState>;
        return {
          ...currentState,
          ...persisted,
          startups: reconcileById(seedStartups, persisted.startups),
          metrics: reconcileById(seedMetrics, persisted.metrics),
          assessments: reconcileById(seedAssessments, persisted.assessments),
          mentors: reconcileById(seedMentors, persisted.mentors),
          mentorMatches: reconcileById(seedMatches, persisted.mentorMatches),
          mentorRequests: reconcileById(seedRequests, persisted.mentorRequests),
          milestones: reconcileById(seedMilestones, persisted.milestones),
          teams: reconcileById(seedTeams, persisted.teams),
          dataRequests: reconcileById(seedDataRequests, persisted.dataRequests),
          submissions: reconcileById(seedSubmissions, persisted.submissions),
        };
      },
    }
  )
);
