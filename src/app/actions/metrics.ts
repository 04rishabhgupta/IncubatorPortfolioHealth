'use server';

import { createClient } from '@/lib/supabase/server';
import { upsertMetricSchema } from '@/lib/validations/metrics';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { startupFromRow, metricFromRow } from '@/lib/supabase/mappers';
import { MonthlyMetrics } from '@/types';
import { Json } from '@/types/database';
import { revalidatePath } from 'next/cache';

/**
 * Upserts a monthly metric record, recalculates the startup's investibility & AI diagnostics,
 * creates activity logs and flags low-runway alerts when appropriate.
 */
export async function upsertMetricAction(rawInput: unknown): Promise<{ data: MonthlyMetrics | null; error: string | null }> {
  try {
    const validated = upsertMetricSchema.parse(rawInput);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Unauthorized: You must be logged in to record metrics' };
    }

    const metricId = validated.id || crypto.randomUUID();

    // 1. Upsert monthly metric row
    const { data: metricRow, error: metricError } = await supabase
      .from('monthly_metrics')
      .upsert(
        {
          id: metricId,
          startup_id: validated.startupId,
          month: validated.month,
          cash_balance: validated.cashBalance,
          monthly_burn: validated.monthlyBurn,
          monthly_revenue: validated.monthlyRevenue,
          customer_conversations: validated.customerConversations,
          pilots: validated.pilots,
          lois: validated.lois,
          paying_customers: validated.payingCustomers,
          team_full_time: validated.teamFullTime,
          team_part_time: validated.teamPartTime,
          key_learnings: validated.keyLearnings || null,
          source: validated.source,
          recorded_on: validated.recordedOn,
        },
        { onConflict: 'startup_id,month' }
      )
      .select()
      .single();

    if (metricError) {
      console.error('upsertMetricAction error:', metricError);
      return { data: null, error: metricError.message };
    }

    // 2. Fetch startup & tracker to recompute scores
    const { data: startupRow } = await supabase
      .from('startups')
      .select('*')
      .eq('id', validated.startupId)
      .single();

    const { data: trackerRow } = await supabase
      .from('startup_fitt_trackers')
      .select('*')
      .eq('startup_id', validated.startupId)
      .maybeSingle();

    if (startupRow) {
      const { data: allMetricsRows } = await supabase
        .from('monthly_metrics')
        .select('*')
        .eq('startup_id', validated.startupId);

      const allMetrics = (allMetricsRows || []).map(metricFromRow);
      const startupObj = startupFromRow(startupRow, trackerRow);

      const investibility = computeInvestibilityScore(startupObj, allMetrics);
      const aiAnalysis = generateAIAnalysis(startupObj, allMetrics);

      await supabase
        .from('startups')
        .update({
          investibility: investibility as unknown as Json,
          ai_analysis: aiAnalysis as unknown as Json,
        })
        .eq('id', validated.startupId);

      // 3. Runway Warning Check (if burn > 0 and runway < 3 months)
      const runwayMonths = validated.monthlyBurn > 0 ? validated.cashBalance / validated.monthlyBurn : 99;
      if (runwayMonths < 3) {
        const notifId = crypto.randomUUID();
        await supabase.from('notifications').insert({
          id: notifId,
          title: 'Critical Runway Alert',
          message: `${startupRow.name} reported cash balance of ₹${validated.cashBalance.toLocaleString('en-IN')} with ${runwayMonths.toFixed(1)} months of operational runway remaining.`,
          type: 'RED_FLAG',
          startup_id: validated.startupId,
          startup_name: startupRow.name,
          action_url: `/startups/${validated.startupId}`,
        });
        const recipients = [{ notification_id: notifId, recipient_id: startupRow.manager_id }];
        if (startupRow.associate_id) {
          recipients.push({ notification_id: notifId, recipient_id: startupRow.associate_id });
        }
        await supabase.from('notification_recipients').insert(recipients);
      }
    }

    // 4. Activity Log
    await supabase.from('activity_logs').insert({
      startup_id: validated.startupId,
      actor: user.email || 'Staff',
      text: `Submitted metrics for month ${validated.month} (Revenue: ₹${validated.monthlyRevenue.toLocaleString('en-IN')}, Burn: ₹${validated.monthlyBurn.toLocaleString('en-IN')})`,
    });

    revalidatePath(`/startups/${validated.startupId}`);
    revalidatePath('/portfolio');

    return { data: metricFromRow(metricRow), error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('upsertMetricAction error:', message);
    return { data: null, error: message || 'Failed to upsert metric' };
  }
}
