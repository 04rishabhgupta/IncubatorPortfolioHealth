import { z } from 'zod';

export const assessmentBandEnum = z.enum(['HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL']);
export const assessmentStatusEnum = z.enum(['DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'RETURNED']);

export const addAssessmentSchema = z.object({
  id: z.string().uuid().optional(),
  startupId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'),
  profile: z.string().default('DEEP_TECH'),
  dimensions: z.record(z.string(), z.unknown()),
  total: z.number().default(0),
  band: assessmentBandEnum.default('HEALTHY'),
  delta3m: z.number().nullable().optional(),
  strengths: z.string().default(''),
  concerns: z.string().default(''),
  actions: z.array(z.unknown()).default([]),
  status: assessmentStatusEnum.default('DRAFT'),
  preparedBy: z.string().uuid(),
  submittedOn: z.string().nullable().optional(),
});

export type AddAssessmentInput = z.infer<typeof addAssessmentSchema>;

export const updateAssessmentSchema = z.object({
  id: z.string().uuid(),
  startupId: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  profile: z.string().optional(),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  total: z.number().optional(),
  band: assessmentBandEnum.optional(),
  delta3m: z.number().nullable().optional(),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  actions: z.array(z.unknown()).optional(),
  status: assessmentStatusEnum.optional(),
  preparedBy: z.string().uuid().optional(),
  submittedOn: z.string().nullable().optional(),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedOn: z.string().nullable().optional(),
  returnComment: z.string().nullable().optional(),
});

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
