/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { users, demoPasswords } from '../src/data/seed/users';
import { startups } from '../src/data/seed/startups';
import { teams } from '../src/data/seed/teams';
import { milestones } from '../src/data/seed/milestones';
import { metrics } from '../src/data/seed/metrics';
import { assessments } from '../src/data/seed/assessments';
import { dataRequests } from '../src/data/seed/dataRequests';
import { submissions } from '../src/data/seed/submissions';
import { mentors } from '../src/data/seed/mentors';
import { mentorRequests } from '../src/data/seed/mentorRequests';
import { mentorMatches } from '../src/data/seed/mentorMatches';
import { seedNotifications as notifications } from '../src/data/seed/notifications';
import { regulatory } from '../src/data/seed/regulatory';
import { computeInvestibilityScore, generateAIAnalysis } from '../src/lib/aiAnalysis';

// Fixed deterministic UUID namespace for Folio OS
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function uuidFor(entity: string, rawId: string): string {
  return uuidv5(`${entity}:${rawId}`, NAMESPACE);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // --------------------------------------------------------------------------
  // 1. SEED AUTH USERS & PROFILES
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Seeding Auth Users & Profiles ---');
  const { data: authList, error: listError } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listError) {
    console.error('Failed to list auth users:', listError.message);
    process.exit(1);
  }

  const existingAuthMap = new Map<string, string>();
  authList.users.forEach((u) => {
    if (u.email) existingAuthMap.set(u.email.toLowerCase(), u.id);
  });

  // Create or retrieve auth accounts
  for (const u of users) {
    const deterministicId = uuidFor('user', u.id);
    const existingId = existingAuthMap.get(u.email.toLowerCase());

    if (!existingId) {
      console.log(`Creating Auth user: ${u.email} (${u.label})`);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        id: deterministicId,
        email: u.email,
        password: demoPasswords[u.role],
        email_confirm: true,
        user_metadata: { role: u.role, label: u.label },
      });
      if (createError) {
        console.error(`Failed to create ${u.email}:`, createError.message);
      } else if (newUser.user) {
        existingAuthMap.set(u.email.toLowerCase(), newUser.user.id);
      }
    } else {
      console.log(`Auth user already exists: ${u.email}`);
    }
  }

  // Upsert Profiles: Managers & Admins first, then Associates
  const managersAndAdmins = users.filter((u) => u.role !== 'INVESTMENT_ASSOCIATE');
  const associates = users.filter((u) => u.role === 'INVESTMENT_ASSOCIATE');

  for (const u of managersAndAdmins) {
    const uid = existingAuthMap.get(u.email.toLowerCase()) || uuidFor('user', u.id);
    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      email: u.email,
      role: u.role,
      label: u.label,
      manager_id: null,
    });
    if (error) console.error(`Error upserting profile ${u.email}:`, error.message);
  }

  for (const u of associates) {
    const uid = existingAuthMap.get(u.email.toLowerCase()) || uuidFor('user', u.id);
    const managerUid = u.managerId
      ? existingAuthMap.get(users.find((m) => m.id === u.managerId)?.email.toLowerCase() || '') || uuidFor('user', u.managerId)
      : null;

    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      email: u.email,
      role: u.role,
      label: u.label,
      manager_id: managerUid,
    });
    if (error) console.error(`Error upserting profile ${u.email}:`, error.message);
  }
  console.log(`✓ Seeded ${users.length} profiles`);

  // --------------------------------------------------------------------------
  // 2. SEED STARTUPS, FITT TRACKERS & FOUNDER LINKS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Seeding Startups & FITT Trackers ---');
  for (const s of startups) {
    const startupUuid = uuidFor('startup', s.id);
    const managerUuid = uuidFor('user', s.managerId);
    const associateUuid = s.associateId ? uuidFor('user', s.associateId) : null;

    // Filter relevant metrics for scoring
    const startupMetrics = metrics.filter((m) => m.startupId === s.id);
    const investibility = computeInvestibilityScore(s, startupMetrics);
    const aiAnalysis = generateAIAnalysis(s, startupMetrics);

    const { error: sError } = await supabase.from('startups').upsert({
      id: startupUuid,
      name: s.name,
      one_liner: s.oneLiner,
      sector: s.sector,
      stage: s.stage,
      cohort: s.cohort,
      founded_on: s.foundedOn,
      website: s.website || null,
      city: s.city,
      manager_id: managerUuid,
      associate_id: associateUuid,
      trl: s.trl,
      trl_updated_on: s.trlUpdatedOn,
      ip_status: s.ipStatus,
      ip_ownership_clear: s.ipOwnershipClear,
      commercial_signal: s.commercialSignal,
      grant_sanctioned: s.grantSanctioned,
      grant_disbursed: s.grantDisbursed,
      archived: s.archived,
      reg_tags: s.regTags,
      investibility: investibility as any,
      ai_analysis: aiAnalysis as any,
      created_by: managerUuid,
    });
    if (sError) console.error(`Error upserting startup ${s.name}:`, sError.message);

    if (s.fittTracker) {
      const { error: fittError } = await supabase.from('startup_fitt_trackers').upsert({
        startup_id: startupUuid,
        data: s.fittTracker as any,
        checked_on: s.fittTracker.checkedOn || null,
      });
      if (fittError) console.error(`Error upserting FITT tracker for ${s.name}:`, fittError.message);
    }

    if (s.founderToken) {
      const tokenHash = crypto.createHash('sha256').update(s.founderToken).digest('hex');
      const { error: linkError } = await supabase.from('founder_links').upsert({
        id: uuidFor('founder_link', s.id),
        startup_id: startupUuid,
        token_hash: tokenHash,
        expires_at: '2028-12-31T23:59:59.000Z',
        revoked_at: null,
      });
      if (linkError) console.error(`Error upserting founder link for ${s.name}:`, linkError.message);
    }
  }
  console.log(`✓ Seeded ${startups.length} startups and founder links`);

  // --------------------------------------------------------------------------
  // 3. SEED TEAM MEMBERS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Seeding Team Members ---');
  for (const tm of teams) {
    const { error } = await supabase.from('team_members').upsert({
      id: uuidFor('team_member', tm.id),
      startup_id: uuidFor('startup', tm.startupId),
      name: tm.name,
      role: tm.role,
      is_founder: tm.isFounder,
      full_time: tm.fullTime,
      equity_pct: tm.equityPct ?? null,
      email: tm.email,
      phone: tm.phone || null,
    });
    if (error) console.error(`Error upserting team member ${tm.name}:`, error.message);
  }
  console.log(`✓ Seeded ${teams.length} team members`);

  // --------------------------------------------------------------------------
  // 4. SEED MILESTONES
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Seeding Milestones ---');
  for (const m of milestones) {
    const { error } = await supabase.from('milestones').upsert({
      id: uuidFor('milestone', m.id),
      startup_id: uuidFor('startup', m.startupId),
      title: m.title,
      category: m.category,
      target_date: m.targetDate,
      revised_date: m.revisedDate || null,
      delay_reason: m.delayReason || null,
      status: m.status,
      percent_complete: m.percentComplete,
      evidence_note: m.evidenceNote || null,
      evidence_link: m.evidenceLink || null,
      completed_on: m.completedOn || null,
      last_updated_by: m.lastUpdatedBy,
      last_updated_on: m.lastUpdatedOn,
    });
    if (error) console.error(`Error upserting milestone ${m.title}:`, error.message);
  }
  console.log(`✓ Seeded ${milestones.length} milestones`);

  // --------------------------------------------------------------------------
  // 5. SEED MONTHLY METRICS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Seeding Monthly Metrics ---');
  for (const m of metrics) {
    const { error } = await supabase.from('monthly_metrics').upsert({
      id: uuidFor('metric', m.id),
      startup_id: uuidFor('startup', m.startupId),
      month: m.month,
      cash_balance: m.cashBalance,
      monthly_burn: m.monthlyBurn,
      monthly_revenue: m.monthlyRevenue,
      customer_conversations: m.customerConversations,
      pilots: m.pilots,
      lois: m.lois,
      paying_customers: m.payingCustomers,
      team_full_time: m.teamFullTime,
      team_part_time: m.teamPartTime,
      key_learnings: m.keyLearnings || null,
      source: m.source,
      recorded_on: m.recordedOn,
    });
    if (error) console.error(`Error upserting metric ${m.month} for startup:`, error.message);
  }
  console.log(`✓ Seeded ${metrics.length} metric entries`);

  // --------------------------------------------------------------------------
  // 6. SEED HEALTH ASSESSMENTS
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Seeding Health Assessments ---');
  for (const a of assessments) {
    const { error } = await supabase.from('health_assessments').upsert({
      id: uuidFor('assessment', a.id),
      startup_id: uuidFor('startup', a.startupId),
      month: a.month,
      profile: a.profile,
      dimensions: a.dimensions as any,
      total: a.total,
      band: a.band,
      delta_3m: a.delta3m ?? null,
      strengths: a.strengths,
      concerns: a.concerns,
      actions: a.actions as any,
      status: a.status,
      prepared_by: uuidFor('user', a.preparedBy),
      submitted_on: a.submittedOn ? new Date(a.submittedOn).toISOString() : null,
      approved_by: a.approvedBy ? uuidFor('user', a.approvedBy) : null,
      approved_on: a.approvedOn ? new Date(a.approvedOn).toISOString() : null,
      return_comment: a.returnComment || null,
    });
    if (error) console.error(`Error upserting assessment ${a.id}:`, error.message);
  }
  console.log(`✓ Seeded ${assessments.length} health assessments`);

  // --------------------------------------------------------------------------
  // 7. SEED DATA REQUESTS & SUBMISSIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Seeding Data Requests & Submissions ---');
  for (const req of dataRequests) {
    const { error } = await supabase.from('data_requests').upsert({
      id: uuidFor('data_request', req.id),
      startup_id: uuidFor('startup', req.startupId),
      type: req.type,
      title: req.title,
      message: req.message || null,
      custom_questions: (req.customQuestions as any) || null,
      milestone_ids: req.milestoneIds ? req.milestoneIds.map((mid) => uuidFor('milestone', mid)) : null,
      month: req.month || null,
      due_date: req.dueDate,
      created_by: uuidFor('user', req.createdBy),
      created_on: req.createdOn,
      status: req.status,
    });
    if (error) console.error(`Error upserting data request ${req.title}:`, error.message);
  }

  for (const sub of submissions) {
    const { error } = await supabase.from('founder_submissions').upsert({
      id: uuidFor('submission', sub.id),
      request_id: sub.requestId ? uuidFor('data_request', sub.requestId) : null,
      startup_id: uuidFor('startup', sub.startupId),
      submitted_on: sub.submittedOn,
      payload: sub.payload as any,
      status: sub.status,
      reviewed_by: sub.reviewedBy ? uuidFor('user', sub.reviewedBy) : null,
      reviewed_on: sub.reviewedOn || null,
      review_comment: sub.reviewComment || null,
    });
    if (error) console.error(`Error upserting submission ${sub.id}:`, error.message);
  }
  console.log(`✓ Seeded ${dataRequests.length} requests and ${submissions.length} submissions`);

  // --------------------------------------------------------------------------
  // 8. SEED MENTORS, REQUESTS, MATCHES & SESSIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Seeding Mentors & Matching Network ---');
  for (const mentor of mentors) {
    const { error } = await supabase.from('mentors').upsert({
      id: uuidFor('mentor', mentor.id),
      name: mentor.name,
      title: mentor.title,
      phone: mentor.phone || null,
      linkedin: mentor.linkedin || null,
      sectors: mentor.sectors,
      expertise: mentor.expertise,
      stages: mentor.stages,
      geography: mentor.geography,
      availability: mentor.availability,
      max_active_matches: mentor.maxActiveMatches,
      bio: mentor.bio,
      active: mentor.active,
    });
    if (error) console.error(`Error upserting mentor ${mentor.name}:`, error.message);
  }

  for (const req of mentorRequests) {
    const { error } = await supabase.from('mentor_requests').upsert({
      id: uuidFor('mentor_request', req.id),
      startup_id: uuidFor('startup', req.startupId),
      challenge: req.challenge,
      expertise_needed: req.expertiseNeeded,
      raised_by: req.raisedBy,
      created_on: req.createdOn,
      ranked: (req.ranked as any) || null,
      recommended_mentor_id: req.recommendedMentorId ? uuidFor('mentor', req.recommendedMentorId) : null,
      status: req.status,
      mentor_id: req.mentorId ? uuidFor('mentor', req.mentorId) : null,
      note: req.note || null,
      fitt_task_n: req.fittTaskN || null,
    });
    if (error) console.error(`Error upserting mentor request ${req.id}:`, error.message);
  }

  for (const mm of mentorMatches) {
    const matchUuid = uuidFor('mentor_match', mm.id);
    const { error: mmError } = await supabase.from('mentor_matches').upsert({
      id: matchUuid,
      request_id: mm.requestId && mentorRequests.some((r) => r.id === mm.requestId) ? uuidFor('mentor_request', mm.requestId) : null,
      startup_id: uuidFor('startup', mm.startupId),
      mentor_id: uuidFor('mentor', mm.mentorId),
      confirmed_by: uuidFor('user', mm.confirmedBy),
      confirmed_on: mm.confirmedOn,
      status: mm.status,
    });
    if (mmError) console.error(`Error upserting mentor match ${mm.id}:`, mmError.message);

    if (mm.sessions && mm.sessions.length > 0) {
      for (const ses of mm.sessions) {
        const { error: sError } = await supabase.from('mentor_sessions').upsert({
          id: uuidFor('mentor_session', `${mm.id}-${ses.id}`),
          match_id: matchUuid,
          date: ses.date,
          topic: ses.topic,
          next_step: ses.nextStep,
          rating: ses.rating || null,
        });
        if (sError) console.error(`Error upserting session for match ${mm.id}:`, sError.message);
      }
    }
  }
  console.log(`✓ Seeded ${mentors.length} mentors and matches`);

  // --------------------------------------------------------------------------
  // 9. SEED NOTIFICATIONS & RECIPIENTS
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Seeding Notifications & Recipients ---');
  for (const n of notifications) {
    const notifUuid = uuidFor('notification', n.id);
    const targetUserUuid = n.targetUserId ? uuidFor('user', n.targetUserId) : null;
    const startupUuid = n.startupId ? uuidFor('startup', n.startupId) : null;

    const { error: nError } = await supabase.from('notifications').upsert({
      id: notifUuid,
      title: n.title,
      message: n.message,
      type: n.type,
      startup_id: startupUuid,
      startup_name: n.startupName || null,
      target_role: n.targetRole || null,
      target_user_id: targetUserUuid,
      action_url: n.actionUrl || null,
      created_at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    });
    if (nError) console.error(`Error upserting notification ${n.id}:`, nError.message);

    // Create recipients
    const recipientUids: string[] = [];
    if (targetUserUuid) {
      recipientUids.push(targetUserUuid);
    } else if (n.targetRole) {
      users.filter((u) => u.role === n.targetRole).forEach((u) => recipientUids.push(uuidFor('user', u.id)));
    } else {
      users.forEach((u) => recipientUids.push(uuidFor('user', u.id)));
    }

    for (const rUid of recipientUids) {
      const { error: rError } = await supabase.from('notification_recipients').upsert({
        id: uuidFor('notif_recip', `${n.id}-${rUid}`),
        notification_id: notifUuid,
        recipient_id: rUid,
        read_at: n.read ? new Date(n.createdAt).toISOString() : null,
      });
      if (rError) console.error(`Error upserting notification recipient:`, rError.message);
    }
  }
  console.log(`✓ Seeded ${notifications.length} notifications with recipients`);

  // --------------------------------------------------------------------------
  // 10. SEED REGULATORY ITEMS
  // --------------------------------------------------------------------------
  console.log('\n--- 10. Seeding Regulatory Items ---');
  for (const r of regulatory) {
    const { error } = await supabase.from('regulatory_items').upsert({
      id: uuidFor('regulatory', r.id),
      title: r.title,
      authority: r.authority,
      kind: r.kind,
      status: r.status,
      published_on: r.publishedOn,
      consultation_closes_on: r.consultationClosesOn || null,
      effective_on: r.effectiveOn || null,
      summary: r.summary,
      sectors: r.sectors,
      direct_tags: r.directTags,
      indirect_tags: r.indirectTags,
      what_to_check: r.whatToCheck,
      is_sample: true,
    });
    if (error) console.error(`Error upserting regulatory item ${r.title}:`, error.message);
  }
  console.log(`✓ Seeded ${regulatory.length} regulatory items`);

  console.log('\n=============================================');
  console.log('✓ Folio OS Supabase Seed Completed Successfully!');
  console.log('=============================================\n');
}

main().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
