import { z } from 'zod';

export const founderSubmitDataSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  requestId: z.string().optional().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export type FounderSubmitDataInput = z.infer<typeof founderSubmitDataSchema>;

export const founderUpdateMilestoneSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  milestoneId: z.string().uuid('Invalid milestone ID'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'AT_RISK']).optional(),
  percentComplete: z.number().int().min(0).max(100).optional(),
  delayReason: z.string().max(1000).optional().nullable(),
  evidenceNote: z.string().max(2000).optional().nullable(),
  evidenceLink: z.string().max(1000).optional().nullable(),
});

export type FounderUpdateMilestoneInput = z.infer<typeof founderUpdateMilestoneSchema>;

export const founderConfirmMilestonesSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  requestId: z.string().uuid('Invalid request ID'),
});

export type FounderConfirmMilestonesInput = z.infer<typeof founderConfirmMilestonesSchema>;

export const rotateFounderLinkSchema = z.object({
  startupId: z.string().uuid('Invalid startup ID'),
  expiresInDays: z.number().int().min(1).max(365).default(90).optional(),
});

export type RotateFounderLinkInput = z.infer<typeof rotateFounderLinkSchema>;

export const revokeFounderLinkSchema = z.object({
  startupId: z.string().uuid('Invalid startup ID'),
});

export type RevokeFounderLinkInput = z.infer<typeof revokeFounderLinkSchema>;
