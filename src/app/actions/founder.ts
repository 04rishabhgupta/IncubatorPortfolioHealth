'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  founderSubmitDataSchema,
  founderUpdateMilestoneSchema,
  founderConfirmMilestonesSchema,
  rotateFounderLinkSchema,
  revokeFounderLinkSchema,
} from '@/lib/validations/founder';
import {
  founderSubmissionFromRow,
  milestoneFromRow,
  dataRequestFromRow,
} from '@/lib/supabase/mappers';
import { FounderSubmission, Milestone, DataRequest } from '@/types';
import { Json } from '@/types/database';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // In test runners or background contexts without static generation store, ignore
  }
}

/**
 * Validates a magic token and retrieves the active link record.
 * Must not be expired or revoked.
 */
async function validateFounderToken(token: string) {
  if (!token || typeof token !== 'string') {
    return { link: null, error: 'Unauthorized: Magic token is missing or invalid' };
  }

  const tokenHash = hashToken(token);
  const admin = createAdminClient();

  const { data: link, error } = await admin
    .from('founder_links')
    .select('id, startup_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !link) {
    return { link: null, error: 'Unauthorized: Magic link is invalid, expired, or revoked' };
  }

  return { link, error: null };
}

/**
 * Submit founder data response (financials, traction, or custom response).
 * Re-validates the token hash and enforces startup scope.
 */
export async function submitFounderDataAction(
  rawInput: unknown
): Promise<{ data: FounderSubmission | null; error: string | null }> {
  try {
    const validated = founderSubmitDataSchema.parse(rawInput);
    const { link, error: authError } = await validateFounderToken(validated.token);

    if (authError || !link) {
      return { data: null, error: authError || 'Unauthorized' };
    }

    const admin = createAdminClient();
    const subId = crypto.randomUUID();
    const reqId = validated.requestId && UUID_REGEX.test(validated.requestId) ? validated.requestId : null;
    const submittedOn = new Date().toISOString().split('T')[0];

    const { data: row, error: insertError } = await admin
      .from('founder_submissions')
      .insert({
        id: subId,
        request_id: reqId,
        startup_id: link.startup_id,
        submitted_on: submittedOn,
        payload: validated.payload as Json,
        status: 'PENDING_REVIEW',
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // If linked to a data request, mark it as SUBMITTED
    if (reqId) {
      await admin
        .from('data_requests')
        .update({ status: 'SUBMITTED' })
        .eq('id', reqId)
        .eq('startup_id', link.startup_id);
    }

    // Lookup startup details for notifications
    const { data: startup } = await admin
      .from('startups')
      .select('name, manager_id')
      .eq('id', link.startup_id)
      .single();

    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    // Create notification for investment team
    await admin.from('notifications').insert({
      id: notifId,
      title: 'New Founder Submission',
      message: `${startupName} submitted metrics via the founder portal.`,
      type: 'STARTUP_UPDATE',
      startup_id: link.startup_id,
      startup_name: startupName,
      action_url: '/submissions',
    });

    if (startup?.manager_id) {
      await admin.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    // Log to activity log
    await admin.from('activity_logs').insert({
      startup_id: link.startup_id,
      actor: 'Founder',
      text: 'Submitted operating metrics via founder portal',
    });

    safeRevalidatePath(`/founder/${validated.token}`);
    safeRevalidatePath('/submissions');
    safeRevalidatePath(`/startups/${link.startup_id}`);

    return { data: founderSubmissionFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to submit founder data' };
  }
}

/**
 * Update milestone from founder portal.
 * Only permits founder-editable fields: status, percent_complete, delay_reason, evidence_note, evidence_link.
 * Forbids changing title, targets, category, or owner.
 */
export async function updateFounderMilestoneAction(
  rawInput: unknown
): Promise<{ data: Milestone | null; error: string | null }> {
  try {
    const validated = founderUpdateMilestoneSchema.parse(rawInput);
    const { link, error: authError } = await validateFounderToken(validated.token);

    if (authError || !link) {
      return { data: null, error: authError || 'Unauthorized' };
    }

    const admin = createAdminClient();

    // Verify milestone belongs to this startup
    const { data: existing, error: fetchError } = await admin
      .from('milestones')
      .select('*')
      .eq('id', validated.milestoneId)
      .eq('startup_id', link.startup_id)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: 'Milestone not found for this startup' };
    }

    const today = new Date().toISOString().split('T')[0];
    const updatePayload: Record<string, unknown> = {
      last_updated_by: 'FOUNDER',
      last_updated_on: today,
      updated_at: new Date().toISOString(),
    };

    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.percentComplete !== undefined) updatePayload.percent_complete = validated.percentComplete;
    if (validated.delayReason !== undefined) updatePayload.delay_reason = validated.delayReason;
    if (validated.evidenceNote !== undefined) updatePayload.evidence_note = validated.evidenceNote;
    if (validated.evidenceLink !== undefined) updatePayload.evidence_link = validated.evidenceLink;

    if (validated.status === 'COMPLETED' && !existing.completed_on) {
      updatePayload.completed_on = today;
    }

    const { data: row, error: updateError } = await admin
      .from('milestones')
      .update(updatePayload)
      .eq('id', validated.milestoneId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    // Log update
    await admin.from('activity_logs').insert({
      startup_id: link.startup_id,
      actor: 'Founder',
      text: `Updated milestone "${existing.title}" (${validated.status || existing.status}, ${validated.percentComplete ?? existing.percent_complete}%)`,
    });

    safeRevalidatePath(`/founder/${validated.token}`);
    safeRevalidatePath(`/startups/${link.startup_id}`);

    return { data: milestoneFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update milestone' };
  }
}

/**
 * Confirm milestones updated for a MILESTONE_STATUS data request.
 */
export async function confirmFounderMilestonesAction(
  rawInput: unknown
): Promise<{ data: DataRequest | null; error: string | null }> {
  try {
    const validated = founderConfirmMilestonesSchema.parse(rawInput);
    const { link, error: authError } = await validateFounderToken(validated.token);

    if (authError || !link) {
      return { data: null, error: authError || 'Unauthorized' };
    }

    const admin = createAdminClient();

    const { data: row, error: updateError } = await admin
      .from('data_requests')
      .update({ status: 'SUBMITTED' })
      .eq('id', validated.requestId)
      .eq('startup_id', link.startup_id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    // Notify team
    const { data: startup } = await admin
      .from('startups')
      .select('name, manager_id')
      .eq('id', link.startup_id)
      .single();

    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    await admin.from('notifications').insert({
      id: notifId,
      title: 'Milestones Update Confirmed',
      message: `${startupName} confirmed milestone progress for request "${row.title}".`,
      type: 'STARTUP_UPDATE',
      startup_id: link.startup_id,
      startup_name: startupName,
      action_url: '/submissions',
    });

    if (startup?.manager_id) {
      await admin.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    await admin.from('activity_logs').insert({
      startup_id: link.startup_id,
      actor: 'Founder',
      text: `Confirmed milestone progress for request: ${row.title}`,
    });

    safeRevalidatePath(`/founder/${validated.token}`);
    safeRevalidatePath('/submissions');
    safeRevalidatePath(`/startups/${link.startup_id}`);

    return { data: dataRequestFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to confirm milestone update' };
  }
}

// ------------------------------------------------------------------------------
// STAFF ACTIONS: Link Rotation & Revocation
// ------------------------------------------------------------------------------

export interface FounderLinkStatus {
  hasActiveLink: boolean;
  expiresAt: string | null;
  createdAt: string | null;
  isExpired: boolean;
  isRevoked: boolean;
}

/**
 * Returns the current status of a startup's founder link.
 * Requires authenticated staff with startup access.
 */
export async function getFounderLinkStatusAction(
  startupId: string
): Promise<{ data: FounderLinkStatus | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: Login required' };
    }

    const { data: links, error } = await supabase
      .from('founder_links')
      .select('id, expires_at, revoked_at, created_at')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const now = new Date();
    const activeLink = links?.find((l) => !l.revoked_at && new Date(l.expires_at) > now);
    const latest = links?.[0] || null;

    return {
      data: {
        hasActiveLink: !!activeLink,
        expiresAt: activeLink?.expires_at || latest?.expires_at || null,
        createdAt: latest?.created_at || null,
        isExpired: latest ? new Date(latest.expires_at) <= now : false,
        isRevoked: latest ? !!latest.revoked_at : false,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to retrieve founder link status' };
  }
}

/**
 * Rotates the magic link for a startup. Revokes all active links and creates a new one.
 * Returns the plaintext unhashed token once for immediate copying.
 */
export async function rotateFounderLinkAction(
  rawInput: unknown
): Promise<{ data: { token: string; expiresAt: string } | null; error: string | null }> {
  try {
    const validated = rotateFounderLinkSchema.parse(rawInput);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: Login required' };
    }

    // Revoke any active links for this startup
    await supabase
      .from('founder_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('startup_id', validated.startupId)
      .is('revoked_at', null);

    // Generate new unguessable token
    const rawToken = 'fl_' + crypto.randomBytes(24).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const days = validated.expiresInDays || 90;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('founder_links').insert({
      id: crypto.randomUUID(),
      startup_id: validated.startupId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
    });

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Log rotation
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Rotated founder portal magic link (valid for ${days} days)`,
    });

    safeRevalidatePath(`/startups/${validated.startupId}`);

    return {
      data: {
        token: rawToken,
        expiresAt,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to rotate founder link' };
  }
}

/**
 * Revokes all active founder links for a startup immediately.
 */
export async function revokeFounderLinkAction(
  rawInput: unknown
): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = revokeFounderLinkSchema.parse(rawInput);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: Login required' };
    }

    const { error: updateError } = await supabase
      .from('founder_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('startup_id', validated.startupId)
      .is('revoked_at', null);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log revocation
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: 'Revoked founder portal magic link',
    });

    safeRevalidatePath(`/startups/${validated.startupId}`);

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to revoke founder link' };
  }
}
