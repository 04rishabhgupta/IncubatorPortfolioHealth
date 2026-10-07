'use server';

import { createClient } from '@/lib/supabase/server';
import {
  addMentorRequestSchema,
  updateMentorRequestSchema,
  addMentorMatchSchema,
  updateMentorMatchSchema,
  logMentorSessionSchema,
} from '@/lib/validations/mentors';
import { mentorRequestFromRow, mentorMatchFromRow } from '@/lib/supabase/mappers';
import { MentorRequest, MentorMatch } from '@/types';
import { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(id?: string | null): string {
  if (id && UUID_REGEX.test(id)) return id;
  return crypto.randomUUID();
}

/**
 * Creates a new mentor request record, dispatches a dashboard notification,
 * and logs the action in the startup activity log.
 */
export async function addMentorRequestAction(rawInput: unknown): Promise<{ data: MentorRequest | null; error: string | null }> {
  try {
    const validated = addMentorRequestSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to create a mentor request' };
    }

    const reqId = toValidUuid(validated.id);

    const { data: row, error: insertError } = await supabase
      .from('mentor_requests')
      .insert({
        id: reqId,
        startup_id: validated.startupId,
        challenge: validated.challenge,
        expertise_needed: validated.expertiseNeeded,
        raised_by: validated.raisedBy,
        created_on: validated.createdOn,
        ranked: (validated.ranked as unknown as Json) ?? null,
        recommended_mentor_id: validated.recommendedMentorId ?? null,
        status: validated.status,
        mentor_id: validated.mentorId ?? null,
        note: validated.note ?? null,
        fitt_task_n: validated.fittTaskN ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Look up startup details for notification & activity log
    const { data: startup } = await supabase
      .from('startups')
      .select('id, name, manager_id, associate_id')
      .eq('id', validated.startupId)
      .single();

    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    // Insert Notification
    await supabase.from('notifications').insert({
      id: notifId,
      title: 'New Mentor Request',
      message: `Mentor request logged for ${startupName} (${validated.expertiseNeeded.join(', ')}).`,
      type: 'MENTOR_REQUEST',
      startup_id: validated.startupId,
      startup_name: startupName,
      target_role: 'INVESTMENT_MANAGER',
      action_url: '/mentor-connect',
    });

    if (startup?.manager_id) {
      await supabase.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    // Insert Activity Log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Submitted mentor request for ${startupName} (${validated.expertiseNeeded.join(', ')}): ${validated.challenge}`,
    });

    revalidatePath('/mentor-connect');
    revalidatePath(`/startups/${validated.startupId}`);

    return { data: mentorRequestFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to create mentor request' };
  }
}

/**
 * Updates an existing mentor request record (e.g., status to MATCHED or DECLINED).
 */
export async function updateMentorRequestAction(rawInput: unknown): Promise<{ data: MentorRequest | null; error: string | null }> {
  try {
    const validated = updateMentorRequestSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to update a mentor request' };
    }

    if (!UUID_REGEX.test(validated.id)) {
      return { data: null, error: 'Invalid mentor request ID' };
    }

    const updatePayload: Record<string, unknown> = {};
    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.mentorId !== undefined) updatePayload.mentor_id = validated.mentorId;
    if (validated.note !== undefined) updatePayload.note = validated.note;
    if (validated.challenge !== undefined) updatePayload.challenge = validated.challenge;
    if (validated.expertiseNeeded !== undefined) updatePayload.expertise_needed = validated.expertiseNeeded;
    if (validated.recommendedMentorId !== undefined) updatePayload.recommended_mentor_id = validated.recommendedMentorId;

    const { data: row, error: updateError } = await supabase
      .from('mentor_requests')
      .update(updatePayload)
      .eq('id', validated.id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    if (row.startup_id && validated.status) {
      const { data: startup } = await supabase
        .from('startups')
        .select('name, manager_id, associate_id')
        .eq('id', row.startup_id)
        .single();

      const startupName = startup?.name || 'Startup';
      const notifId = crypto.randomUUID();

      await supabase.from('notifications').insert({
        id: notifId,
        title: `Mentor Request: ${validated.status}`,
        message: `Request for ${startupName} updated to ${validated.status}.`,
        type: 'MENTOR_RESPONSE',
        startup_id: row.startup_id,
        startup_name: startupName,
        action_url: '/mentor-connect',
      });

      if (startup?.manager_id) {
        await supabase.from('notification_recipients').insert({
          notification_id: notifId,
          recipient_id: startup.manager_id,
        });
      }
    }

    revalidatePath('/mentor-connect');
    return { data: mentorRequestFromRow(row), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update mentor request' };
  }
}

/**
 * Creates a mentor match and associated mentor sessions.
 */
export async function addMentorMatchAction(rawInput: unknown): Promise<{ data: MentorMatch | null; error: string | null }> {
  try {
    const validated = addMentorMatchSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to confirm a mentor match' };
    }

    const matchId = toValidUuid(validated.id);
    const validRequestId = validated.requestId && UUID_REGEX.test(validated.requestId) ? validated.requestId : null;

    const { data: row, error: insertError } = await supabase
      .from('mentor_matches')
      .insert({
        id: matchId,
        request_id: validRequestId,
        startup_id: validated.startupId,
        mentor_id: validated.mentorId,
        confirmed_by: validated.confirmedBy,
        confirmed_on: validated.confirmedOn,
        status: validated.status,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Insert any initial sessions
    if (validated.sessions && validated.sessions.length > 0) {
      for (const s of validated.sessions) {
        const sId = toValidUuid(s.id);
        await supabase.from('mentor_sessions').insert({
          id: sId,
          match_id: matchId,
          date: s.date,
          topic: s.topic,
          next_step: s.nextStep || '',
          rating: s.rating ?? null,
        });
      }
    }

    // Fetch related names for notifications & activity
    const [{ data: mentor }, { data: startup }] = await Promise.all([
      supabase.from('mentors').select('name').eq('id', validated.mentorId).single(),
      supabase.from('startups').select('id, name, manager_id, associate_id').eq('id', validated.startupId).single(),
    ]);

    const mentorName = mentor?.name || 'Mentor';
    const startupName = startup?.name || 'Startup';
    const notifId = crypto.randomUUID();

    await supabase.from('notifications').insert({
      id: notifId,
      title: 'Mentor Match Confirmed',
      message: `${mentorName} matched with ${startupName} (${validated.status}).`,
      type: 'MENTOR_MATCH',
      startup_id: validated.startupId,
      startup_name: startupName,
      action_url: '/mentor-connect',
    });

    if (startup?.manager_id) {
      await supabase.from('notification_recipients').insert({
        notification_id: notifId,
        recipient_id: startup.manager_id,
      });
    }

    // Activity log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Matched with mentor ${mentorName} for ${startupName}`,
    });

    // Fetch all sessions for this match
    const { data: sessionRows } = await supabase
      .from('mentor_sessions')
      .select('*')
      .eq('match_id', matchId);

    revalidatePath('/mentor-connect');
    revalidatePath(`/startups/${validated.startupId}`);

    return { data: mentorMatchFromRow(row, sessionRows || []), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to create mentor match' };
  }
}

/**
 * Updates an existing mentor match and syncs/appends sessions.
 */
export async function updateMentorMatchAction(rawInput: unknown): Promise<{ data: MentorMatch | null; error: string | null }> {
  try {
    const validated = updateMentorMatchSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to update a mentor match' };
    }

    if (!UUID_REGEX.test(validated.id)) {
      return { data: null, error: 'Invalid mentor match ID' };
    }

    const updatePayload: Record<string, unknown> = {};
    if (validated.status !== undefined) updatePayload.status = validated.status;

    let matchRow = null;
    if (Object.keys(updatePayload).length > 0) {
      const { data: row, error: updateError } = await supabase
        .from('mentor_matches')
        .update(updatePayload)
        .eq('id', validated.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError.message };
      }
      matchRow = row;
    } else {
      const { data: row, error: fetchError } = await supabase
        .from('mentor_matches')
        .select('*')
        .eq('id', validated.id)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }
      matchRow = row;
    }

    // Sync any provided sessions
    if (validated.sessions && validated.sessions.length > 0) {
      for (const s of validated.sessions) {
        const sId = toValidUuid(s.id);
        await supabase.from('mentor_sessions').upsert({
          id: sId,
          match_id: validated.id,
          date: s.date,
          topic: s.topic,
          next_step: s.nextStep || '',
          rating: s.rating ?? null,
        });
      }
    }

    const { data: sessionRows } = await supabase
      .from('mentor_sessions')
      .select('*')
      .eq('match_id', validated.id);

    revalidatePath('/mentor-connect');

    return { data: mentorMatchFromRow(matchRow, sessionRows || []), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update mentor match' };
  }
}

/**
 * Logs a new mentor session under a confirmed match.
 */
export async function logMentorSessionAction(rawInput: unknown): Promise<{ data: unknown | null; error: string | null }> {
  try {
    const validated = logMentorSessionSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to log a mentor session' };
    }

    if (!UUID_REGEX.test(validated.matchId)) {
      return { data: null, error: 'Invalid match ID' };
    }

    const sessionId = toValidUuid(validated.id);

    const { data: row, error: insertError } = await supabase
      .from('mentor_sessions')
      .insert({
        id: sessionId,
        match_id: validated.matchId,
        date: validated.date,
        topic: validated.topic,
        next_step: validated.nextStep,
        rating: validated.rating ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    revalidatePath('/mentor-connect');
    return { data: row, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to log mentor session' };
  }
}
