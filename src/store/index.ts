import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Startup,
  MonthlyMetrics,
  HealthAssessment,
  Mentor,
  MentorMatch,
  MentorRequest,
  Milestone,
  TeamMember,
  DataRequest,
  FounderSubmission,
  ActivityLog,
  User,
  FounderActionItem,
  AppNotification,
} from '@/types';
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
import { seedNotifications } from '@/data/seed/notifications';
import { users } from '@/data/seed/users';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { createClient } from '@/lib/supabase/client';
import {
  startupFromRow,
  metricFromRow,
  milestoneFromRow,
  assessmentFromRow,
  mentorFromRow,
  mentorMatchFromRow,
  mentorRequestFromRow,
  dataRequestFromRow,
  founderSubmissionFromRow,
  teamMemberFromRow,
  founderActionItemFromRow,
  activityLogFromRow,
  notificationFromRow,
  userFromProfile,
} from '@/lib/supabase/mappers';

// Initialize seed startups with investibility and AI analysis
const enrichedSeedStartups: Startup[] = seedStartups.map((s) => {
  const startupMetrics = seedMetrics.filter((m) => m.startupId === s.id);
  const investibility = s.investibility || computeInvestibilityScore(s, startupMetrics);
  const aiAnalysis = s.aiAnalysis || generateAIAnalysis(s, startupMetrics);
  return {
    ...s,
    investibility,
    aiAnalysis,
  };
});

interface StoreState {
  currentUser: User | null;
  users: User[];
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
  notifications: AppNotification[];

  // Actions
  login: (user: User) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  resetDemoData: () => void;
  updateAssignment: (startupId: string, managerId: string, associateId: string | null, actor: string) => void;
  addFounderActionItems: (items: Omit<FounderActionItem, 'id'>[]) => void;

  // Startup CRUD
  createStartup: (startup: Startup) => void;
  updateStartup: (startup: Startup) => void;
  deleteStartup: (startupId: string) => void;

  // Notifications
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<AppNotification>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Logging & Metrics
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

const generateId = () => Math.random().toString(36).substring(2, 11);

const removedStartupIds = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10']);

function reconcileById<T extends { id: string; startupId?: string }>(seedArr: T[], persistedArr: T[] | undefined): T[] {
  if (!persistedArr) return seedArr;
  const filteredPersisted = persistedArr.filter((x) => {
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
      currentUser: users[0],
      users: users,
      startups: enrichedSeedStartups,
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
      notifications: seedNotifications,

      login: (user) => set({ currentUser: user }),
      logout: () => {
        try {
          const supabase = createClient();
          supabase.auth.signOut();
        } catch {}
        set({ currentUser: null });
      },

      hydrate: async () => {
        try {
          const supabase = createClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) return;

          const [
            profilesRes,
            startupsRes,
            trackersRes,
            metricsRes,
            milestonesRes,
            assessmentsRes,
            mentorsRes,
            matchesRes,
            sessionsRes,
            mentorReqsRes,
            dataReqsRes,
            submissionsRes,
            teamsRes,
            actionItemsRes,
            logsRes,
            notifsRes,
            recipientsRes,
          ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('startups').select('*'),
            supabase.from('startup_fitt_trackers').select('*'),
            supabase.from('monthly_metrics').select('*'),
            supabase.from('milestones').select('*'),
            supabase.from('health_assessments').select('*'),
            supabase.from('mentors').select('*'),
            supabase.from('mentor_matches').select('*'),
            supabase.from('mentor_sessions').select('*'),
            supabase.from('mentor_requests').select('*'),
            supabase.from('data_requests').select('*'),
            supabase.from('founder_submissions').select('*'),
            supabase.from('team_members').select('*'),
            supabase.from('founder_action_items').select('*'),
            supabase.from('activity_logs').select('*'),
            supabase.from('notifications').select('*'),
            supabase.from('notification_recipients').select('*'),
          ]);

          const loadedUsers = (profilesRes.data || []).map(userFromProfile);
          const currentProfile = profilesRes.data?.find((p) => p.id === authUser.id);
          const currentAppUser = currentProfile ? userFromProfile(currentProfile) : null;

          const trackerMap = new Map((trackersRes.data || []).map((t) => [t.startup_id, t]));
          const loadedStartups = (startupsRes.data || []).map((s) => startupFromRow(s, trackerMap.get(s.id)));

          const loadedMetrics = (metricsRes.data || []).map(metricFromRow);
          const loadedMilestones = (milestonesRes.data || []).map(milestoneFromRow);
          const loadedAssessments = (assessmentsRes.data || []).map(assessmentFromRow);
          const loadedMentors = (mentorsRes.data || []).map(mentorFromRow);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sessionMap = new Map<string, any[]>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sessionsRes.data || []).forEach((ses: any) => {
            const arr = sessionMap.get(ses.match_id) || [];
            arr.push(ses);
            sessionMap.set(ses.match_id, arr);
          });
          const loadedMatches = (matchesRes.data || []).map((m) => mentorMatchFromRow(m, sessionMap.get(m.id) || []));
          const loadedMentorReqs = (mentorReqsRes.data || []).map(mentorRequestFromRow);

          const loadedDataReqs = (dataReqsRes.data || []).map(dataRequestFromRow);
          const loadedSubmissions = (submissionsRes.data || []).map(founderSubmissionFromRow);
          const loadedTeams = (teamsRes.data || []).map(teamMemberFromRow);
          const loadedActionItems = (actionItemsRes.data || []).map(founderActionItemFromRow);
          const loadedLogs = (logsRes.data || []).map(activityLogFromRow);

          const readMap = new Map((recipientsRes.data || []).map((r) => [r.notification_id, Boolean(r.read_at)]));
          const loadedNotifications = (notifsRes.data || []).map((n) => notificationFromRow(n, readMap.get(n.id) || false));

          set((state) => ({
            currentUser: currentAppUser || state.currentUser,
            users: loadedUsers.length > 0 ? loadedUsers : state.users,
            startups: loadedStartups.length > 0 ? loadedStartups : state.startups,
            metrics: loadedMetrics.length > 0 ? loadedMetrics : state.metrics,
            milestones: loadedMilestones.length > 0 ? loadedMilestones : state.milestones,
            assessments: loadedAssessments.length > 0 ? loadedAssessments : state.assessments,
            mentors: loadedMentors.length > 0 ? loadedMentors : state.mentors,
            mentorMatches: loadedMatches.length > 0 ? loadedMatches : state.mentorMatches,
            mentorRequests: loadedMentorReqs.length > 0 ? loadedMentorReqs : state.mentorRequests,
            dataRequests: loadedDataReqs.length > 0 ? loadedDataReqs : state.dataRequests,
            submissions: loadedSubmissions.length > 0 ? loadedSubmissions : state.submissions,
            teams: loadedTeams.length > 0 ? loadedTeams : state.teams,
            founderActionItems: loadedActionItems.length > 0 ? loadedActionItems : state.founderActionItems,
            activityLogs: loadedLogs.length > 0 ? loadedLogs : state.activityLogs,
            notifications: loadedNotifications.length > 0 ? loadedNotifications : state.notifications,
          }));
        } catch (err) {
          console.error('Failed to hydrate from Supabase:', err);
        }
      },

      resetDemoData: () =>
        set({
          startups: enrichedSeedStartups,
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
          notifications: seedNotifications,
        }),

      updateAssignment: (startupId, managerId, associateId, actor) =>
        set((state) => {
          const startup = state.startups.find((s) => s.id === startupId);
          if (!startup) return {};
          let resolvedAssociateId = associateId && associateId !== '' ? associateId : null;
          if (resolvedAssociateId) {
            const assoc = users.find((u) => u.id === resolvedAssociateId);
            if (!assoc || assoc.managerId !== managerId) resolvedAssociateId = null;
          }
          const changes: string[] = [];
          if (managerId !== startup.managerId) changes.push(`manager reassigned to ${managerId}`);
          if (resolvedAssociateId !== startup.associateId)
            changes.push(`associate set to ${resolvedAssociateId ?? 'unassigned'}`);
          if (changes.length === 0) return {};
          const updated: Startup = { ...startup, managerId, associateId: resolvedAssociateId };
          return {
            startups: state.startups.map((s) => (s.id === startupId ? updated : s)),
            activityLogs: [
              { id: generateId(), startupId, at: new Date().toISOString(), actor, text: changes.join('; ') },
              ...state.activityLogs,
            ],
          };
        }),

      addFounderActionItems: (items) =>
        set((state) => ({
          founderActionItems: [...state.founderActionItems, ...items.map((i) => ({ ...i, id: generateId() }))],
        })),

      // Startup CRUD
      createStartup: (startup) =>
        set((state) => {
          const investibility = startup.investibility || computeInvestibilityScore(startup);
          const aiAnalysis = startup.aiAnalysis || generateAIAnalysis(startup);
          const enriched: Startup = {
            ...startup,
            investibility,
            aiAnalysis,
          };
          const newNotif: AppNotification = {
            id: generateId(),
            title: 'New Startup Created',
            message: `${enriched.name} (${enriched.sector}) has been added to the incubator portfolio.`,
            type: 'STARTUP_UPDATE',
            startupId: enriched.id,
            startupName: enriched.name,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: `/startups/${enriched.id}`,
          };
          return {
            startups: [enriched, ...state.startups],
            notifications: [newNotif, ...state.notifications],
            activityLogs: [
              {
                id: generateId(),
                startupId: enriched.id,
                at: new Date().toISOString(),
                actor: state.currentUser?.label || 'Staff',
                text: `Startup ${enriched.name} created and AI analysis generated`,
              },
              ...state.activityLogs,
            ],
          };
        }),

      updateStartup: (startup) =>
        set((state) => {
          const startupMetrics = state.metrics.filter((m) => m.startupId === startup.id);
          const investibility = computeInvestibilityScore(startup, startupMetrics);
          const aiAnalysis = generateAIAnalysis(startup, startupMetrics);
          const enriched: Startup = {
            ...startup,
            investibility,
            aiAnalysis,
          };
          return {
            startups: state.startups.map((s) => (s.id === startup.id ? enriched : s)),
            activityLogs: [
              {
                id: generateId(),
                startupId: startup.id,
                at: new Date().toISOString(),
                actor: state.currentUser?.label || 'Staff',
                text: `Updated profile & recomputed AI diagnostics for ${startup.name}`,
              },
              ...state.activityLogs,
            ],
          };
        }),

      deleteStartup: (startupId) =>
        set((state) => {
          const existing = state.startups.find((s) => s.id === startupId);
          return {
            startups: state.startups.filter((s) => s.id !== startupId),
            notifications: [
              {
                id: generateId(),
                title: 'Startup Removed',
                message: `${existing?.name || startupId} was removed from the portfolio.`,
                type: 'STARTUP_UPDATE',
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...state.notifications,
            ],
            activityLogs: [
              {
                id: generateId(),
                startupId,
                at: new Date().toISOString(),
                actor: state.currentUser?.label || 'Staff',
                text: `Deleted startup ${existing?.name || startupId}`,
              },
              ...state.activityLogs,
            ],
          };
        }),

      // Notifications
      addNotification: (notif) =>
        set((state) => ({
          notifications: [
            {
              id: notif.id || generateId(),
              createdAt: notif.createdAt || new Date().toISOString(),
              read: false,
              ...notif,
            },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      addActivityLog: (log) =>
        set((state) => ({ activityLogs: [{ ...log, id: generateId() }, ...state.activityLogs] })),

      upsertMetric: (metric) =>
        set((state) => {
          const exists = state.metrics.find(
            (m) => m.id === metric.id || (m.startupId === metric.startupId && m.month === metric.month)
          );
          const nextMetrics = exists
            ? state.metrics.map((m) => (m.id === exists.id ? { ...metric, id: exists.id } : m))
            : [...state.metrics, metric];

          // Recompute target startup AI analysis and investibility with new metrics
          const targetStartup = state.startups.find((s) => s.id === metric.startupId);
          let updatedStartups = state.startups;
          if (targetStartup) {
            const sm = nextMetrics.filter((m) => m.startupId === targetStartup.id);
            const investibility = computeInvestibilityScore(targetStartup, sm);
            const aiAnalysis = generateAIAnalysis(targetStartup, sm);
            updatedStartups = state.startups.map((s) =>
              s.id === targetStartup.id ? { ...s, investibility, aiAnalysis } : s
            );
          }

          return {
            metrics: nextMetrics,
            startups: updatedStartups,
          };
        }),

      updateMilestone: (milestone) =>
        set((state) => ({ milestones: state.milestones.map((m) => (m.id === milestone.id ? milestone : m)) })),

      updateAssessment: (assessment) =>
        set((state) => ({ assessments: state.assessments.map((a) => (a.id === assessment.id ? assessment : a)) })),

      addAssessment: (assessment) =>
        set((state) => ({ assessments: [...state.assessments, assessment] })),

      addMentorRequest: (req) =>
        set((state) => {
          const targetStartup = state.startups.find((s) => s.id === req.startupId);
          const newNotif: AppNotification = {
            id: generateId(),
            title: 'New Mentor Request',
            message: `Mentor request logged for ${targetStartup?.name || req.startupId} (${req.expertiseNeeded.join(', ')}).`,
            type: 'MENTOR_REQUEST',
            startupId: req.startupId,
            startupName: targetStartup?.name,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: '/mentor-connect',
          };
          return {
            mentorRequests: [...state.mentorRequests, req],
            notifications: [newNotif, ...state.notifications],
          };
        }),

      updateMentorRequest: (req) =>
        set((state) => {
          const targetStartup = state.startups.find((s) => s.id === req.startupId);
          const newNotif: AppNotification = {
            id: generateId(),
            title: `Mentor Request: ${req.status}`,
            message: `Request for ${targetStartup?.name || req.startupId} updated to ${req.status}.`,
            type: 'MENTOR_RESPONSE',
            startupId: req.startupId,
            startupName: targetStartup?.name,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: '/mentor-connect',
          };
          return {
            mentorRequests: state.mentorRequests.map((r) => (r.id === req.id ? req : r)),
            notifications: [newNotif, ...state.notifications],
          };
        }),

      addMentorMatch: (match) =>
        set((state) => {
          const mentor = state.mentors.find((m) => m.id === match.mentorId);
          const req = state.mentorRequests.find((r) => r.id === match.requestId);
          const startup = req ? state.startups.find((s) => s.id === req.startupId) : undefined;
          const newNotif: AppNotification = {
            id: generateId(),
            title: 'Mentor Match Proposed',
            message: `${mentor?.name || 'Mentor'} matched with ${startup?.name || 'Startup'} (${match.status}).`,
            type: 'MENTOR_MATCH',
            startupId: startup?.id,
            startupName: startup?.name,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: '/mentor-connect',
          };
          return {
            mentorMatches: [...state.mentorMatches, match],
            notifications: [newNotif, ...state.notifications],
          };
        }),

      updateMentorMatch: (match) =>
        set((state) => {
          const mentor = state.mentors.find((m) => m.id === match.mentorId);
          const req = state.mentorRequests.find((r) => r.id === match.requestId);
          const startup = req ? state.startups.find((s) => s.id === req.startupId) : undefined;
          const newNotif: AppNotification = {
            id: generateId(),
            title: `Mentor Engagement: ${match.status}`,
            message: `${mentor?.name || 'Mentor'} for ${startup?.name || 'Startup'} is now ${match.status}.`,
            type: 'MENTOR_RESPONSE',
            startupId: startup?.id,
            startupName: startup?.name,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: '/mentor-connect',
          };
          return {
            mentorMatches: state.mentorMatches.map((m) => (m.id === match.id ? match : m)),
            notifications: [newNotif, ...state.notifications],
          };
        }),

      addDataRequest: (req) =>
        set((state) => ({ dataRequests: [...state.dataRequests, req] })),

      updateDataRequest: (req) =>
        set((state) => ({ dataRequests: state.dataRequests.map((d) => (d.id === req.id ? req : d)) })),

      addSubmission: (sub) =>
        set((state) => ({ submissions: [...state.submissions, sub] })),

      updateSubmission: (sub) =>
        set((state) => ({ submissions: state.submissions.map((s) => (s.id === sub.id ? sub : s)) })),
    }),
    {
      name: 'fitt-portfolio-os-v5',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<StoreState>;
        return {
          ...currentState,
          ...persisted,
          startups: reconcileById(enrichedSeedStartups, persisted.startups),
          metrics: reconcileById(seedMetrics, persisted.metrics),
          assessments: reconcileById(seedAssessments, persisted.assessments),
          mentors: reconcileById(seedMentors, persisted.mentors),
          mentorMatches: reconcileById(seedMatches, persisted.mentorMatches),
          mentorRequests: reconcileById(seedRequests, persisted.mentorRequests),
          milestones: reconcileById(seedMilestones, persisted.milestones),
          teams: reconcileById(seedTeams, persisted.teams),
          dataRequests: reconcileById(seedDataRequests, persisted.dataRequests),
          submissions: reconcileById(seedSubmissions, persisted.submissions),
          notifications: reconcileById(seedNotifications, persisted.notifications),
        };
      },
    }
  )
);
