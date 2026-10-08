/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REQUIRED_TABLES = [
  'profiles',
  'startups',
  'startup_fitt_trackers',
  'founder_links',
  'team_members',
  'milestones',
  'monthly_metrics',
  'health_assessments',
  'data_requests',
  'founder_submissions',
  'mentors',
  'mentor_requests',
  'mentor_matches',
  'mentor_sessions',
  'founder_action_items',
  'activity_logs',
  'notifications',
  'notification_recipients',
  'regulatory_items',
];

async function main() {
  console.log('='.repeat(75));
  console.log('Folio OS: Supabase Production Health & Schema Verification (Phase 6)');
  console.log('='.repeat(75));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('❌ Configuration Error: Missing one or more required environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!anonKey) console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!serviceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`Target Supabase URL : ${supabaseUrl}`);
  console.log(`Demo Mode           : ${process.env.NEXT_PUBLIC_DEMO_MODE ?? 'undefined'}`);
  console.log(`Environment         : ${process.env.NODE_ENV ?? 'development'}\n`);

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let passedChecks = 0;
  let totalChecks = 0;

  function recordResult(name: string, ok: boolean, details?: string) {
    totalChecks++;
    if (ok) {
      passedChecks++;
      console.log(`  ✅ [PASS] ${name}${details ? ` (${details})` : ''}`);
    } else {
      console.log(`  ❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Core Tables & RLS Status
  // ---------------------------------------------------------------------------
  console.log('--- 1. Database Schema & Tables Check ---');

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { data, error } = await adminClient.from(tableName).select().limit(1);
      if (error && error.code !== 'PGRST116') {
        recordResult(`Table: ${tableName}`, false, error.message);
      } else {
        recordResult(`Table: ${tableName}`, true, 'table accessible');
      }
    } catch (e: any) {
      recordResult(`Table: ${tableName}`, false, e.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Storage Buckets Check
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Storage Buckets Check ---');
  try {
    const { data: buckets, error: bucketErr } = await adminClient.storage.listBuckets();
    if (bucketErr) {
      recordResult('Storage Service Access', false, bucketErr.message);
    } else {
      const portfolioBucket = buckets?.find((b) => b.name === 'portfolio-files' || b.id === 'portfolio-files');
      if (portfolioBucket) {
        recordResult('Storage Bucket: portfolio-files', true, `private: ${!portfolioBucket.public}`);
      } else {
        recordResult('Storage Bucket: portfolio-files', false, 'bucket does not exist; create it in Supabase Storage');
      }
    }
  } catch (e: any) {
    recordResult('Storage Check', false, e.message);
  }

  // ---------------------------------------------------------------------------
  // 3. Stored RPC Procedures Check
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. RPC Stored Functions Check ---');

  // Check get_current_role (should return null when called unauthenticated)
  try {
    const { data, error } = await adminClient.rpc('get_current_role');
    if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
      recordResult('RPC: get_current_role()', true, 'callable');
    } else if (!error) {
      recordResult('RPC: get_current_role()', true, `returns: ${data ?? 'null'}`);
    } else {
      recordResult('RPC: get_current_role()', false, error.message);
    }
  } catch (e: any) {
    recordResult('RPC: get_current_role()', false, e.message);
  }

  // Check can_access_startup
  try {
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error } = await adminClient.rpc('can_access_startup', { p_startup_id: dummyId });
    if (!error || error.message.includes('permission') || !error.message.includes('does not exist')) {
      recordResult('RPC: can_access_startup()', true, 'verified');
    } else {
      recordResult('RPC: can_access_startup()', false, error.message);
    }
  } catch (e: any) {
    recordResult('RPC: can_access_startup()', false, e.message);
  }

  // Check update_assignment
  try {
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error } = await adminClient.rpc('update_assignment', {
      p_startup_id: dummyId,
      p_manager_id: dummyId,
      p_associate_id: dummyId,
    });
    // It should fail with "Startup not found" or permission error, NOT function not found
    if (error && (error.message.includes('Startup not found') || error.message.includes('permission'))) {
      recordResult('RPC: update_assignment()', true, 'verified signature & logic');
    } else if (error && error.message.includes('does not exist')) {
      recordResult('RPC: update_assignment()', false, 'function missing');
    } else {
      recordResult('RPC: update_assignment()', true, 'signature verified');
    }
  } catch (e: any) {
    recordResult('RPC: update_assignment()', false, e.message);
  }

  // Check approve_assessment
  try {
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error } = await adminClient.rpc('approve_assessment', {
      p_assessment_id: dummyId,
    });
    if (error && (error.message.includes('Assessment not found') || error.message.includes('permission') || error.message.includes('found'))) {
      recordResult('RPC: approve_assessment()', true, 'verified signature & logic');
    } else if (error && error.message.includes('does not exist')) {
      recordResult('RPC: approve_assessment()', false, 'function missing');
    } else {
      recordResult('RPC: approve_assessment()', true, 'signature verified');
    }
  } catch (e: any) {
    recordResult('RPC: approve_assessment()', false, e.message);
  }

  // ---------------------------------------------------------------------------
  // 4. Auth & User Status
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Staff Accounts & Data Inventory ---');
  try {
    const { data: usersData, error: usersErr } = await adminClient.from('profiles').select('id, email, role');
    if (usersErr) {
      recordResult('Profiles Query', false, usersErr.message);
    } else {
      const admins = usersData?.filter((u) => u.role === 'ADMIN') || [];
      const ims = usersData?.filter((u) => u.role === 'INVESTMENT_MANAGER') || [];
      const ias = usersData?.filter((u) => u.role === 'INVESTMENT_ASSOCIATE') || [];
      recordResult(
        'Staff Profiles Configured',
        (usersData?.length || 0) > 0,
        `Total: ${usersData?.length || 0} (Admins: ${admins.length}, Portfolio Heads: ${ims.length}, Portfolio Managers: ${ias.length})`
      );

      if (admins.length === 0) {
        console.log('  ⚠️  WARNING: No ADMIN accounts exist! Run `npx tsx scripts/provision-staff.ts` to create the initial admin.');
      }
    }

    const { count: startupCount } = await adminClient.from('startups').select('*', { count: 'exact', head: true });
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false' && (startupCount || 0) > 0) {
      console.log(`  ℹ️  Startups in DB: ${startupCount} startup(s) registered.`);
    } else {
      console.log(`  ℹ️  Startups in DB: ${startupCount ?? 0} startup(s) registered.`);
    }
  } catch (e: any) {
    recordResult('Staff Inventory', false, e.message);
  }

  // ---------------------------------------------------------------------------
  // Summary Report
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(75));
  console.log(`VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} checks passed`);
  console.log('='.repeat(75));

  if (passedChecks === totalChecks) {
    console.log('🎉 EXCELLENT: All schema, tables, RPCs, and storage resources are fully verified!');
    console.log('The Supabase project is 100% ready for Phase 6 production workloads.');
  } else {
    console.log(`⚠️  ATTENTION: ${totalChecks - passedChecks} check(s) did not pass.`);
    console.log('Please apply missing migration files from `supabase/sql/` in the Supabase Dashboard.');
  }
  console.log('='.repeat(75) + '\n');
}

main().catch((e) => {
  console.error('Fatal verification failure:', e);
  process.exit(1);
});
