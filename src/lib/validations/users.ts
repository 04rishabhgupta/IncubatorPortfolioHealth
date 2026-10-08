import { z } from 'zod';

export const roleEnum = z.enum(['ADMIN', 'INVESTMENT_MANAGER', 'INVESTMENT_ASSOCIATE']);

export const inviteStaffSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    label: z.string().min(2, 'Name must be at least 2 characters'),
    role: roleEnum,
    managerId: z.string().uuid('Invalid manager ID').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'INVESTMENT_ASSOCIATE') {
        return Boolean(data.managerId);
      }
      return true;
    },
    {
      message: 'Portfolio Managers must be assigned a supervising Portfolio Head',
      path: ['managerId'],
    }
  );

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const updateStaffSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID'),
    label: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: roleEnum.optional(),
    managerId: z.string().uuid('Invalid manager ID').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'INVESTMENT_ASSOCIATE') {
        return Boolean(data.managerId);
      }
      return true;
    },
    {
      message: 'Portfolio Managers must be assigned a supervising Portfolio Head',
      path: ['managerId'],
    }
  );

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
