import crypto from 'crypto';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  startupFromRow,
  metricFromRow,
  assessmentFromRow,
  milestoneFromRow,
  mentorMatchFromRow,
  dataRequestFromRow,
  founderActionItemFromRow,
} from '@/lib/supabase/mappers';
import { FounderPortalClient } from './FounderPortalClient';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ token: string }>;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export default async function FounderPortalPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const tokenHash = hashToken(token);
  const admin = createAdminClient();

  // 1. Look up active founder_links row (must not be revoked, must not be expired)
  const { data: link, error: linkError } = await admin
    .from('founder_links')
    .select('id, startup_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (linkError || !link) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-2xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full inline-block">
              Access Restricted
            </span>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
              Invalid or Expired Link
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              This founder portal magic link is invalid, has expired, or was revoked by incubator
              administration.
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-xs text-zinc-600 text-left space-y-1.5">
            <p className="font-semibold text-zinc-900">What should I do?</p>
            <p>
              Please contact your assigned Portfolio Manager or Portfolio Head at FITT to request a fresh,
              active founder portal link.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Staff Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Load ONLY that startup's data with the admin client
  const startupId = link.startup_id;

  const [
    startupRes,
    metricsRes,
    assessmentsRes,
    milestonesRes,
    matchesRes,
    requestsRes,
    actionItemsRes,
  ] = await Promise.all([
    admin.from('startups').select('*').eq('id', startupId).maybeSingle(),
    admin
      .from('monthly_metrics')
      .select('*')
      .eq('startup_id', startupId)
      .order('month', { ascending: true }),
    admin
      .from('health_assessments')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false }),
    admin
      .from('milestones')
      .select('*')
      .eq('startup_id', startupId)
      .order('target_date', { ascending: true }),
    admin
      .from('mentor_matches')
      .select('*')
      .eq('startup_id', startupId)
      .eq('status', 'ACTIVE'),
    admin
      .from('data_requests')
      .select('*')
      .eq('startup_id', startupId)
      .order('due_date', { ascending: true }),
    admin
      .from('founder_action_items')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false }),
  ]);

  if (!startupRes.data || startupRes.data.archived) {
    notFound();
  }

  const startup = startupFromRow(startupRes.data);
  const metrics = (metricsRes.data || []).map((row) => metricFromRow(row));
  const assessments = (assessmentsRes.data || []).map((row) => assessmentFromRow(row));
  const milestones = (milestonesRes.data || []).map((row) => milestoneFromRow(row));
  const mentorMatches = (matchesRes.data || []).map((row) => mentorMatchFromRow(row));
  const dataRequests = (requestsRes.data || []).map((row) => dataRequestFromRow(row));
  const actionItems = (actionItemsRes.data || []).map((row) => founderActionItemFromRow(row));

  return (
    <FounderPortalClient
      startup={startup}
      metrics={metrics}
      assessments={assessments}
      initialMilestones={milestones}
      initialMentorMatches={mentorMatches}
      initialDataRequests={dataRequests}
      initialActionItems={actionItems}
      token={token}
    />
  );
}
