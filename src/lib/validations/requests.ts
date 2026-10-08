import { z } from 'zod';

export const requestTypeEnum = z.enum([
  'MONTHLY_FINANCIALS',
  'MILESTONE_STATUS',
  'TRACTION',
  'CUSTOM',
]);

export const requestStatusEnum = z.enum(['OPEN', 'SUBMITTED', 'ACCEPTED', 'RETURNED']);
export const submissionStatusEnum = z.enum(['PENDING_REVIEW', 'ACCEPTED', 'RETURNED']);

export const addDataRequestSchema = z.object({
  id: z.string().optional(),
  startupId: z.string().uuid('Invalid startup ID'),
  type: requestTypeEnum,
  title: z.string().min(1, 'Title is required'),
  message: z.string().optional().nullable(),
  customQuestions: z.unknown().optional(),
  milestoneIds: z.array(z.string()).optional().nullable(),
  month: z.string().optional().nullable(),
  dueDate: z.string().min(1, 'Due date is required'),
  createdBy: z.string().uuid('Invalid user ID'),
  createdOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  status: requestStatusEnum.default('OPEN'),
});

export type AddDataRequestInput = z.infer<typeof addDataRequestSchema>;

export const updateDataRequestSchema = z.object({
  id: z.string(),
  startupId: z.string().uuid().optional(),
  type: requestTypeEnum.optional(),
  title: z.string().optional(),
  message: z.string().optional().nullable(),
  customQuestions: z.unknown().optional(),
  milestoneIds: z.array(z.string()).optional().nullable(),
  month: z.string().optional().nullable(),
  dueDate: z.string().optional(),
  status: requestStatusEnum.optional(),
});

export type UpdateDataRequestInput = z.infer<typeof updateDataRequestSchema>;

export const addSubmissionSchema = z.object({
  id: z.string().optional(),
  requestId: z.string().optional().nullable(),
  startupId: z.string().uuid('Invalid startup ID'),
  submittedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
  payload: z.record(z.string(), z.unknown()).default({}),
  status: submissionStatusEnum.default('PENDING_REVIEW'),
  reviewedBy: z.string().optional().nullable(),
  reviewedOn: z.string().optional().nullable(),
  reviewComment: z.string().optional().nullable(),
});

export type AddSubmissionInput = z.infer<typeof addSubmissionSchema>;

export const updateSubmissionSchema = z.object({
  id: z.string(),
  requestId: z.string().optional().nullable(),
  startupId: z.string().uuid().optional(),
  submittedOn: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  status: submissionStatusEnum.optional(),
  reviewedBy: z.string().optional().nullable(),
  reviewedOn: z.string().optional().nullable(),
  reviewComment: z.string().optional().nullable(),
});

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;

export const addFounderActionItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      startupId: z.string().uuid('Invalid startup ID'),
      title: z.string().min(1, 'Title is required'),
      cause: z.string().min(1, 'Cause is required'),
      effect: z.string().min(1, 'Effect is required'),
      fix: z.string().min(1, 'Fix is required'),
      note: z.string().optional().nullable(),
      sharedBy: z.string().optional(),
      sharedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
    })
  ),
});

export type AddFounderActionItemsInput = z.infer<typeof addFounderActionItemsSchema>;
