import { describe, it, expect, vi } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { inviteStaffSchema, updateStaffSchema } from '@/lib/validations/users';
import { inviteStaffUserAction, updateStaffUserAction } from '@/app/actions/users';

// Mock next/headers for server action testing outside Next request context
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('Phase 6: Staff Provisioning & Governance Tests', () => {
  describe('Input Validation: inviteStaffSchema', () => {
    it('accepts valid administrator invitation', () => {
      const parsed = inviteStaffSchema.safeParse({
        email: 'director@fitt-iitd.in',
        label: 'Prof. Anil Wali',
        role: 'ADMIN',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts valid portfolio head (investment manager) invitation', () => {
      const parsed = inviteStaffSchema.safeParse({
        email: 'head@fitt-iitd.in',
        label: 'Dr. Head',
        role: 'INVESTMENT_MANAGER',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts valid portfolio manager (associate) with assigned managerId', () => {
      const validManagerId = crypto.randomUUID();
      const parsed = inviteStaffSchema.safeParse({
        email: 'manager@fitt-iitd.in',
        label: 'Mr. Associate',
        role: 'INVESTMENT_ASSOCIATE',
        managerId: validManagerId,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects portfolio manager (associate) missing managerId', () => {
      const parsed = inviteStaffSchema.safeParse({
        email: 'manager@fitt-iitd.in',
        label: 'Mr. Associate',
        role: 'INVESTMENT_ASSOCIATE',
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const err = parsed.error.issues.find((i) => i.path.includes('managerId'));
        expect(err).toBeDefined();
        expect(err?.message).toContain('supervising Portfolio Head');
      }
    });

    it('rejects invalid email formats', () => {
      const parsed = inviteStaffSchema.safeParse({
        email: 'not-an-email',
        label: 'Test User',
        role: 'ADMIN',
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects empty or short label', () => {
      const parsed = inviteStaffSchema.safeParse({
        email: 'test@fitt-iitd.in',
        label: 'A',
        role: 'ADMIN',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('Input Validation: updateStaffSchema', () => {
    it('accepts valid profile update with UUID', () => {
      const validUserId = crypto.randomUUID();
      const parsed = updateStaffSchema.safeParse({
        userId: validUserId,
        label: 'Updated Name',
        role: 'INVESTMENT_MANAGER',
      });
      expect(parsed.success).toBe(true);
    });

    it('enforces associate manager requirement on role updates', () => {
      const validUserId = crypto.randomUUID();
      const parsed = updateStaffSchema.safeParse({
        userId: validUserId,
        role: 'INVESTMENT_ASSOCIATE',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('Server Action Authorization Guards', () => {
    it('blocks unauthenticated invitations', async () => {
      const res = await inviteStaffUserAction({
        email: 'unauth@fitt-iitd.in',
        label: 'Unauth User',
        role: 'ADMIN',
      });
      expect(res.data).toBeNull();
      expect(res.error).toMatch(/Unauthorized|Forbidden/);
    });

    it('blocks unauthenticated staff profile updates', async () => {
      const validUserId = crypto.randomUUID();
      const res = await updateStaffUserAction({
        userId: validUserId,
        label: 'Hacked Admin',
      });
      expect(res.data).toBeNull();
      expect(res.error).toMatch(/Unauthorized|Forbidden/);
    });
  });
});
