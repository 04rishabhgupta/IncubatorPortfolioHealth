'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createStartupSchema,
  updateStartupSchema,
  updateAssignmentSchema,
} from '@/lib/validations/startups';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { startupFromRow, metricFromRow } from '@/lib/supabase/mappers';
import { Startup, Sector, Stage, IPStatus, CommercialSignal, RegTag, FittTracker } from '@/types';
import { Database, Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new startup, its FITT tracker (if provided), calculates AI scores, logs activity, and sends notifications.
 */
export async function createStartupAction(rawInput: unknown): Promise<{ data: Startup | null; error: string | null }> {
  try {
    const validated = createStartupSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to create a startup' };
    }

    const startupId = crypto.randomUUID();

    const tempStartup: Startup = {
      id: startupId,
      name: validated.name,
      oneLiner: validated.oneLiner,
      sector: validated.sector as Sector,
      stage: validated.stage as Stage,
      cohort: validated.cohort,
      foundedOn: validated.foundedOn,
      website: validated.website || undefined,
      city: validated.city,
      managerId: validated.managerId,
      associateId: validated.associateId || null,
      trl: validated.trl,
      trlUpdatedOn: validated.trlUpdatedOn,
      ipStatus: validated.ipStatus as IPStatus,
      ipOwnershipClear: validated.ipOwnershipClear,
      commercialSignal: validated.commercialSignal as CommercialSignal,
      grantSanctioned: validated.grantSanctioned,
      grantDisbursed: validated.grantDisbursed,
      founderToken: '',
      archived: false,
      regTags: validated.regTags as RegTag[],
      fittTracker: validated.fittTracker as unknown as FittTracker | undefined,
    };

    const investibility = computeInvestibilityScore(tempStartup);
    const aiAnalysis = generateAIAnalysis(tempStartup);

    // 1. Insert startup record
    const { data: startupRow, error: insertError } = await supabase
      .from('startups')
      .insert({
        id: startupId,
        name: validated.name,
        one_liner: validated.oneLiner,
        sector: validated.sector,
        stage: validated.stage,
        cohort: validated.cohort,
        founded_on: validated.foundedOn,
        website: validated.website || null,
        city: validated.city,
        manager_id: validated.managerId,
        associate_id: validated.associateId || null,
        trl: validated.trl,
        trl_updated_on: validated.trlUpdatedOn,
        ip_status: validated.ipStatus,
        ip_ownership_clear: validated.ipOwnershipClear,
        commercial_signal: validated.commercialSignal,
        grant_sanctioned: validated.grantSanctioned,
        grant_disbursed: validated.grantDisbursed,
        archived: false,
        reg_tags: validated.regTags,
        investibility: investibility as unknown as Json,
        ai_analysis: aiAnalysis as unknown as Json,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('createStartupAction insert error:', insertError);
      return { data: null, error: insertError.message };
    }

    // 2. Insert FITT Tracker if provided
    let insertedTracker = null;
    if (validated.fittTracker) {
      const trackerCheckedOn = typeof validated.fittTracker.checkedOn === 'string' ? validated.fittTracker.checkedOn : null;
      const { data: trackerRow, error: trackerError } = await supabase
        .from('startup_fitt_trackers')
        .insert({
          startup_id: startupId,
          data: validated.fittTracker as unknown as Json,
          checked_on: trackerCheckedOn,
        })
        .select()
        .single();

      if (!trackerError) {
        insertedTracker = trackerRow;
      }
    }

    // 3. Log activity
    await supabase.from('activity_logs').insert({
      startup_id: startupId,
      actor: user.email || 'Staff',
      text: `Startup "${validated.name}" created and AI diagnostics initialized`,
    });

    // 4. Create Notification & Recipients
    const notifId = crypto.randomUUID();
    const { error: notifErr } = await supabase.from('notifications').insert({
      id: notifId,
      title: 'New Startup Created',
      message: `${validated.name} (${validated.sector}) added to incubator portfolio.`,
      type: 'STARTUP_UPDATE',
      startup_id: startupId,
      startup_name: validated.name,
      action_url: `/startups/${startupId}`,
    });

    if (!notifErr) {
      const recipients = [{ notification_id: notifId, recipient_id: validated.managerId }];
      if (validated.associateId && validated.associateId !== validated.managerId) {
        recipients.push({ notification_id: notifId, recipient_id: validated.associateId });
      }
      await supabase.from('notification_recipients').insert(recipients);
    }

    revalidatePath('/portfolio');
    revalidatePath('/admin');

    const created = startupFromRow(startupRow, insertedTracker);
    return { data: created, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('createStartupAction error:', message);
    return { data: null, error: message || 'Failed to create startup' };
  }
}

/**
 * Updates an existing startup's parameters and recomputes investibility/AI analysis.
 * Uses optimistic concurrency check if `trackerUpdatedAt` is provided.
 */
export async function updateStartupAction(rawInput: unknown): Promise<{ data: Startup | null; error: string | null }> {
  try {
    const validated = updateStartupSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to update a startup' };
    }

    // 1. Fetch current startup & tracker
    const { data: currentStartup, error: fetchError } = await supabase
      .from('startups')
      .select('*')
      .eq('id', validated.id)
      .single();

    if (fetchError || !currentStartup) {
      return { data: null, error: fetchError?.message || 'Startup not found' };
    }

    const { data: currentTracker } = await supabase
      .from('startup_fitt_trackers')
      .select('*')
      .eq('startup_id', validated.id)
      .maybeSingle();

    // Optimistic Concurrency Check for FITT Tracker
    if (validated.trackerUpdatedAt && currentTracker) {
      if (currentTracker.updated_at !== validated.trackerUpdatedAt) {
        return {
          data: null,
          error: 'Conflict: This tracker was modified by another user. Please refresh and try again.',
        };
      }
    }

    // 2. Fetch monthly metrics for score recalculation
    const { data: metricsRows } = await supabase
      .from('monthly_metrics')
      .select('*')
      .eq('startup_id', validated.id);

    const metrics = (metricsRows || []).map(metricFromRow);

    // Merge for AI score recomputation
    const mergedStartup: Startup = startupFromRow(currentStartup, currentTracker);
    if (validated.name !== undefined) mergedStartup.name = validated.name;
    if (validated.oneLiner !== undefined) mergedStartup.oneLiner = validated.oneLiner;
    if (validated.sector !== undefined) mergedStartup.sector = validated.sector as Sector;
    if (validated.stage !== undefined) mergedStartup.stage = validated.stage as Stage;
    if (validated.cohort !== undefined) mergedStartup.cohort = validated.cohort;
    if (validated.city !== undefined) mergedStartup.city = validated.city;
    if (validated.website !== undefined) mergedStartup.website = validated.website || undefined;
    if (validated.trl !== undefined) mergedStartup.trl = validated.trl;
    if (validated.trlUpdatedOn !== undefined) mergedStartup.trlUpdatedOn = validated.trlUpdatedOn;
    if (validated.ipStatus !== undefined) mergedStartup.ipStatus = validated.ipStatus as IPStatus;
    if (validated.ipOwnershipClear !== undefined) mergedStartup.ipOwnershipClear = validated.ipOwnershipClear;
    if (validated.commercialSignal !== undefined) mergedStartup.commercialSignal = validated.commercialSignal as CommercialSignal;
    if (validated.grantSanctioned !== undefined) mergedStartup.grantSanctioned = validated.grantSanctioned;
    if (validated.grantDisbursed !== undefined) mergedStartup.grantDisbursed = validated.grantDisbursed;
    if (validated.archived !== undefined) mergedStartup.archived = validated.archived;
    if (validated.regTags !== undefined) mergedStartup.regTags = validated.regTags as RegTag[];
    if (validated.fittTracker !== undefined) mergedStartup.fittTracker = validated.fittTracker as unknown as FittTracker;

    const investibility = computeInvestibilityScore(mergedStartup, metrics);
    const aiAnalysis = generateAIAnalysis(mergedStartup, metrics);

    // 3. Update startups table
    const updatePayload: Database['public']['Tables']['startups']['Update'] = {
      investibility: investibility as unknown as Json,
      ai_analysis: aiAnalysis as unknown as Json,
    };

    if (validated.name !== undefined) updatePayload.name = validated.name;
    if (validated.oneLiner !== undefined) updatePayload.one_liner = validated.oneLiner;
    if (validated.sector !== undefined) updatePayload.sector = validated.sector;
    if (validated.stage !== undefined) updatePayload.stage = validated.stage;
    if (validated.cohort !== undefined) updatePayload.cohort = validated.cohort;
    if (validated.city !== undefined) updatePayload.city = validated.city;
    if (validated.website !== undefined) updatePayload.website = validated.website || null;
    if (validated.trl !== undefined) updatePayload.trl = validated.trl;
    if (validated.trlUpdatedOn !== undefined) updatePayload.trl_updated_on = validated.trlUpdatedOn;
    if (validated.ipStatus !== undefined) updatePayload.ip_status = validated.ipStatus;
    if (validated.ipOwnershipClear !== undefined) updatePayload.ip_ownership_clear = validated.ipOwnershipClear;
    if (validated.commercialSignal !== undefined) updatePayload.commercial_signal = validated.commercialSignal;
    if (validated.grantSanctioned !== undefined) updatePayload.grant_sanctioned = validated.grantSanctioned;
    if (validated.grantDisbursed !== undefined) updatePayload.grant_disbursed = validated.grantDisbursed;
    if (validated.archived !== undefined) updatePayload.archived = validated.archived;
    if (validated.regTags !== undefined) updatePayload.reg_tags = validated.regTags;

    const { data: updatedStartupRow, error: updateError } = await supabase
      .from('startups')
      .update(updatePayload)
      .eq('id', validated.id)
      .select()
      .single();

    if (updateError) {
      console.error('updateStartupAction error:', updateError);
      return { data: null, error: updateError.message };
    }

    // 4. Update FITT tracker if provided
    let updatedTrackerRow = currentTracker;
    if (validated.fittTracker !== undefined) {
      const trackerCheckedOn = typeof validated.fittTracker.checkedOn === 'string' ? validated.fittTracker.checkedOn : null;
      const { data: tRow, error: tErr } = await supabase
        .from('startup_fitt_trackers')
        .upsert({
          startup_id: validated.id,
          data: validated.fittTracker as unknown as Json,
          checked_on: trackerCheckedOn,
        })
        .select()
        .single();

      if (!tErr) {
        updatedTrackerRow = tRow;
      }
    }

    // 5. Activity log
    await supabase.from('activity_logs').insert({
      startup_id: validated.id,
      actor: user.email || 'Staff',
      text: `Updated profile & recomputed AI diagnostics for ${mergedStartup.name}`,
    });

    revalidatePath(`/startups/${validated.id}`);
    revalidatePath('/portfolio');

    const result = startupFromRow(updatedStartupRow, updatedTrackerRow);
    return { data: result, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('updateStartupAction error:', message);
    return { data: null, error: message || 'Failed to update startup' };
  }
}

/**
 * Soft deletes (archives) a startup from the portfolio.
 */
export async function deleteStartupAction(startupId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error: archiveError } = await supabase
      .from('startups')
      .update({ archived: true })
      .eq('id', startupId);

    if (archiveError) {
      return { success: false, error: archiveError.message };
    }

    await supabase.from('activity_logs').insert({
      startup_id: startupId,
      actor: user.email || 'Staff',
      text: 'Archived startup from active portfolio',
    });

    revalidatePath('/portfolio');
    revalidatePath('/admin');
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to archive startup' };
  }
}

/**
 * Hard deletes a startup row and cascaded foreign records.
 */
export async function hardDeleteStartupAction(startupId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error: delError } = await supabase.from('startups').delete().eq('id', startupId);

    if (delError) {
      return { success: false, error: delError.message };
    }

    revalidatePath('/portfolio');
    revalidatePath('/admin');
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to delete startup' };
  }
}

/**
 * Atomically updates supervisory assignment using the database stored RPC `update_assignment`.
 */
export async function updateAssignmentAction(rawInput: unknown): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = updateAssignmentSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Call database RPC
    const { error: rpcError } = await supabase.rpc('update_assignment', {
      p_startup_id: validated.startupId,
      p_manager_id: validated.managerId,
      p_associate_id: validated.associateId || null,
    });

    if (rpcError) {
      console.error('update_assignment RPC error:', rpcError);
      return { success: false, error: rpcError.message };
    }

    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: validated.actor || user.email || 'Staff',
      text: `Reassigned portfolio oversight (Portfolio Head: ${validated.managerId}, Portfolio Manager: ${validated.associateId || 'Unassigned'})`,
    });

    revalidatePath(`/startups/${validated.startupId}`);
    revalidatePath('/portfolio');
    revalidatePath('/admin');
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to update assignment' };
  }
}
