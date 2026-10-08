import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== CHECKING PROFILES TABLE ===');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  console.log(`Total profiles found: ${profiles.length}`);
  for (const p of profiles) {
    console.log(`- ${p.email} | Role: ${p.role} | Label: ${p.label} | ID: ${p.id} | Manager: ${p.manager_id}`);
  }

  console.log('\n=== CHECKING AUTH USERS ===');
  const { data: authUsers, error: aError } = await supabase.auth.admin.listUsers();
  if (aError) {
    console.error('Error fetching auth users:', aError);
    return;
  }
  console.log(`Total auth users found: ${authUsers.users.length}`);
  for (const u of authUsers.users) {
    console.log(`- ${u.email} | ID: ${u.id}`);
  }
}

main().catch(console.error);
