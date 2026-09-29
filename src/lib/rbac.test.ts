import { describe, it, expect } from 'vitest';
import { can, scopeStartups } from './rbac';
import { User, Startup } from '@/types';

const admin: User = { id: 'admin', email: 'admin@fitt.demo', role: 'ADMIN', label: 'Admin' };
const im1: User = { id: 'im1', email: 'im1@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'IM1' };
const im2: User = { id: 'im2', email: 'im2@fitt.demo', role: 'INVESTMENT_MANAGER', label: 'IM2' };
const ia1: User = { id: 'ia1', email: 'ia1@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'IA1', managerId: 'im1' };
const ia3: User = { id: 'ia3', email: 'ia3@fitt.demo', role: 'INVESTMENT_ASSOCIATE', label: 'IA3', managerId: 'im2' };

const s1 = { id: 's1', managerId: 'im1', associateId: 'ia1' } as Startup;
const s2 = { id: 's2', managerId: 'im2', associateId: 'ia3' } as Startup;

describe('scopeStartups', () => {
  it('scopes correctly for admin', () => {
    expect(scopeStartups(admin, [s1, s2]).length).toBe(2);
  });
  it('scopes correctly for manager', () => {
    const scoped = scopeStartups(im1, [s1, s2]);
    expect(scoped.length).toBe(1);
    expect(scoped[0].id).toBe('s1');
  });
  it('scopes correctly for associate', () => {
    const scoped = scopeStartups(ia3, [s1, s2]);
    expect(scoped.length).toBe(1);
    expect(scoped[0].id).toBe('s2');
  });
});

describe('can', () => {
  it('allows admin overview only for admin', () => {
    expect(can(admin, 'admin_overview')).toBe(true);
    expect(can(im1, 'admin_overview')).toBe(false);
    expect(can(ia1, 'admin_overview')).toBe(false);
  });

  it('allows investment manager to approve assessment for own startup', () => {
    expect(can(im1, 'approve_assessment', s1)).toBe(true);
    expect(can(im1, 'approve_assessment', s2)).toBe(false);
  });

  it('prevents associate from approving assessments', () => {
    expect(can(ia1, 'approve_assessment', s1)).toBe(false);
  });

  it('allows associate to draft assessment for own startup', () => {
    expect(can(ia1, 'draft_assessment', s1)).toBe(true);
    expect(can(ia1, 'draft_assessment', s2)).toBe(false);
  });

  it('prevents admin from drafting assessment', () => {
    expect(can(admin, 'draft_assessment', s1)).toBe(false);
  });
});
