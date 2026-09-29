import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Startup, MonthlyMetrics, HealthAssessment, Mentor, MentorMatch, MentorRequest, Milestone, TeamMember, DataRequest, FounderSubmission, ActivityLog, User } from '@/types';
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
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  resetDemoData: () => void;
  
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
        activityLogs: []
      }),

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
      name: 'fitt-portfolio-os-v1',
    }
  )
);
