'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { inviteStaffSchema, updateStaffSchema } from '@/lib/validations/users';
import { userFromProfile } from '@/lib/supabase/mappers';
import { User } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Invites a new staff member to the incubator via Supabase Auth Admin.
 * Only authenticated users with the ADMIN role may invoke this action.
 */
export async function inviteStaffUserAction(
  rawInput: unknown
): Promise<{ data: User | null; error: string | null }> {
  try {
    const validated = inviteStaffSchema.parse(rawInput);
    const supabase = await createClient();

    // 1. Verify caller session
    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return { data: null, error: 'Unauthorized: You must be signed in to invite staff members.' };
    }

    // 2. Verify caller has ADMIN role in profiles
    const { data: callerProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, label, email')
      .eq('id', callerUser.id)
      .single();

    if (profileErr || callerProfile?.role !== 'ADMIN') {
      return { data: null, error: 'Forbidden: Only administrators can invite new staff members.' };
    }

    // 3. If inviting an Associate, verify the assigned manager exists and is a Portfolio Head
    if (validated.role === 'INVESTMENT_ASSOCIATE' && validated.managerId) {
      const { data: managerProfile, error: managerErr } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', validated.managerId)
        .single();

      if (managerErr || !managerProfile || managerProfile.role !== 'INVESTMENT_MANAGER') {
        return {
          data: null,
          error: 'Invalid manager: Assigned manager must be an active Portfolio Head (INVESTMENT_MANAGER).',
        };
      }
    }

    // 4. Use Admin Client to send Supabase Auth invite
    const adminClient = createAdminClient();

    const normalizedEmail = validated.email.trim().toLowerCase();

    // Check if profile already exists with this email
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return {
        data: null,
        error: `A user profile with email "${normalizedEmail}" already exists.`,
      };
    }

    // Send the invite link via Supabase Auth
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          label: validated.label,
          role: validated.role,
        },
      }
    );

    if (inviteErr || !inviteData?.user) {
      return {
        data: null,
        error: inviteErr?.message || 'Failed to send invite email through Supabase Auth.',
      };
    }

    const newUserId = inviteData.user.id;

    // 5. Create or upsert the profile record
    const { data: newProfile, error: insertProfileErr } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: newUserId,
          email: normalizedEmail,
          role: validated.role,
          label: validated.label,
          manager_id: validated.managerId || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (insertProfileErr || !newProfile) {
      return {
        data: null,
        error: `Failed to create staff profile: ${insertProfileErr?.message || 'Unknown error'}`,
      };
    }

    // 6. Log activity
    await adminClient.from('activity_logs').insert({
      actor: callerProfile.email || callerProfile.label || 'Admin',
      text: `Invited new team member "${validated.label}" (${validated.role}) to incubator staff.`,
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { data: userFromProfile(newProfile), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred while inviting staff.';
    return { data: null, error: message };
  }
}

/**
 * Updates a staff member's label, role, or reporting manager.
 * Admin-only operation.
 */
export async function updateStaffUserAction(
  rawInput: unknown
): Promise<{ data: User | null; error: string | null }> {
  try {
    const validated = updateStaffSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user: callerUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !callerUser) {
      return { data: null, error: 'Unauthorized: You must be signed in.' };
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, email, label')
      .eq('id', callerUser.id)
      .single();

    if (callerProfile?.role !== 'ADMIN') {
      return { data: null, error: 'Forbidden: Only administrators can update staff members.' };
    }

    const adminClient = createAdminClient();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validated.label) updatePayload.label = validated.label;
    if (validated.role) updatePayload.role = validated.role;
    if (validated.managerId !== undefined) updatePayload.manager_id = validated.managerId;

    const { data: updatedProfile, error: updateErr } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', validated.userId)
      .select()
      .single();

    if (updateErr || !updatedProfile) {
      return { data: null, error: updateErr?.message || 'Failed to update staff profile.' };
    }

    await adminClient.from('activity_logs').insert({
      actor: callerProfile.email || callerProfile.label || 'Admin',
      text: `Updated staff profile for "${updatedProfile.label}" (${updatedProfile.role}).`,
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { data: userFromProfile(updatedProfile), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update staff member.';
    return { data: null, error: message };
  }
}
