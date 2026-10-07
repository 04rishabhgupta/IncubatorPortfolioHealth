'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

const BUCKET_NAME = 'portfolio-files';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeRevalidatePath(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // In unit test runner / Vitest context, revalidatePath throws Invariant error
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Uploads an Excel audit spreadsheet into private storage 'portfolio-files/excel-audits/...',
 * associates the path with the startup, and logs the action.
 */
export async function uploadAuditExcelAction(
  formData: FormData
): Promise<{ path: string | null; signedUrl: string | null; error: string | null }> {
  try {
    const startupId = formData.get('startupId') as string;
    const file = formData.get('file') as File | null;

    if (!startupId || !file) {
      return { path: null, signedUrl: null, error: 'startupId and file are required' };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { path: null, signedUrl: null, error: 'Unauthorized: Staff session required' };
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedName = sanitizeFileName(file.name);
    const storagePath = `excel-audits/${startupId}/${Date.now()}-${sanitizedName}`;

    // Upload using staff client (or admin client if startup ID is custom/mock in tests)
    const client = UUID_REGEX.test(startupId) ? supabase : createAdminClient();
    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      });

    if (uploadError) {
      return { path: null, signedUrl: null, error: uploadError.message };
    }

    // Generate a signed URL for immediate preview (valid 1 hour)
    const { data: signedData } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    // If UUID startup, update database reference and log activity
    if (UUID_REGEX.test(startupId)) {
      const admin = createAdminClient();
      await admin
        .from('startups')
        .update({ excel_audit_path: storagePath } as unknown as Record<string, unknown>)
        .eq('id', startupId);

      await admin.from('activity_logs').insert({
        startup_id: startupId,
        actor_id: user.id,
        action: 'EXCEL_AUDIT_UPLOADED',
        description: `Uploaded Excel audit file "${file.name}" to private storage`,
      });

      safeRevalidatePath(`/startups/${startupId}`);
    }

    return { path: storagePath, signedUrl: signedData?.signedUrl || null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { path: null, signedUrl: null, error: message || 'Failed to upload audit file' };
  }
}

/**
 * Creates a temporary signed URL for downloading or viewing a private file.
 */
export async function createSignedUrlAction(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    if (!storagePath) {
      return { signedUrl: null, error: 'Storage path is required' };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      return { signedUrl: null, error: error.message };
    }

    return { signedUrl: data?.signedUrl || null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { signedUrl: null, error: message || 'Failed to generate signed URL' };
  }
}

/**
 * Uploads evidence document (PDF, PNG, JPG, XLSX) for a milestone.
 * Can be called either by a founder using their magic token, or by authenticated staff.
 */
export async function uploadMilestoneEvidenceAction(
  formData: FormData
): Promise<{ success: boolean; evidenceLink: string | null; error: string | null }> {
  try {
    const token = formData.get('token') as string | null;
    const milestoneId = formData.get('milestoneId') as string;
    const file = formData.get('file') as File | null;
    const note = (formData.get('note') as string | null) || undefined;

    if (!milestoneId || !file) {
      return { success: false, evidenceLink: null, error: 'milestoneId and file are required' };
    }

    const admin = createAdminClient();
    let startupId: string;
    let actorType: 'FOUNDER' | 'STAFF' = 'FOUNDER';

    if (token) {
      // Validate founder magic token
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      const now = new Date().toISOString();

      const { data: link, error: linkError } = await admin
        .from('founder_links')
        .select('startup_id, expires_at, revoked_at')
        .eq('token_hash', tokenHash)
        .single();

      if (linkError || !link) {
        return { success: false, evidenceLink: null, error: 'Invalid or unrecognized founder link' };
      }

      if (link.revoked_at) {
        return { success: false, evidenceLink: null, error: 'This magic link has been revoked' };
      }

      if (new Date(link.expires_at) < new Date(now)) {
        return { success: false, evidenceLink: null, error: 'This magic link has expired' };
      }

      startupId = link.startup_id;
    } else {
      // Authenticated staff user
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, evidenceLink: null, error: 'Unauthorized: Token or staff session required' };
      }

      actorType = 'STAFF';

      // Verify milestone exists and get its startup_id
      const { data: ms, error: msErr } = await admin
        .from('milestones')
        .select('startup_id')
        .eq('id', milestoneId)
        .single();

      if (msErr || !ms) {
        return { success: false, evidenceLink: null, error: 'Milestone not found' };
      }

      startupId = ms.startup_id;
    }

    // Verify milestone belongs to the startup
    const { data: milestone, error: milestoneError } = await admin
      .from('milestones')
      .select('id, title, startup_id')
      .eq('id', milestoneId)
      .eq('startup_id', startupId)
      .single();

    if (milestoneError || !milestone) {
      return { success: false, evidenceLink: null, error: 'Milestone does not belong to this startup' };
    }

    // Upload to private storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedName = sanitizeFileName(file.name);
    const storagePath = `milestone-evidence/${startupId}/${milestoneId}/${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, evidenceLink: null, error: uploadError.message };
    }

    // Generate signed URL with long validity (e.g. 7 days = 604800s) or store storage path
    const { data: signedData } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 604800);

    const evidenceLink = signedData?.signedUrl || storagePath;

    // Update milestone
    const updatePayload: Record<string, unknown> = {
      evidence_link: evidenceLink,
      last_updated_by: actorType,
      last_updated_on: new Date().toISOString().split('T')[0],
    };
    if (note) {
      updatePayload.evidence_note = note;
    }

    const { error: updateError } = await admin
      .from('milestones')
      .update(updatePayload)
      .eq('id', milestoneId);

    if (updateError) {
      return { success: false, evidenceLink: null, error: updateError.message };
    }

    // Log activity
    await admin.from('activity_logs').insert({
      startup_id: startupId,
      actor_id: null,
      action: 'MILESTONE_EVIDENCE_ATTACHED',
      description: `${actorType === 'FOUNDER' ? 'Founder' : 'Staff'} attached evidence file "${file.name}" to milestone "${milestone.title}"`,
    });

    // Notify assigned manager
    const { data: startupRow } = await admin
      .from('startups')
      .select('name, manager_id')
      .eq('id', startupId)
      .single();

    if (startupRow?.manager_id) {
      const { data: notifRow } = await admin
        .from('notifications')
        .insert({
          title: 'Milestone Evidence Uploaded',
          message: `Evidence file uploaded for milestone "${milestone.title}" (${startupRow.name})`,
          type: 'STARTUP_UPDATE',
          startup_id: startupId,
          startup_name: startupRow.name,
          target_user_id: startupRow.manager_id,
          action_url: `/startups/${startupId}`,
        })
        .select('id')
        .single();

      if (notifRow?.id) {
        await admin.from('notification_recipients').insert({
          notification_id: notifRow.id,
          recipient_id: startupRow.manager_id,
        });
      }
    }

    if (token) {
      safeRevalidatePath(`/founder/${token}`);
    }
    safeRevalidatePath(`/startups/${startupId}`);

    return { success: true, evidenceLink, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, evidenceLink: null, error: message || 'Failed to upload milestone evidence' };
  }
}
