'use server';

import { createClient } from '@/lib/supabase/server';
import {
  addDataRequestSchema,
  updateDataRequestSchema,
  addSubmissionSchema,
  updateSubmissionSchema,
  addFounderActionItemsSchema,
} from '@/lib/validations/requests';
import {
  dataRequestFromRow,
  founderSubmissionFromRow,
  founderActionItemFromRow,
} from '@/lib/supabase/mappers';
import { DataRequest, FounderSubmission, FounderActionItem } from '@/types';
import { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(id?: string | null): string {
  if (id && UUID_REGEX.test(id)) return id;
  return crypto.randomUUID();
}

/**
 * Creates a new data request for a portfolio startup, dispatches notification,
 * and logs the action in the startup activity log.
 */
export async function addDataRequestAction(rawInput: unknown): Promise<{ data: DataRequest | null; error: string | null }> {
  try {
    const validated = addDataRequestSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to create a data request' };
    }

    const reqId = toValidUuid(validated.id);

    const { data: row, error: insertError } = await supabase
      .from('data_requests')
      .insert({
        id: reqId,
        startup_id: validated.startupId,
        type: validated.type,
        title: validated.title,
        message: validated.message ?? null,
        custom_questions: (validated.customQuestions as unknown as Json) ?? null,
        milestone_ids: validated.milestoneIds?.filter((id) => UUID_REGEX.test(id)) ?? null,
        month: validated.month ?? null,
        due_date: validated.dueDate,
        created_by: validated.createdBy,
        created_on: validated.createdOn,
        status: validated.status,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Lookup startup for notification & activity log
    const { data: startup } = await supabase
      .from('startups')
      .select('id, name, manager_id, associate_id')
      .eq('id', validated.startupId)
      .single();

    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    // Create Notification
    await supabase.from('notifications').insert({
      id: notifId,
      title: 'New Data Request Created',
      message: `Data request "${validated.title}" created for ${startupName} (Due: ${validated.dueDate}).`,
      type: 'DATA_REQUEST',
      startup_id: validated.startupId,
      startup_name: startupName,
      action_url: '/submissions',
    });

    if (startup?.manager_id) {
      await supabase.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    // Activity Log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Created data request "${validated.title}" (Due: ${validated.dueDate})`,
    });

    revalidatePath('/submissions');
    revalidatePath(`/startups/${validated.startupId}`);

    return { data: dataRequestFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to create data request' };
  }
}

/**
 * Updates an existing data request (e.g. status changes).
 */
export async function updateDataRequestAction(rawInput: unknown): Promise<{ data: DataRequest | null; error: string | null }> {
  try {
    const validated = updateDataRequestSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to update a data request' };
    }

    if (!UUID_REGEX.test(validated.id)) {
      return { data: null, error: 'Invalid data request ID' };
    }

    const updatePayload: Record<string, unknown> = {};
    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.title !== undefined) updatePayload.title = validated.title;
    if (validated.dueDate !== undefined) updatePayload.due_date = validated.dueDate;
    if (validated.message !== undefined) updatePayload.message = validated.message;

    const { data: row, error: updateError } = await supabase
      .from('data_requests')
      .update(updatePayload)
      .eq('id', validated.id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    revalidatePath('/submissions');
    return { data: dataRequestFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update data request' };
  }
}

/**
 * Adds a founder submission response to a data request.
 */
export async function addSubmissionAction(rawInput: unknown): Promise<{ data: FounderSubmission | null; error: string | null }> {
  try {
    const validated = addSubmissionSchema.parse(rawInput);
    const supabase = await createClient();

    const subId = toValidUuid(validated.id);
    const reqId = validated.requestId && UUID_REGEX.test(validated.requestId) ? validated.requestId : null;

    const { data: row, error: insertError } = await supabase
      .from('founder_submissions')
      .insert({
        id: subId,
        request_id: reqId,
        startup_id: validated.startupId,
        submitted_on: validated.submittedOn,
        payload: validated.payload as Json,
        status: validated.status,
        reviewed_by: validated.reviewedBy && UUID_REGEX.test(validated.reviewedBy) ? validated.reviewedBy : null,
        reviewed_on: validated.reviewedOn ?? null,
        review_comment: validated.reviewComment ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Lookup startup for notification
    const { data: startup } = await supabase
      .from('startups')
      .select('name, manager_id')
      .eq('id', validated.startupId)
      .single();

    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    await supabase.from('notifications').insert({
      id: notifId,
      title: 'New Founder Submission',
      message: `${startupName} submitted responses for data request review.`,
      type: 'STARTUP_UPDATE',
      startup_id: validated.startupId,
      startup_name: startupName,
      action_url: '/submissions',
    });

    if (startup?.manager_id) {
      await supabase.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    // Activity Log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: 'Founder',
      text: `Founder submitted response for data request review`,
    });

    revalidatePath('/submissions');
    return { data: founderSubmissionFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to record founder submission' };
  }
}

/**
 * Updates a founder submission (e.g. accepted or returned with review comments).
 */
export async function updateSubmissionAction(rawInput: unknown): Promise<{ data: FounderSubmission | null; error: string | null }> {
  try {
    const validated = updateSubmissionSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to review a submission' };
    }

    if (!UUID_REGEX.test(validated.id)) {
      return { data: null, error: 'Invalid submission ID' };
    }

    const reviewerId = validated.reviewedBy && UUID_REGEX.test(validated.reviewedBy) ? validated.reviewedBy : user.id;

    const updatePayload: Record<string, unknown> = {};
    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.reviewComment !== undefined) updatePayload.review_comment = validated.reviewComment;
    if (validated.reviewedOn !== undefined) updatePayload.reviewed_on = validated.reviewedOn;
    updatePayload.reviewed_by = reviewerId;

    const { data: row, error: updateError } = await supabase
      .from('founder_submissions')
      .update(updatePayload)
      .eq('id', validated.id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    if (row.startup_id && validated.status) {
      // Activity Log
      await supabase.from('activity_logs').insert({
        startup_id: row.startup_id,
        actor: user.email || 'Staff',
        text: `Submission ${validated.status === 'ACCEPTED' ? 'accepted' : 'returned for revision'}`,
      });
    }

    revalidatePath('/submissions');
    return { data: founderSubmissionFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update submission' };
  }
}

/**
 * Batch adds founder action items generated from diagnostics/reviews.
 */
export async function addFounderActionItemsAction(rawInput: unknown): Promise<{ data: FounderActionItem[] | null; error: string | null }> {
  try {
    const validated = addFounderActionItemsSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to create action items' };
    }

    const rowsToInsert = validated.items.map((item) => ({
      id: toValidUuid(item.id),
      startup_id: item.startupId,
      title: item.title,
      cause: item.cause,
      effect: item.effect,
      fix: item.fix,
      note: item.note ?? null,
      shared_by: item.sharedBy && UUID_REGEX.test(item.sharedBy) ? item.sharedBy : user.id,
      shared_on: item.sharedOn,
    }));

    const { data: rows, error: insertError } = await supabase
      .from('founder_action_items')
      .insert(rowsToInsert)
      .select();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: (rows || []).map(founderActionItemFromRow), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to create founder action items' };
  }
}
