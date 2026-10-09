import { z } from 'zod';

export const mentorRequestStatusEnum = z.enum(['PENDING', 'MATCHED', 'DECLINED']);
export const mentorMatchStatusEnum = z.enum(['ACTIVE', 'CLOSED']);
export const raisedByEnum = z.enum(['STAFF', 'FOUNDER']);

export const addMentorRequestSchema = z.object({
  id: z.string().optional(),
  startupId: z.string().uuid('Invalid startup ID'),
  challenge: z.string().min(1, 'Challenge description is required'),
  expertiseNeeded: z.array(z.string()).default([]),
  raisedBy: raisedByEnum.default('STAFF'),
  createdOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  ranked: z.unknown().optional(),
  recommendedMentorId: z.string().uuid().nullable().optional(),
  status: mentorRequestStatusEnum.default('PENDING'),
  mentorId: z.string().uuid().nullable().optional(),
  note: z.string().nullable().optional(),
  fittTaskN: z.number().nullable().optional(),
});

export type AddMentorRequestInput = z.infer<typeof addMentorRequestSchema>;

export const updateMentorRequestSchema = z.object({
  id: z.string(),
  startupId: z.string().uuid().optional(),
  challenge: z.string().optional(),
  expertiseNeeded: z.array(z.string()).optional(),
  raisedBy: raisedByEnum.optional(),
  createdOn: z.string().optional(),
  ranked: z.unknown().optional(),
  recommendedMentorId: z.string().uuid().nullable().optional(),
  status: mentorRequestStatusEnum.optional(),
  mentorId: z.string().uuid().nullable().optional(),
  note: z.string().nullable().optional(),
  fittTaskN: z.number().nullable().optional(),
});

export type UpdateMentorRequestInput = z.infer<typeof updateMentorRequestSchema>;

export const mentorSessionInputSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  topic: z.string().min(1, 'Session topic is required'),
  nextStep: z.string().default(''),
  rating: z.number().min(1).max(5).optional(),
});

export type MentorSessionInput = z.infer<typeof mentorSessionInputSchema>;

export const addMentorMatchSchema = z.object({
  id: z.string().optional(),
  requestId: z.string().nullable().optional(),
  startupId: z.string().uuid('Invalid startup ID'),
  mentorId: z.string().uuid('Invalid mentor ID'),
  confirmedBy: z.string().uuid('Invalid user ID'),
  confirmedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  status: mentorMatchStatusEnum.default('ACTIVE'),
  sessions: z.array(mentorSessionInputSchema).default([]),
});

export type AddMentorMatchInput = z.infer<typeof addMentorMatchSchema>;

export const updateMentorMatchSchema = z.object({
  id: z.string(),
  requestId: z.string().nullable().optional(),
  startupId: z.string().uuid().optional(),
  mentorId: z.string().uuid().optional(),
  confirmedBy: z.string().uuid().optional(),
  confirmedOn: z.string().optional(),
  status: mentorMatchStatusEnum.optional(),
  sessions: z.array(mentorSessionInputSchema).optional(),
});

export type UpdateMentorMatchInput = z.infer<typeof updateMentorMatchSchema>;

export const logMentorSessionSchema = z.object({
  id: z.string().optional(),
  matchId: z.string(),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  topic: z.string().min(1, 'Session topic is required'),
  nextStep: z.string().default(''),
  rating: z.number().min(1).max(5).optional(),
});

export type LogMentorSessionInput = z.infer<typeof logMentorSessionSchema>;

export const geographyEnum = z.enum([
  'DELHI_NCR',
  'NORTH',
  'SOUTH',
  'WEST',
  'EAST',
  'PAN_INDIA',
  'INTERNATIONAL',
]);

export const availabilityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const addMentorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Mentor name is required'),
  title: z.string().min(1, 'Professional title is required'),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  sectors: z.array(z.string()).default([]),
  expertise: z.array(z.string()).default([]),
  stages: z.array(z.string()).default([]),
  geography: geographyEnum.default('PAN_INDIA'),
  availability: availabilityEnum.default('MEDIUM'),
  maxActiveMatches: z.number().int().min(1).max(20).default(3),
  bio: z.string().default(''),
  active: z.boolean().default(true),
});

export type AddMentorInput = z.infer<typeof addMentorSchema>;
