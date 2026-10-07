'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Marks a single notification as read for the currently authenticated user.
 */
export async function markNotificationReadAction(notificationId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!UUID_REGEX.test(notificationId)) {
      // Mock / legacy ID - safely ignore on DB
      return { success: true, error: null };
    }

    const { error: upsertError } = await supabase
      .from('notification_recipients')
      .upsert(
        {
          notification_id: notificationId,
          recipient_id: user.id,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'notification_id, recipient_id' }
      );

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to mark notification as read' };
  }
}

/**
 * Marks all notifications as read for the currently authenticated user.
 */
export async function markAllNotificationsReadAction(): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: notifs, error: fetchError } = await supabase
      .from('notifications')
      .select('id');

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!notifs || notifs.length === 0) {
      return { success: true, error: null };
    }

    const now = new Date().toISOString();
    const rows = notifs.map((n) => ({
      notification_id: n.id,
      recipient_id: user.id,
      read_at: now,
    }));

    const { error: upsertError } = await supabase
      .from('notification_recipients')
      .upsert(rows, { onConflict: 'notification_id, recipient_id' });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || 'Failed to mark all notifications as read' };
  }
}
