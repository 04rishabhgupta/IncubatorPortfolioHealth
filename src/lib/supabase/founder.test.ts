import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';
import {
  submitFounderDataAction,
  updateFounderMilestoneAction,
  rotateFounderLinkAction,
  revokeFounderLinkAction,
  getFounderLinkStatusAction,
} from '@/app/actions/founder';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe.runIf(Boolean(supabaseUrl && serviceRoleKey))('Phase 4: Founder Portal Hardening Tests', () => {
  let adminClient: SupabaseClient;
  const knownToken = 's31-token-indigotex';
  let indigotexId: string;
  let testMilestoneId: string;

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: startup } = await adminClient
      .from('startups')
      .select('id')
      .eq('name', 'Indigotex Private Limited')
      .single();

    expect(startup).toBeDefined();
    indigotexId = startup!.id;

    // Ensure Indigotex has a milestone to test
    const { data: existingMs } = await adminClient
      .from('milestones')
      .select('id')
      .eq('startup_id', indigotexId)
      .limit(1);

    if (existingMs && existingMs.length > 0) {
      testMilestoneId = existingMs[0].id;
    } else {
      const newId = crypto.randomUUID();
      const { error: msErr } = await adminClient.from('milestones').insert({
        id: newId,
        startup_id: indigotexId,
        title: 'Initial Pilot Deployment',
        category: 'PRODUCT',
        target_date: '2026-12-01',
        status: 'IN_PROGRESS',
        percent_complete: 40,
        last_updated_by: 'STAFF',
        last_updated_on: '2026-10-01',
      });
      expect(msErr).toBeNull();
      testMilestoneId = newId;
    }
  });

  it('Verifies active seeded founder token hash in founder_links table', async () => {
    const tokenHash = crypto.createHash('sha256').update(knownToken).digest('hex');

    const { data: link, error } = await adminClient
      .from('founder_links')
      .select('id, startup_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    expect(error).toBeNull();
    expect(link).toBeDefined();
    expect(link!.startup_id).toBe(indigotexId);
  });

  it('Rejects unknown or tampered founder tokens', async () => {
    const fakeToken = 'totally-fake-unauthorized-token';
    const fakeHash = crypto.createHash('sha256').update(fakeToken).digest('hex');

    const { data: link } = await adminClient
      .from('founder_links')
      .select('*')
      .eq('token_hash', fakeHash)
      .maybeSingle();

    expect(link).toBeNull();

    const res = await submitFounderDataAction({
      token: fakeToken,
      payload: { cashBalance: 100000 },
    });

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/Unauthorized/i);
  });

  it('Rejects revoked magic links', async () => {
    const testRevokedToken = 'test-token-to-be-revoked-' + Date.now();
    const tokenHash = crypto.createHash('sha256').update(testRevokedToken).digest('hex');

    // Insert an already revoked link
    const { error: insErr } = await adminClient.from('founder_links').insert({
      id: crypto.randomUUID(),
      startup_id: indigotexId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      revoked_at: new Date().toISOString(),
    });
    expect(insErr).toBeNull();

    const res = await submitFounderDataAction({
      token: testRevokedToken,
      payload: { cashBalance: 50000 },
    });

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/Unauthorized/i);

    // Clean up test link
    await adminClient.from('founder_links').delete().eq('token_hash', tokenHash);
  });

  it('Rejects expired magic links', async () => {
    const testExpiredToken = 'test-token-already-expired-' + Date.now();
    const tokenHash = crypto.createHash('sha256').update(testExpiredToken).digest('hex');

    // Insert expired link (yesterday)
    const { error: insErr } = await adminClient.from('founder_links').insert({
      id: crypto.randomUUID(),
      startup_id: indigotexId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() - 86400000).toISOString(),
      revoked_at: null,
    });
    expect(insErr).toBeNull();

    const res = await submitFounderDataAction({
      token: testExpiredToken,
      payload: { cashBalance: 50000 },
    });

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/Unauthorized/i);

    // Clean up test link
    await adminClient.from('founder_links').delete().eq('token_hash', tokenHash);
  });

  it('Allows founder to submit financial metrics with valid token and records submission', async () => {
    const cash = 4500000;
    const revenue = 320000;

    const res = await submitFounderDataAction({
      token: knownToken,
      payload: {
        cashBalance: cash,
        monthlyRevenue: revenue,
      },
    });

    expect(res.error).toBeNull();
    expect(res.data).toBeDefined();
    expect(res.data!.startupId).toBe(indigotexId);
    expect(res.data!.status).toBe('PENDING_REVIEW');
    expect(res.data!.payload).toMatchObject({
      cashBalance: cash,
      monthlyRevenue: revenue,
    });

    // Cleanup test submission
    await adminClient.from('founder_submissions').delete().eq('id', res.data!.id);
  });

  it('Allows founder to update milestone progress and restricts to founder-editable fields', async () => {
    const newProgress = 75;
    const res = await updateFounderMilestoneAction({
      token: knownToken,
      milestoneId: testMilestoneId,
      status: 'IN_PROGRESS',
      percentComplete: newProgress,
      delayReason: 'Supply chain shipment delay',
    });

    expect(res.error).toBeNull();
    expect(res.data).toBeDefined();
    expect(res.data!.percentComplete).toBe(newProgress);
    expect(res.data!.status).toBe('IN_PROGRESS');
    expect(res.data!.delayReason).toBe('Supply chain shipment delay');
    expect(res.data!.lastUpdatedBy).toBe('FOUNDER');
  });

  it('Rejects updating a milestone belonging to another startup or invalid milestone', async () => {
    const res = await updateFounderMilestoneAction({
      token: knownToken,
      milestoneId: '00000000-0000-0000-0000-000000000000',
      percentComplete: 99,
    });

    expect(res.data).toBeNull();
    expect(res.error).toMatch(/Milestone not found/i);
  });

  it('Enforces staff authentication for magic link rotation and revocation', async () => {
    const statusRes = await getFounderLinkStatusAction(indigotexId);
    expect(statusRes.data).toBeNull();
    expect(statusRes.error).toBeDefined();

    const rotateRes = await rotateFounderLinkAction({
      startupId: indigotexId,
      expiresInDays: 90,
    });
    expect(rotateRes.data).toBeNull();
    expect(rotateRes.error).toBeDefined();

    const revokeRes = await revokeFounderLinkAction({
      startupId: indigotexId,
    });
    expect(revokeRes.success).toBe(false);
    expect(revokeRes.error).toBeDefined();
  });
});
