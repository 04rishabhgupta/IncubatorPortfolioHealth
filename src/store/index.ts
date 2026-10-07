import { create } from 'zustand';
import {
  createStartupAction,
  updateStartupAction,
  deleteStartupAction,
  hardDeleteStartupAction,
  updateAssignmentAction,
} from '@/app/actions/startups';
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
  isHydrated: boolean;
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
  updateAssignment: (startupId: string, managerId: string, associateId: string | null, actor: string) => Promise<{ success: boolean; error: string | null }>;
  addFounderActionItems: (items: Omit<FounderActionItem, 'id'>[]) => void;

  // Startup CRUD
  createStartup: (startup: Startup) => Promise<{ data: Startup | null; error: string | null }>;
  updateStartup: (startup: Startup) => Promise<{ data: Startup | null; error: string | null }>;
  deleteStartup: (startupId: string, hard?: boolean) => Promise<{ success: boolean; error: string | null }>;

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

export const useStore = create<StoreState>()((set, get) => ({
  isHydrated: false,
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
            isHydrated: true,
            currentUser: currentAppUser || state.currentUser,
            users: loadedUsers.length > 0 ? loadedUsers : state.users,
            startups: loadedStartups,
            metrics: loadedMetrics,
            milestones: loadedMilestones,
            assessments: loadedAssessments,
            mentors: loadedMentors,
            mentorMatches: loadedMatches,
            mentorRequests: loadedMentorReqs,
            dataRequests: loadedDataReqs,
            submissions: loadedSubmissions,
            teams: loadedTeams,
            founderActionItems: loadedActionItems,
            activityLogs: loadedLogs,
            notifications: loadedNotifications,
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

      updateAssignment: async (startupId, managerId, associateId, actor) => {
        const prevStartups = get().startups;
        const startup = prevStartups.find((s) => s.id === startupId);
        if (!startup) return { success: false, error: 'Startup not found' };

        let resolvedAssociateId = associateId && associateId !== '' ? associateId : null;
        if (resolvedAssociateId) {
          const assoc = get().users.find((u) => u.id === resolvedAssociateId);
          if (!assoc || assoc.managerId !== managerId) resolvedAssociateId = null;
        }

        const changes: string[] = [];
        if (managerId !== startup.managerId) changes.push(`manager reassigned to ${managerId}`);
        if (resolvedAssociateId !== startup.associateId)
          changes.push(`associate set to ${resolvedAssociateId ?? 'unassigned'}`);
        if (changes.length === 0) return { success: true, error: null };

        const updated: Startup = { ...startup, managerId, associateId: resolvedAssociateId };

        // Optimistic update
        set((state) => ({
          startups: state.startups.map((s) => (s.id === startupId ? updated : s)),
          activityLogs: [
            { id: generateId(), startupId, at: new Date().toISOString(), actor, text: changes.join('; ') },
            ...state.activityLogs,
          ],
        }));

        try {
          const res = await updateAssignmentAction({
            startupId,
            managerId,
            associateId: resolvedAssociateId,
            actor,
          });

          if (res.error) {
            set({ startups: prevStartups });
            return res;
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ startups: prevStartups });
          return { success: false, error: message || 'Failed to update assignment' };
        }
      },

      addFounderActionItems: (items) =>
        set((state) => ({
          founderActionItems: [...state.founderActionItems, ...items.map((i) => ({ ...i, id: generateId() }))],
        })),

      // Startup CRUD
      createStartup: async (startup) => {
        const prevStartups = get().startups;
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

        // Optimistic update
        set((state) => ({
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
        }));

        try {
          const res = await createStartupAction({
            name: startup.name,
            oneLiner: startup.oneLiner,
            sector: startup.sector,
            stage: startup.stage,
            cohort: startup.cohort,
            foundedOn: startup.foundedOn,
            website: startup.website,
            city: startup.city,
            managerId: startup.managerId,
            associateId: startup.associateId,
            trl: startup.trl,
            trlUpdatedOn: startup.trlUpdatedOn,
            ipStatus: startup.ipStatus,
            ipOwnershipClear: startup.ipOwnershipClear,
            commercialSignal: startup.commercialSignal,
            grantSanctioned: startup.grantSanctioned,
            grantDisbursed: startup.grantDisbursed,
            regTags: startup.regTags,
            fittTracker: startup.fittTracker,
          });

          if (res.error) {
            set({ startups: prevStartups });
            return res;
          }

          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              startups: state.startups.map((s) => (s.id === enriched.id ? canonical : s)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ startups: prevStartups });
          return { data: null, error: message || 'Failed to create startup' };
        }
      },

      updateStartup: async (startup) => {
        const prevStartups = get().startups;
        const startupMetrics = get().metrics.filter((m) => m.startupId === startup.id);
        const investibility = computeInvestibilityScore(startup, startupMetrics);
        const aiAnalysis = generateAIAnalysis(startup, startupMetrics);
        const enriched: Startup = {
          ...startup,
          investibility,
          aiAnalysis,
        };

        // Optimistic update
        set((state) => ({
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
        }));

        try {
          const res = await updateStartupAction({
            id: startup.id,
            name: startup.name,
            oneLiner: startup.oneLiner,
            sector: startup.sector,
            stage: startup.stage,
            cohort: startup.cohort,
            foundedOn: startup.foundedOn,
            website: startup.website,
            city: startup.city,
            trl: startup.trl,
            trlUpdatedOn: startup.trlUpdatedOn,
            ipStatus: startup.ipStatus,
            ipOwnershipClear: startup.ipOwnershipClear,
            commercialSignal: startup.commercialSignal,
            grantSanctioned: startup.grantSanctioned,
            grantDisbursed: startup.grantDisbursed,
            archived: startup.archived,
            regTags: startup.regTags,
            fittTracker: startup.fittTracker,
          });

          if (res.error) {
            set({ startups: prevStartups });
            return res;
          }

          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              startups: state.startups.map((s) => (s.id === startup.id ? canonical : s)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ startups: prevStartups });
          return { data: null, error: message || 'Failed to update startup' };
        }
      },

      deleteStartup: async (startupId, hard = false) => {
        const prevStartups = get().startups;
        const existing = prevStartups.find((s) => s.id === startupId);

        // Optimistic update
        set((state) => ({
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
        }));

        try {
          const res = hard
            ? await hardDeleteStartupAction(startupId)
            : await deleteStartupAction(startupId);

          if (res.error) {
            set({ startups: prevStartups });
            return res;
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ startups: prevStartups });
          return { success: false, error: message || 'Failed to delete startup' };
        }
      },

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
    })
);
