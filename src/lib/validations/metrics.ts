import { z } from 'zod';

export const metricSourceEnum = z.enum(['FOUNDER', 'INVESTMENT_ASSOCIATE', 'EXCEL_SYNC', 'AUDIT']);

export const upsertMetricSchema = z.object({
  id: z.string().uuid().optional(),
  startupId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'),
  cashBalance: z.number().default(0),
  monthlyBurn: z.number().default(0),
  monthlyRevenue: z.number().default(0),
  customerConversations: z.number().default(0),
  pilots: z.number().default(0),
  lois: z.number().default(0),
  payingCustomers: z.number().default(0),
  teamFullTime: z.number().default(0),
  teamPartTime: z.number().default(0),
  keyLearnings: z.string().optional().nullable(),
  source: metricSourceEnum.default('INVESTMENT_ASSOCIATE'),
  recordedOn: z.string().default(() => new Date().toISOString().split('T')[0]),
});

export type UpsertMetricInput = z.infer<typeof upsertMetricSchema>;
