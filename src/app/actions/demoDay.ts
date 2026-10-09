'use server';

import { createClient } from '@/lib/supabase/server';
import {
  addInvestorSchema,
  createDemoDaySchema,
  createPitchConnectionSchema,
  updatePitchConnectionSchema,
} from '@/lib/validations/demoDay';
import { Investor, DemoDayEvent, PitchConnection } from '@/types';
import { revalidatePath } from 'next/cache';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuid(id?: string | null): string {
  if (id && UUID_REGEX.test(id)) return id;
  return crypto.randomUUID();
}

/**
 * Adds a new Investor / VC to the directory.
 */
export async function addInvestorAction(rawInput: unknown): Promise<{ data: Investor | null; error: string | null }> {
  try {
    const validated = addInvestorSchema.parse(rawInput);
    const investorId = toValidUuid(validated.id);

    const newInvestor: Investor = {
      id: investorId,
      name: validated.name,
      firm: validated.firm,
      type: validated.type,
      title: validated.title,
      email: validated.email || undefined,
      phone: validated.phone || undefined,
      linkedin: validated.linkedin || undefined,
      website: validated.website || undefined,
      sectors: validated.sectors,
      stages: validated.stages,
      ticketSize: validated.ticketSize,
      geography: validated.geography,
      thesis: validated.thesis,
      active: validated.active,
      createdAt: validated.createdAt,
    };

    try {
      const supabase = await createClient();
      await supabase.from('investors').insert({
        id: investorId,
        name: validated.name,
        firm: validated.firm,
        type: validated.type,
        title: validated.title,
        email: validated.email || null,
        phone: validated.phone || null,
        linkedin: validated.linkedin || null,
        website: validated.website || null,
        sectors: validated.sectors,
        stages: validated.stages,
        ticket_size: validated.ticketSize,
        geography: validated.geography,
        thesis: validated.thesis,
        active: validated.active,
        created_at: validated.createdAt,
      });
    } catch {
      // In case table is not yet migrated to remote Supabase, continue with store state
    }

    revalidatePath('/demo-day');
    return { data: newInvestor, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to add investor' };
  }
}

/**
 * Creates/schedules a Demo Day event.
 */
export async function createDemoDayAction(rawInput: unknown): Promise<{ data: DemoDayEvent | null; error: string | null }> {
  try {
    const validated = createDemoDaySchema.parse(rawInput);
    const eventId = toValidUuid(validated.id);

    const newEvent: DemoDayEvent = {
      id: eventId,
      title: validated.title,
      date: validated.date,
      time: validated.time,
      location: validated.location,
      description: validated.description,
      status: validated.status,
      cohort: validated.cohort,
      startupIds: validated.startupIds,
      investorIds: validated.investorIds,
      createdAt: validated.createdAt,
    };

    try {
      const supabase = await createClient();
      await supabase.from('demo_days').insert({
        id: eventId,
        title: validated.title,
        date: validated.date,
        time: validated.time || null,
        location: validated.location,
        description: validated.description,
        status: validated.status,
        cohort: validated.cohort,
        startup_ids: validated.startupIds,
        investor_ids: validated.investorIds,
        created_at: validated.createdAt,
      });
    } catch {
      // Continue gracefully
    }

    revalidatePath('/demo-day');
    return { data: newEvent, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to schedule demo day' };
  }
}

/**
 * Creates a pitch connection between a startup and an investor / VC.
 */
export async function createPitchConnectionAction(
  rawInput: unknown
): Promise<{ data: PitchConnection | null; error: string | null }> {
  try {
    const validated = createPitchConnectionSchema.parse(rawInput);
    const connectionId = toValidUuid(validated.id);

    const newConnection: PitchConnection = {
      id: connectionId,
      startupId: validated.startupId,
      investorId: validated.investorId,
      demoDayId: validated.demoDayId || null,
      connectedBy: validated.connectedBy,
      status: validated.status,
      round: validated.round,
      askAmount: validated.askAmount,
      pitchDeckUrl: validated.pitchDeckUrl || undefined,
      notes: validated.notes,
      nextAction: validated.nextAction,
      rating: validated.rating,
      connectedOn: validated.connectedOn,
      updatedAt: validated.updatedAt,
    };

    try {
      const supabase = await createClient();
      await supabase.from('pitch_connections').insert({
        id: connectionId,
        startup_id: validated.startupId,
        investor_id: validated.investorId,
        demo_day_id: validated.demoDayId || null,
        connected_by: validated.connectedBy,
        status: validated.status,
        round: validated.round,
        ask_amount: validated.askAmount,
        pitch_deck_url: validated.pitchDeckUrl || null,
        notes: validated.notes,
        next_action: validated.nextAction || null,
        rating: validated.rating || null,
        connected_on: validated.connectedOn,
        updated_at: validated.updatedAt,
      });
    } catch {
      // Continue gracefully
    }

    revalidatePath('/demo-day');
    revalidatePath('/portfolio');
    revalidatePath(`/startups/${validated.startupId}`);
    return { data: newConnection, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to create pitch connection' };
  }
}

/**
 * Updates a pitch connection (status, notes, rating, etc.)
 */
export async function updatePitchConnectionAction(
  rawInput: unknown
): Promise<{ data: Partial<PitchConnection> | null; error: string | null }> {
  try {
    const validated = updatePitchConnectionSchema.parse(rawInput);

    try {
      const supabase = await createClient();
      await supabase
        .from('pitch_connections')
        .update({
          ...(validated.status && { status: validated.status }),
          ...(validated.notes !== undefined && { notes: validated.notes }),
          ...(validated.nextAction !== undefined && { next_action: validated.nextAction }),
          ...(validated.rating !== undefined && { rating: validated.rating }),
          ...(validated.round && { round: validated.round }),
          ...(validated.askAmount && { ask_amount: validated.askAmount }),
          ...(validated.pitchDeckUrl !== undefined && { pitch_deck_url: validated.pitchDeckUrl }),
          ...(validated.demoDayId !== undefined && { demo_day_id: validated.demoDayId }),
          updated_at: validated.updatedAt,
        })
        .eq('id', validated.id);
    } catch {
      // Continue gracefully
    }

    revalidatePath('/demo-day');
    return { data: validated as Partial<PitchConnection>, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message || 'Failed to update pitch connection' };
  }
}
