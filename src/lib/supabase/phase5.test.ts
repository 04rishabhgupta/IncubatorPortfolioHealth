import { describe, it, expect, beforeAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createAdminClient } from './admin';
import { createClient } from '@supabase/supabase-js';
import { createSignedUrlAction, uploadMilestoneEvidenceAction } from '@/app/actions/storage';
import { recomputeStartupAiAnalysisAction } from '@/app/actions/aiAnalysis';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe.runIf(Boolean(supabaseUrl && serviceRoleKey))('Phase 5: Realtime & Storage Verification Tests', () => {
  beforeAll(() => {
    expect(supabaseUrl).toBeTruthy();
    expect(serviceRoleKey).toBeTruthy();
  });

  it('Verifies private storage bucket portfolio-files exists and permits upload', async () => {
    const admin = createAdminClient();
    const testFileName = `test-audit-${Date.now()}.xlsx`;
    const storagePath = `excel-audits/test-suite/${testFileName}`;
    const fileBuffer = Buffer.from('PK... mock excel audit file contents ...', 'utf-8');

    // Upload
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('portfolio-files')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      });

    expect(uploadError).toBeNull();
    expect(uploadData?.path).toBe(storagePath);

    // Generate signed URL via Server Action
    const signedRes = await createSignedUrlAction(storagePath, 60);
    expect(signedRes.error).toBeNull();
    expect(signedRes.signedUrl).toContain('portfolio-files');
    expect(signedRes.signedUrl).toContain('token=');

    // Cleanup
    const { error: delError } = await admin.storage
      .from('portfolio-files')
      .remove([storagePath]);
    expect(delError).toBeNull();
  });

  it('Rejects signed URL generation for empty paths', async () => {
    const res = await createSignedUrlAction('');
    expect(res.error).toBe('Storage path is required');
    expect(res.signedUrl).toBeNull();
  });

  it('Allows founder to upload milestone evidence using a valid magic token', async () => {
    const admin = createAdminClient();

    // Find active founder link and milestone
    const { data: link } = await admin
      .from('founder_links')
      .select('startup_id, token_hash')
      .is('revoked_at', null)
      .limit(1)
      .single();

    expect(link).toBeTruthy();
    if (!link) return;

    // Create a temporary plaintext token and founder_links entry
    const testPlaintextToken = `test-evidence-token-${Date.now()}`;
    const testHash = crypto.createHash('sha256').update(testPlaintextToken).digest('hex');

    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    await admin.from('founder_links').insert({
      startup_id: link.startup_id,
      token_hash: testHash,
      expires_at: expiresAt,
    });

    // Find a milestone for this startup
    const { data: milestone } = await admin
      .from('milestones')
      .select('id, title')
      .eq('startup_id', link.startup_id)
      .limit(1)
      .single();

    expect(milestone).toBeTruthy();
    if (!milestone) return;

    // Construct FormData with mock evidence file
    const formData = new FormData();
    formData.append('token', testPlaintextToken);
    formData.append('milestoneId', milestone.id);
    const mockFile = new File(['mock pdf evidence report'], 'pilot_contract.pdf', {
      type: 'application/pdf',
    });
    formData.append('file', mockFile);
    formData.append('note', 'Signed pilot agreement with lead partner');

    const res = await uploadMilestoneEvidenceAction(formData);
    expect(res.error).toBeNull();
    expect(res.success).toBe(true);
    expect(res.evidenceLink).toBeTruthy();

    // Verify milestone updated in database
    const { data: updatedMs } = await admin
      .from('milestones')
      .select('evidence_link, evidence_note, last_updated_by')
      .eq('id', milestone.id)
      .single();

    expect(updatedMs?.evidence_link).toBeTruthy();
    expect(updatedMs?.evidence_note).toBe('Signed pilot agreement with lead partner');
    expect(updatedMs?.last_updated_by).toBe('FOUNDER');

    // Clean up test link
    await admin.from('founder_links').delete().eq('token_hash', testHash);
  }, 15000);

  it('Rejects evidence upload when an invalid founder token is used', async () => {
    const admin = createAdminClient();
    const { data: milestone } = await admin.from('milestones').select('id').limit(1).single();
    expect(milestone).toBeTruthy();
    if (!milestone) return;

    const formData = new FormData();
    formData.append('token', 'completely-invalid-token-12345');
    formData.append('milestoneId', milestone.id);
    const mockFile = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', mockFile);

    const res = await uploadMilestoneEvidenceAction(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid or unrecognized founder link');
  });

  it('Verifies Supabase Realtime channel subscription connects successfully', async () => {
    const client = createClient(supabaseUrl, supabaseAnonKey);

    const statusPromise = new Promise<string>((resolve) => {
      const channel = client.channel(`test-phase5-realtime-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            resolve(status);
            client.removeChannel(channel);
          }
        });
    });

    const status = await statusPromise;
    expect(status).toBe('SUBSCRIBED');
  });

  it('Recomputes deep AI analysis for a startup and persists to database', async () => {
    const admin = createAdminClient();
    const { data: startup } = await admin.from('startups').select('id, name').limit(1).single();
    expect(startup).toBeTruthy();
    if (!startup) return;

    // Trigger AI analysis recomputation
    const res = await recomputeStartupAiAnalysisAction(startup.id);
    expect(res.error).toBeNull();
    expect(res.success).toBe(true);
    expect(res.aiAnalysis).toBeTruthy();
    expect(res.aiAnalysis?.thesis).toBeTruthy();
    expect(Array.isArray(res.aiAnalysis?.redFlags)).toBe(true);

    // Verify row in database
    const { data: updated } = await admin
      .from('startups')
      .select('investibility, ai_analysis')
      .eq('id', startup.id)
      .single();

    expect(updated?.investibility).toBeTruthy();
    expect(updated?.ai_analysis).toBeTruthy();
  });
});
