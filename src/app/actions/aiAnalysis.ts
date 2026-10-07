'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { startupFromRow, metricFromRow } from '@/lib/supabase/mappers';
import { Startup } from '@/types';
import { revalidatePath } from 'next/cache';

function safeRevalidatePath(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Graceful fallback for test runner
  }
}

/**
 * Recomputes deep AI Analysis and Investibility scoring for a startup,
 * updating the DB jsonb columns and creating an audit activity log.
 */
export async function recomputeStartupAiAnalysisAction(
  startupId: string
): Promise<{ success: boolean; aiAnalysis: Startup['aiAnalysis'] | null; error: string | null }> {
  try {
    if (!startupId) {
      return { success: false, aiAnalysis: null, error: 'startupId is required' };
    }

    let actorId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      actorId = user?.id || null;
    } catch {
      // Running in unit test runner or background job outside request scope
    }

    const admin = createAdminClient();

    // Fetch startup and its latest metrics + tracker
    const [startupRes, trackerRes, metricsRes] = await Promise.all([
      admin.from('startups').select('*').eq('id', startupId).single(),
      admin.from('startup_fitt_trackers').select('*').eq('startup_id', startupId).single(),
      admin.from('monthly_metrics').select('*').eq('startup_id', startupId).order('month', { ascending: true }),
    ]);

    if (startupRes.error || !startupRes.data) {
      return { success: false, aiAnalysis: null, error: 'Startup not found' };
    }

    const startupObj = startupFromRow(startupRes.data, trackerRes.data || undefined);
    const metrics = (metricsRes.data || []).map(metricFromRow);

    // Compute updated scores
    const investibility = computeInvestibilityScore(startupObj, metrics);
    const aiAnalysis = generateAIAnalysis(startupObj, metrics);

    // Persist to Supabase
    const { error: updateError } = await admin
      .from('startups')
      .update({
        investibility: investibility as unknown as Record<string, unknown>,
        ai_analysis: aiAnalysis as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', startupId);

    if (updateError) {
      return { success: false, aiAnalysis: null, error: updateError.message };
    }

    // Log activity
    await admin.from('activity_logs').insert({
      startup_id: startupId,
      actor_id: actorId,
      action: 'AI_ANALYSIS_RECOMPUTED',
      description: `Recomputed deep AI diagnostics and investibility rating (${investibility.grade})`,
    });

    safeRevalidatePath(`/startups/${startupId}`);
    return { success: true, aiAnalysis, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, aiAnalysis: null, error: message || 'Failed to recompute AI analysis' };
  }
}
