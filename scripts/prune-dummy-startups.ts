/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Querying all startups currently in Supabase...');
  const { data: allStartups, error } = await supabase
    .from('startups')
    .select('id, name');

  if (error || !allStartups) {
    console.error('Failed to fetch startups:', error?.message);
    process.exit(1);
  }

  console.log(`Found ${allStartups.length} startup(s) in total.`);

  const indigotex = allStartups.find(
    (s) => s.name.toLowerCase().includes('indigotex')
  );

  if (!indigotex) {
    console.error('❌ Could not locate Indigotex in database! Aborting to prevent accidental data loss.');
    process.exit(1);
  }

  console.log(`\nPreserving real startup: "${indigotex.name}" (ID: ${indigotex.id})`);

  const dummyStartups = allStartups.filter((s) => s.id !== indigotex.id);
  console.log(`Identified ${dummyStartups.length} dummy startup(s) to remove.\n`);

  if (dummyStartups.length > 0) {
    const dummyIds = dummyStartups.map((s) => s.id);
    console.log('Deleting dummy startups from backend database (cascade deletes all related metrics, assessments, submissions, milestones)...');
    const { error: delError } = await supabase
      .from('startups')
      .delete()
      .in('id', dummyIds);

    if (delError) {
      console.error('❌ Failed to delete dummy startups:', delError.message);
      process.exit(1);
    }
    console.log('✅ Successfully removed all dummy startups from Supabase.');
  }

  // Also clean up any unlinked/dangling dummy records in peripheral tables
  console.log('Cleaning up any dangling dummy records in peripheral collections...');
  await supabase
    .from('mentor_requests')
    .delete()
    .neq('startup_id', indigotex.id);

  await supabase
    .from('mentor_matches')
    .delete()
    .neq('startup_id', indigotex.id);

  await supabase
    .from('data_requests')
    .delete()
    .neq('startup_id', indigotex.id);

  await supabase
    .from('notifications')
    .delete()
    .neq('startup_id', indigotex.id);

  await supabase
    .from('activity_logs')
    .delete()
    .neq('startup_id', indigotex.id);

  // Verify remaining state
  const { data: remaining } = await supabase
    .from('startups')
    .select('id, name');
  console.log(`\nRemaining startup(s) in DB:`, remaining);

  const { count: metricsCount } = await supabase
    .from('monthly_metrics')
    .select('*', { count: 'exact', head: true });
  console.log(`Remaining monthly metrics: ${metricsCount} row(s) (belonging to Indigotex)`);

  const { count: assessmentsCount } = await supabase
    .from('health_assessments')
    .select('*', { count: 'exact', head: true });
  console.log(`Remaining health assessments: ${assessmentsCount} row(s) (belonging to Indigotex)`);

  const { count: teamsCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true });
  console.log(`Remaining team members: ${teamsCount} row(s) (belonging to Indigotex)`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
