import { create } from 'zustand';
import {
  createStartupAction,
  updateStartupAction,
  deleteStartupAction,
  hardDeleteStartupAction,
  updateAssignmentAction,
} from '@/app/actions/startups';
import { upsertMetricAction } from '@/app/actions/metrics';
import { addAssessmentAction, updateAssessmentAction } from '@/app/actions/assessments';
import {
  addMentorRequestAction,
  updateMentorRequestAction,
  addMentorMatchAction,
  updateMentorMatchAction,
} from '@/app/actions/mentors';
import {
  addDataRequestAction,
  updateDataRequestAction,
  addSubmissionAction,
  updateSubmissionAction,
  addFounderActionItemsAction,
} from '@/app/actions/requests';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/actions/notifications';
import {
  inviteStaffUserAction,
  updateStaffUserAction,
} from '@/app/actions/users';
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
  RegulatoryItem,
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
  regulatoryItemFromRow,
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
  regulatoryItems: RegulatoryItem[];

  // Actions
  login: (user: User) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  resetDemoData: () => void;
  updateAssignment: (startupId: string, managerId: string, associateId: string | null, actor: string) => Promise<{ success: boolean; error: string | null }>;
  addFounderActionItems: (items: Omit<FounderActionItem, 'id'>[]) => Promise<{ data: FounderActionItem[] | null; error: string | null }>;

  // Startup CRUD
  createStartup: (startup: Startup) => Promise<{ data: Startup | null; error: string | null }>;
  updateStartup: (startup: Startup) => Promise<{ data: Startup | null; error: string | null }>;
  deleteStartup: (startupId: string, hard?: boolean) => Promise<{ success: boolean; error: string | null }>;

  // Notifications
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<AppNotification>) => void;
  markNotificationRead: (id: string) => Promise<{ success: boolean; error: string | null }>;
  markAllNotificationsRead: () => Promise<{ success: boolean; error: string | null }>;

  // Logging & Metrics
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;
  upsertMetric: (metric: MonthlyMetrics) => Promise<{ data: MonthlyMetrics | null; error: string | null }>;
  updateMilestone: (milestone: Milestone) => void;
  updateAssessment: (assessment: HealthAssessment) => Promise<{ data: HealthAssessment | null; error: string | null }>;
  addAssessment: (assessment: HealthAssessment) => Promise<{ data: HealthAssessment | null; error: string | null }>;
  addMentorRequest: (req: MentorRequest) => Promise<{ data: MentorRequest | null; error: string | null }>;
  updateMentorRequest: (req: MentorRequest) => Promise<{ data: MentorRequest | null; error: string | null }>;
  addMentorMatch: (match: MentorMatch) => Promise<{ data: MentorMatch | null; error: string | null }>;
  updateMentorMatch: (match: MentorMatch) => Promise<{ data: MentorMatch | null; error: string | null }>;
  addDataRequest: (req: DataRequest) => Promise<{ data: DataRequest | null; error: string | null }>;
  updateDataRequest: (req: DataRequest) => Promise<{ data: DataRequest | null; error: string | null }>;
  addSubmission: (sub: FounderSubmission) => Promise<{ data: FounderSubmission | null; error: string | null }>;
  updateSubmission: (sub: FounderSubmission) => Promise<{ data: FounderSubmission | null; error: string | null }>;
  inviteStaffUser: (input: unknown) => Promise<{ data: User | null; error: string | null }>;
  updateStaffUser: (input: unknown) => Promise<{ data: User | null; error: string | null }>;
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
      regulatoryItems: [],

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
            regulatoryRes,
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
            supabase.from('regulatory_items').select('*'),
          ]);

          const loadedUsers = (profilesRes.data || []).map(userFromProfile);
          const currentProfile = authUser ? profilesRes.data?.find((p) => p.id === authUser.id) : null;
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
          const loadedRegulatory = (regulatoryRes.data || []).map(regulatoryItemFromRow);

          const readMap = new Map((recipientsRes.data || []).map((r) => [r.notification_id, Boolean(r.read_at)]));
          const loadedNotifications = (notifsRes.data || []).map((n) => notificationFromRow(n, readMap.get(n.id) || false));

          set((state) => ({
            isHydrated: true,
            currentUser: currentAppUser || state.currentUser,
            users: loadedUsers.length > 0 ? loadedUsers : state.users,
            startups: loadedStartups.length > 0 ? loadedStartups : state.startups,
            metrics: loadedMetrics.length > 0 ? loadedMetrics : state.metrics,
            milestones: loadedMilestones.length > 0 ? loadedMilestones : state.milestones,
            assessments: loadedAssessments.length > 0 ? loadedAssessments : state.assessments,
            mentors: loadedMentors.length > 0 ? loadedMentors : state.mentors,
            mentorMatches: loadedMatches,
            mentorRequests: loadedMentorReqs,
            dataRequests: loadedDataReqs,
            submissions: loadedSubmissions,
            teams: loadedTeams.length > 0 ? loadedTeams : state.teams,
            founderActionItems: loadedActionItems,
            activityLogs: loadedLogs,
            notifications: loadedNotifications.length > 0 ? loadedNotifications : state.notifications,
            regulatoryItems: loadedRegulatory,
          }));
        } catch (err) {
          console.error('Failed to hydrate from Supabase:', err);
          set({ isHydrated: true });
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

      addFounderActionItems: async (items) => {
        const prev = get().founderActionItems;
        const optimistic = items.map((i) => ({ ...i, id: generateId() }));
        set((state) => ({ founderActionItems: [...state.founderActionItems, ...optimistic] }));
        try {
          const res = await addFounderActionItemsAction({ items });
          if (res.error) {
            set({ founderActionItems: prev });
            return res;
          }
          if (res.data) {
            set((state) => ({
              founderActionItems: [
                ...state.founderActionItems.filter((i) => !optimistic.some((o) => o.id === i.id)),
                ...res.data!,
              ],
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ founderActionItems: prev });
          return { data: null, error: message || 'Failed to create action items' };
        }
      },

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

      markNotificationRead: async (id) => {
        const prev = get().notifications;
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
        try {
          const res = await markNotificationReadAction(id);
          if (res.error) {
            set({ notifications: prev });
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ notifications: prev });
          return { success: false, error: message || 'Failed to mark notification read' };
        }
      },

      markAllNotificationsRead: async () => {
        const prev = get().notifications;
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        try {
          const res = await markAllNotificationsReadAction();
          if (res.error) {
            set({ notifications: prev });
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ notifications: prev });
          return { success: false, error: message || 'Failed to mark notifications read' };
        }
      },

      addActivityLog: (log) =>
        set((state) => ({ activityLogs: [{ ...log, id: generateId() }, ...state.activityLogs] })),

      upsertMetric: async (metric) => {
        const prevMetrics = get().metrics;
        const prevStartups = get().startups;

        const exists = prevMetrics.find(
          (m) => m.id === metric.id || (m.startupId === metric.startupId && m.month === metric.month)
        );
        const nextMetrics = exists
          ? prevMetrics.map((m) => (m.id === exists.id ? { ...metric, id: exists.id } : m))
          : [...prevMetrics, metric];

        // Recompute target startup AI analysis and investibility with new metrics
        const targetStartup = prevStartups.find((s) => s.id === metric.startupId);
        let updatedStartups = prevStartups;
        if (targetStartup) {
          const sm = nextMetrics.filter((m) => m.startupId === targetStartup.id);
          const investibility = computeInvestibilityScore(targetStartup, sm);
          const aiAnalysis = generateAIAnalysis(targetStartup, sm);
          updatedStartups = prevStartups.map((s) =>
            s.id === targetStartup.id ? { ...s, investibility, aiAnalysis } : s
          );
        }

        // Optimistic update
        set({
          metrics: nextMetrics,
          startups: updatedStartups,
        });

        try {
          const res = await upsertMetricAction({
            id: metric.id,
            startupId: metric.startupId,
            month: metric.month,
            cashBalance: metric.cashBalance,
            monthlyBurn: metric.monthlyBurn,
            monthlyRevenue: metric.monthlyRevenue,
            customerConversations: metric.customerConversations,
            pilots: metric.pilots,
            lois: metric.lois,
            payingCustomers: metric.payingCustomers,
            teamFullTime: metric.teamFullTime,
            teamPartTime: metric.teamPartTime,
            keyLearnings: metric.keyLearnings,
            source: metric.source,
            recordedOn: metric.recordedOn,
          });

          if (res.error) {
            set({ metrics: prevMetrics, startups: prevStartups });
            return res;
          }

          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              metrics: state.metrics.map((m) =>
                m.startupId === canonical.startupId && m.month === canonical.month ? canonical : m
              ),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ metrics: prevMetrics, startups: prevStartups });
          return { data: null, error: message || 'Failed to upsert metric' };
        }
      },

      updateMilestone: (milestone) =>
        set((state) => ({ milestones: state.milestones.map((m) => (m.id === milestone.id ? milestone : m)) })),

      updateAssessment: async (assessment) => {
        const prevAssessments = get().assessments;

        // Optimistic update
        set((state) => ({
          assessments: state.assessments.map((a) => (a.id === assessment.id ? assessment : a)),
        }));

        try {
          const res = await updateAssessmentAction({
            id: assessment.id,
            startupId: assessment.startupId,
            month: assessment.month,
            profile: assessment.profile,
            dimensions: assessment.dimensions as unknown as Record<string, unknown>,
            total: assessment.total,
            band: assessment.band,
            delta3m: assessment.delta3m,
            strengths: assessment.strengths,
            concerns: assessment.concerns,
            actions: assessment.actions as unknown as unknown[],
            status: assessment.status,
            preparedBy: assessment.preparedBy,
            submittedOn: assessment.submittedOn,
            approvedBy: assessment.approvedBy,
            approvedOn: assessment.approvedOn,
            returnComment: assessment.returnComment,
          });

          if (res.error) {
            set({ assessments: prevAssessments });
            return res;
          }

          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              assessments: state.assessments.map((a) => (a.id === assessment.id ? canonical : a)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ assessments: prevAssessments });
          return { data: null, error: message || 'Failed to update assessment' };
        }
      },

      addAssessment: async (assessment) => {
        const prevAssessments = get().assessments;

        // Optimistic update
        set((state) => ({ assessments: [...state.assessments, assessment] }));

        try {
          const res = await addAssessmentAction({
            id: assessment.id,
            startupId: assessment.startupId,
            month: assessment.month,
            profile: assessment.profile,
            dimensions: assessment.dimensions as unknown as Record<string, unknown>,
            total: assessment.total,
            band: assessment.band,
            delta3m: assessment.delta3m,
            strengths: assessment.strengths,
            concerns: assessment.concerns,
            actions: assessment.actions as unknown as unknown[],
            status: assessment.status,
            preparedBy: assessment.preparedBy,
            submittedOn: assessment.submittedOn,
          });

          if (res.error) {
            set({ assessments: prevAssessments });
            return res;
          }

          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              assessments: state.assessments.map((a) => (a.id === assessment.id ? canonical : a)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ assessments: prevAssessments });
          return { data: null, error: message || 'Failed to add assessment' };
        }
      },

      addMentorRequest: async (req) => {
        const prevReqs = get().mentorRequests;
        const prevNotifs = get().notifications;
        const targetStartup = get().startups.find((s) => s.id === req.startupId);
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
        set((state) => ({
          mentorRequests: [...state.mentorRequests, req],
          notifications: [newNotif, ...state.notifications],
        }));

        try {
          const res = await addMentorRequestAction({
            id: req.id,
            startupId: req.startupId,
            challenge: req.challenge,
            expertiseNeeded: req.expertiseNeeded,
            raisedBy: req.raisedBy,
            createdOn: req.createdOn,
            ranked: req.ranked,
            recommendedMentorId: req.recommendedMentorId ?? null,
            status: req.status,
            mentorId: req.mentorId ?? null,
            note: req.note ?? null,
            fittTaskN: req.fittTaskN ?? null,
          });

          if (res.error) {
            set({ mentorRequests: prevReqs, notifications: prevNotifs });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              mentorRequests: state.mentorRequests.map((r) => (r.id === req.id ? canonical : r)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ mentorRequests: prevReqs, notifications: prevNotifs });
          return { data: null, error: message || 'Failed to add mentor request' };
        }
      },

      updateMentorRequest: async (req) => {
        const prevReqs = get().mentorRequests;
        set((state) => ({
          mentorRequests: state.mentorRequests.map((r) => (r.id === req.id ? req : r)),
        }));

        try {
          const res = await updateMentorRequestAction({
            id: req.id,
            startupId: req.startupId,
            challenge: req.challenge,
            expertiseNeeded: req.expertiseNeeded,
            raisedBy: req.raisedBy,
            createdOn: req.createdOn,
            ranked: req.ranked,
            recommendedMentorId: req.recommendedMentorId ?? null,
            status: req.status,
            mentorId: req.mentorId ?? null,
            note: req.note ?? null,
            fittTaskN: req.fittTaskN ?? null,
          });

          if (res.error) {
            set({ mentorRequests: prevReqs });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              mentorRequests: state.mentorRequests.map((r) => (r.id === req.id ? canonical : r)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ mentorRequests: prevReqs });
          return { data: null, error: message || 'Failed to update mentor request' };
        }
      },

      addMentorMatch: async (match) => {
        const prevMatches = get().mentorMatches;
        const prevNotifs = get().notifications;
        const mentor = get().mentors.find((m) => m.id === match.mentorId);
        const req = get().mentorRequests.find((r) => r.id === match.requestId);
        const startup = req ? get().startups.find((s) => s.id === req.startupId) : undefined;
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
        set((state) => ({
          mentorMatches: [...state.mentorMatches, match],
          notifications: [newNotif, ...state.notifications],
        }));

        try {
          const res = await addMentorMatchAction({
            id: match.id,
            requestId: match.requestId || null,
            startupId: match.startupId,
            mentorId: match.mentorId,
            confirmedBy: match.confirmedBy,
            confirmedOn: match.confirmedOn,
            status: match.status,
            sessions: match.sessions,
          });

          if (res.error) {
            set({ mentorMatches: prevMatches, notifications: prevNotifs });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              mentorMatches: state.mentorMatches.map((m) => (m.id === match.id ? canonical : m)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ mentorMatches: prevMatches, notifications: prevNotifs });
          return { data: null, error: message || 'Failed to create mentor match' };
        }
      },

      updateMentorMatch: async (match) => {
        const prevMatches = get().mentorMatches;
        set((state) => ({
          mentorMatches: state.mentorMatches.map((m) => (m.id === match.id ? match : m)),
        }));

        try {
          const res = await updateMentorMatchAction({
            id: match.id,
            requestId: match.requestId || null,
            startupId: match.startupId,
            mentorId: match.mentorId,
            confirmedBy: match.confirmedBy,
            confirmedOn: match.confirmedOn,
            status: match.status,
            sessions: match.sessions,
          });

          if (res.error) {
            set({ mentorMatches: prevMatches });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              mentorMatches: state.mentorMatches.map((m) => (m.id === match.id ? canonical : m)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ mentorMatches: prevMatches });
          return { data: null, error: message || 'Failed to update mentor match' };
        }
      },

      addDataRequest: async (req) => {
        const prevRequests = get().dataRequests;
        set((state) => ({ dataRequests: [...state.dataRequests, req] }));

        try {
          const res = await addDataRequestAction({
            id: req.id,
            startupId: req.startupId,
            type: req.type,
            title: req.title,
            message: req.message,
            customQuestions: req.customQuestions,
            milestoneIds: req.milestoneIds,
            month: req.month,
            dueDate: req.dueDate,
            createdBy: req.createdBy,
            createdOn: req.createdOn,
            status: req.status,
          });

          if (res.error) {
            set({ dataRequests: prevRequests });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              dataRequests: state.dataRequests.map((d) => (d.id === req.id ? canonical : d)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ dataRequests: prevRequests });
          return { data: null, error: message || 'Failed to create data request' };
        }
      },

      updateDataRequest: async (req) => {
        const prevRequests = get().dataRequests;
        set((state) => ({
          dataRequests: state.dataRequests.map((d) => (d.id === req.id ? req : d)),
        }));

        try {
          const res = await updateDataRequestAction({
            id: req.id,
            startupId: req.startupId,
            type: req.type,
            title: req.title,
            message: req.message,
            customQuestions: req.customQuestions,
            milestoneIds: req.milestoneIds,
            month: req.month,
            dueDate: req.dueDate,
            status: req.status,
          });

          if (res.error) {
            set({ dataRequests: prevRequests });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              dataRequests: state.dataRequests.map((d) => (d.id === req.id ? canonical : d)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ dataRequests: prevRequests });
          return { data: null, error: message || 'Failed to update data request' };
        }
      },

      addSubmission: async (sub) => {
        const prevSubs = get().submissions;
        set((state) => ({ submissions: [...state.submissions, sub] }));

        try {
          const res = await addSubmissionAction({
            id: sub.id,
            requestId: sub.requestId,
            startupId: sub.startupId,
            submittedOn: sub.submittedOn,
            payload: sub.payload,
            status: sub.status,
            reviewedBy: sub.reviewedBy,
            reviewedOn: sub.reviewedOn,
            reviewComment: sub.reviewComment,
          });

          if (res.error) {
            set({ submissions: prevSubs });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              submissions: state.submissions.map((s) => (s.id === sub.id ? canonical : s)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ submissions: prevSubs });
          return { data: null, error: message || 'Failed to add submission' };
        }
      },

      updateSubmission: async (sub) => {
        const prevSubs = get().submissions;
        set((state) => ({
          submissions: state.submissions.map((s) => (s.id === sub.id ? sub : s)),
        }));

        try {
          const res = await updateSubmissionAction({
            id: sub.id,
            requestId: sub.requestId,
            startupId: sub.startupId,
            submittedOn: sub.submittedOn,
            payload: sub.payload,
            status: sub.status,
            reviewedBy: sub.reviewedBy,
            reviewedOn: sub.reviewedOn,
            reviewComment: sub.reviewComment,
          });

          if (res.error) {
            set({ submissions: prevSubs });
            return res;
          }
          if (res.data) {
            const canonical = res.data;
            set((state) => ({
              submissions: state.submissions.map((s) => (s.id === sub.id ? canonical : s)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          set({ submissions: prevSubs });
          return { data: null, error: message || 'Failed to update submission' };
        }
      },

      inviteStaffUser: async (input: unknown) => {
        try {
          const res = await inviteStaffUserAction(input);
          if (res.data) {
            const newUser = res.data;
            set((state) => ({
              users: state.users.some((u) => u.id === newUser.id)
                ? state.users.map((u) => (u.id === newUser.id ? newUser : u))
                : [...state.users, newUser],
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return { data: null, error: message || 'Failed to invite staff member' };
        }
      },

      updateStaffUser: async (input: unknown) => {
        try {
          const res = await updateStaffUserAction(input);
          if (res.data) {
            const updated = res.data;
            set((state) => ({
              users: state.users.map((u) => (u.id === updated.id ? updated : u)),
            }));
          }
          return res;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return { data: null, error: message || 'Failed to update staff user' };
        }
      },
    })
);
