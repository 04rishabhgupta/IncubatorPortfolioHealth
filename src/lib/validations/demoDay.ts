import { z } from 'zod';

export const investorTypeEnum = z.enum([
  'VC_FUND',
  'ANGEL_NETWORK',
  'FAMILY_OFFICE',
  'CORPORATE_VC',
  'MICRO_VC',
]);

export const demoDayStatusEnum = z.enum(['UPCOMING', 'LIVE', 'COMPLETED']);

export const pitchConnectionStatusEnum = z.enum([
  'INTRODUCED',
  'PITCH_SCHEDULED',
  'PITCHED',
  'DUE_DILIGENCE',
  'TERM_SHEET',
  'COMMITTED',
  'PASSED',
]);

export const addInvestorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Investor or partner name is required'),
  firm: z.string().min(1, 'Firm or syndicate name is required'),
  type: investorTypeEnum.default('VC_FUND'),
  title: z.string().default('Partner'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  sectors: z.array(z.string()).default([]),
  stages: z.array(z.string()).default([]),
  ticketSize: z.string().default('₹1 Cr - ₹5 Cr'),
  geography: z.string().default('India'),
  thesis: z.string().default(''),
  active: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString().split('T')[0]),
});

export type AddInvestorInput = z.infer<typeof addInvestorSchema>;

export const createDemoDaySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Event title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().default('Hybrid / IIT Delhi'),
  description: z.string().default(''),
  status: demoDayStatusEnum.default('UPCOMING'),
  cohort: z.string().default('Current Cohort'),
  startupIds: z.array(z.string()).default([]),
  investorIds: z.array(z.string()).default([]),
  createdAt: z.string().default(() => new Date().toISOString().split('T')[0]),
});

export type CreateDemoDayInput = z.infer<typeof createDemoDaySchema>;

export const createPitchConnectionSchema = z.object({
  id: z.string().optional(),
  startupId: z.string().min(1, 'Startup is required'),
  investorId: z.string().min(1, 'Investor is required'),
  demoDayId: z.string().nullable().optional(),
  connectedBy: z.string().min(1, 'User ID is required'),
  status: pitchConnectionStatusEnum.default('INTRODUCED'),
  round: z.string().default('Seed'),
  askAmount: z.string().default('₹2 Cr'),
  pitchDeckUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().default(''),
  nextAction: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  connectedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  updatedAt: z.string().default(() => new Date().toISOString().split('T')[0]),
});

export type CreatePitchConnectionInput = z.infer<typeof createPitchConnectionSchema>;

export const updatePitchConnectionSchema = z.object({
  id: z.string().min(1),
  status: pitchConnectionStatusEnum.optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  round: z.string().optional(),
  askAmount: z.string().optional(),
  pitchDeckUrl: z.string().optional(),
  demoDayId: z.string().nullable().optional(),
  updatedAt: z.string().default(() => new Date().toISOString().split('T')[0]),
});

export type UpdatePitchConnectionInput = z.infer<typeof updatePitchConnectionSchema>;
