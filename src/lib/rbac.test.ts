import { describe, it, expect } from 'vitest';
import { can, scopeStartups, getAssignableAssociates, getAssignableManagers } from './rbac';
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

describe('startup assignment permissions', () => {
  const allUsers = [admin, im1, im2, ia1, ia3];

  it('allows admin to reassign the manager of any startup', () => {
    expect(can(admin, 'reassign_manager', s1)).toBe(true);
    expect(can(admin, 'reassign_manager', s2)).toBe(true);
  });

  it('prevents managers and associates from reassigning the manager', () => {
    expect(can(im1, 'reassign_manager', s1)).toBe(false);
    expect(can(ia1, 'reassign_manager', s1)).toBe(false);
  });

  it('allows admin to assign an associate to any startup', () => {
    expect(can(admin, 'assign_associate', s1)).toBe(true);
    expect(can(admin, 'assign_associate', s2)).toBe(true);
  });

  it('allows an investment manager to assign an associate only on their own startups', () => {
    expect(can(im1, 'assign_associate', s1)).toBe(true);
    expect(can(im1, 'assign_associate', s2)).toBe(false);
  });

  it('prevents an investment associate from assigning another associate', () => {
    expect(can(ia1, 'assign_associate', s1)).toBe(false);
  });

  it('getAssignableAssociates only returns associates reporting to the given manager', () => {
    const forIm1 = getAssignableAssociates('im1', allUsers);
    expect(forIm1.map(u => u.id)).toEqual(['ia1']);
    const forIm2 = getAssignableAssociates('im2', allUsers);
    expect(forIm2.map(u => u.id)).toEqual(['ia3']);
  });

  it('getAssignableManagers returns all investment managers', () => {
    const managers = getAssignableManagers(allUsers);
    expect(managers.map(u => u.id).sort()).toEqual(['im1', 'im2']);
  });
});
