import { Mentor, MentorMatch, MentorRequest } from '@/types';

export function activeMatchCount(mentorId: string, mentorMatches: MentorMatch[]): number {
  return mentorMatches.filter(m => m.mentorId === mentorId && m.status === 'ACTIVE').length;
}

export function pendingRequestCountForStartup(mentorId: string, startupId: string, mentorRequests: MentorRequest[]): number {
  return mentorRequests.filter(r => r.mentorId === mentorId && r.startupId === startupId && r.status === 'PENDING').length;
}

export function mentorLoad(mentorId: string, startupId: string, mentorMatches: MentorMatch[], mentorRequests: MentorRequest[]): number {
  return activeMatchCount(mentorId, mentorMatches) + pendingRequestCountForStartup(mentorId, startupId, mentorRequests);
}

export function isMentorFull(mentor: Mentor, load: number): boolean {
  return load >= mentor.maxActiveMatches;
}

export function requestsForStartup(startupId: string, mentorRequests: MentorRequest[]): MentorRequest[] {
  return mentorRequests.filter(r => r.startupId === startupId && r.fittTaskN !== undefined);
}

export function requestedForTask(taskN: number, mentorId: string, startupId: string, mentorRequests: MentorRequest[]): boolean {
  return mentorRequests.some(r => r.startupId === startupId && r.fittTaskN === taskN && r.mentorId === mentorId);
}
