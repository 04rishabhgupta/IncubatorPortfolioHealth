import { z } from 'zod';

export const sectorEnum = z.enum([
  'AI_ML',
  'MEDTECH',
  'AGRITECH',
  'CYBERSECURITY',
  'UAV',
  'SEMICONDUCTOR',
  'ADVANCED_MATERIALS',
]);

export const stageEnum = z.enum([
  'PRE_INCUBATION',
  'EARLY_INCUBATION',
  'MID_INCUBATION',
  'LATE_INCUBATION',
  'ACCELERATION',
  'GRADUATED',
]);

export const createStartupSchema = z.object({
  name: z.string().min(1, 'Startup name is required'),
  oneLiner: z.string().default(''),
  sector: sectorEnum,
  stage: stageEnum,
  cohort: z.string().min(1).default('FITT-2026'),
  foundedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  website: z.string().optional().nullable(),
  city: z.string().default('New Delhi'),
  managerId: z.string().uuid('Valid Portfolio Head ID is required'),
  associateId: z.string().uuid().optional().nullable(),
  trl: z.number().min(1).max(9).default(4),
  trlUpdatedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  ipStatus: z.enum(['NONE', 'FILED', 'GRANTED']).default('NONE'),
  ipOwnershipClear: z.boolean().default(true),
  commercialSignal: z.enum(['NONE', 'PILOT', 'LOI', 'PAYING']).default('NONE'),
  grantSanctioned: z.number().default(0),
  grantDisbursed: z.number().default(0),
  regTags: z.array(z.string()).default([]),
  fittTracker: z.record(z.string(), z.unknown()).optional(),
});

export type CreateStartupInput = z.infer<typeof createStartupSchema>;

export const updateStartupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  oneLiner: z.string().optional(),
  sector: sectorEnum.optional(),
  stage: stageEnum.optional(),
  cohort: z.string().optional(),
  foundedOn: z.string().optional(),
  website: z.string().optional().nullable(),
  city: z.string().optional(),
  trl: z.number().min(1).max(9).optional(),
  trlUpdatedOn: z.string().optional(),
  ipStatus: z.enum(['NONE', 'FILED', 'GRANTED']).optional(),
  ipOwnershipClear: z.boolean().optional(),
  commercialSignal: z.enum(['NONE', 'PILOT', 'LOI', 'PAYING']).optional(),
  grantSanctioned: z.number().optional(),
  grantDisbursed: z.number().optional(),
  archived: z.boolean().optional(),
  regTags: z.array(z.string()).optional(),
  fittTracker: z.record(z.string(), z.unknown()).optional(),
  trackerUpdatedAt: z.string().optional(),
});

export type UpdateStartupInput = z.infer<typeof updateStartupSchema>;

export const updateAssignmentSchema = z.object({
  startupId: z.string().uuid(),
  managerId: z.string().uuid(),
  associateId: z.string().uuid().nullable().optional(),
  actor: z.string().optional(),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
