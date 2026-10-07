'use server';

import { createClient } from '@/lib/supabase/server';
import { addAssessmentSchema, updateAssessmentSchema } from '@/lib/validations/assessments';
import { assessmentFromRow } from '@/lib/supabase/mappers';
import { HealthAssessment } from '@/types';
import { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new health assessment record in DRAFT or AWAITING_APPROVAL state.
 */
export async function addAssessmentAction(rawInput: unknown): Promise<{ data: HealthAssessment | null; error: string | null }> {
  try {
    const validated = addAssessmentSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to create an assessment' };
    }

    const assessmentId = validated.id || crypto.randomUUID();

    const { data: row, error: insertError } = await supabase
      .from('health_assessments')
      .insert({
        id: assessmentId,
        startup_id: validated.startupId,
        month: validated.month,
        profile: validated.profile,
        dimensions: validated.dimensions as unknown as Json,
        total: validated.total,
        band: validated.band,
        delta_3m: validated.delta3m ?? null,
        strengths: validated.strengths,
        concerns: validated.concerns,
        actions: validated.actions as unknown as Json,
        status: validated.status,
        prepared_by: validated.preparedBy,
        submitted_on: validated.submittedOn ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('addAssessmentAction error:', insertError);
      return { data: null, error: insertError.message };
    }

    // Activity Log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Created ${validated.month} health assessment scorecard (Band: ${validated.band}, Score: ${validated.total})`,
    });

    revalidatePath(`/startups/${validated.startupId}`);
    revalidatePath('/assessments');

    return { data: assessmentFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('addAssessmentAction error:', message);
    return { data: null, error: message || 'Failed to add assessment' };
  }
}

/**
 * Approves a health assessment using the stored RPC `approve_assessment`.
 * Enforces database-level role verification: only the supervising Portfolio Head or Admin may approve.
 */
export async function approveAssessmentAction(assessmentId: string): Promise<{ data: HealthAssessment | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized' };
    }

    // Call stored procedure
    const { error: rpcError } = await supabase.rpc('approve_assessment', {
      p_assessment_id: assessmentId,
    });

    if (rpcError) {
      console.error('approve_assessment RPC error:', rpcError);
      return { data: null, error: rpcError.message };
    }

    const { data: row, error: fetchError } = await supabase
      .from('health_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError || !row) {
      return { data: null, error: fetchError?.message || 'Assessment not found after approval' };
    }

    await supabase.from('activity_logs').insert({
      startup_id: row.startup_id,
      actor: user.email || 'Staff',
      text: `Approved health assessment scorecard for month ${row.month}`,
    });

    revalidatePath(`/startups/${row.startup_id}`);
    revalidatePath('/assessments');

    return { data: assessmentFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to approve assessment' };
  }
}

/**
 * Updates a health assessment. If status is being transitioned to APPROVED, routes via approve_assessment RPC.
 */
export async function updateAssessmentAction(rawInput: unknown): Promise<{ data: HealthAssessment | null; error: string | null }> {
  try {
    const validated = updateAssessmentSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to update an assessment' };
    }

    // If approving, call RPC
    if (validated.status === 'APPROVED') {
      const approveRes = await approveAssessmentAction(validated.id);
      if (approveRes.error) {
        return approveRes;
      }
    }

    // Build update payload for other fields
    const updatePayload: Record<string, unknown> = {};
    if (validated.month !== undefined) updatePayload.month = validated.month;
    if (validated.profile !== undefined) updatePayload.profile = validated.profile;
    if (validated.dimensions !== undefined) updatePayload.dimensions = validated.dimensions as unknown as Json;
    if (validated.total !== undefined) updatePayload.total = validated.total;
    if (validated.band !== undefined) updatePayload.band = validated.band;
    if (validated.delta3m !== undefined) updatePayload.delta_3m = validated.delta3m;
    if (validated.strengths !== undefined) updatePayload.strengths = validated.strengths;
    if (validated.concerns !== undefined) updatePayload.concerns = validated.concerns;
    if (validated.actions !== undefined) updatePayload.actions = validated.actions as unknown as Json;
    if (validated.status !== undefined && validated.status !== 'APPROVED') updatePayload.status = validated.status;
    if (validated.returnComment !== undefined) updatePayload.return_comment = validated.returnComment;

    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedRow, error: updateError } = await supabase
        .from('health_assessments')
        .update(updatePayload)
        .eq('id', validated.id)
        .select()
        .single();

      if (updateError) {
        console.error('updateAssessmentAction error:', updateError);
        return { data: null, error: updateError.message };
      }

      revalidatePath('/assessments');
      return { data: assessmentFromRow(updatedRow), error: null };
    }

    // If only approved without other fields
    const { data: finalRow } = await supabase
      .from('health_assessments')
      .select('*')
      .eq('id', validated.id)
      .single();

    return { data: finalRow ? assessmentFromRow(finalRow) : null, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('updateAssessmentAction error:', message);
    return { data: null, error: message || 'Failed to update assessment' };
  }
}
