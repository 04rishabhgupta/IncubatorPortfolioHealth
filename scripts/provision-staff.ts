/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface StaffEntry {
  email: string;
  label: string;
  role: 'ADMIN' | 'INVESTMENT_MANAGER' | 'INVESTMENT_ASSOCIATE';
  managerEmail?: string;
  password?: string;
}

async function main() {
  const args = process.argv.slice(2);
  const helpRequested = args.includes('--help') || args.includes('-h');

  if (helpRequested) {
    console.log(`
Folio OS - Production Staff Provisioning CLI (Phase 6)
======================================================
Usage:
  npx tsx scripts/provision-staff.ts [options]

Options:
  --admin-email <email>       Email for the primary administrator account
  --admin-name <name>         Display name for the primary administrator
  --admin-password <password> Temporary or initial password for the admin
  --invite-only               Send email invite instead of setting a direct password
  --staff-file <path>         Path to a JSON file containing an array of staff accounts:
                              [
                                {
                                  "email": "lead@fitt-iitd.in",
                                  "label": "Dr. Lead",
                                  "role": "ADMIN"
                                },
                                {
                                  "email": "head@fitt-iitd.in",
                                  "label": "Prof. Head",
                                  "role": "INVESTMENT_MANAGER"
                                },
                                {
                                  "email": "manager@fitt-iitd.in",
                                  "label": "Mr. Associate",
                                  "role": "INVESTMENT_ASSOCIATE",
                                  "managerEmail": "head@fitt-iitd.in"
                                }
                              ]

Environment:
  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local or process environment.
`);
    process.exit(0);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined.');
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('Folio OS: Production Staff Provisioning (Phase 6)');
  console.log('='.repeat(70));
  console.log(`Connecting to: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Parse command line arguments
  const getArg = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const adminEmail = getArg('--admin-email');
  const adminName = getArg('--admin-name') || 'Incubator Administrator';
  const adminPassword = getArg('--admin-password');
  const staffFile = getArg('--staff-file');
  const inviteOnly = args.includes('--invite-only');

  const staffList: StaffEntry[] = [];

  if (staffFile) {
    const fullPath = path.resolve(process.cwd(), staffFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Staff file not found: ${fullPath}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error('❌ Staff file must contain a JSON array of staff objects.');
      process.exit(1);
    }
    staffList.push(...parsed);
  } else if (adminEmail) {
    staffList.push({
      email: adminEmail,
      label: adminName,
      role: 'ADMIN',
      password: adminPassword || undefined,
    });
  } else {
    console.log(`
ℹ️  No staff file or --admin-email specified.
    Provisioning default IIT Delhi FITT Production Admin:
    Email: admin@fitt-iitd.in
    Name:  FITT Incubator Administrator
    Role:  ADMIN
    (To specify a custom admin, re-run with: --admin-email <email> --admin-name <name>)
`);
    staffList.push({
      email: 'admin@fitt-iitd.in',
      label: 'FITT Incubator Administrator',
      role: 'ADMIN',
      password: adminPassword || 'FittAdminSecure2026!',
    });
  }

  console.log(`\nFound ${staffList.length} staff member(s) to provision.\n`);

  // Map to hold email -> created uuid
  const emailToIdMap = new Map<string, string>();

  // Fetch existing auth users to avoid duplicates
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list auth users:', listError.message);
    process.exit(1);
  }

  authUsers.users.forEach((u) => {
    if (u.email) emailToIdMap.set(u.email.toLowerCase(), u.id);
  });

  // Step 1: Provision Admins and Investment Managers first (to establish reporting tree)
  const sortedStaff = [...staffList].sort((a, b) => {
    if (a.role === 'ADMIN') return -1;
    if (b.role === 'ADMIN') return 1;
    if (a.role === 'INVESTMENT_MANAGER') return -1;
    if (b.role === 'INVESTMENT_MANAGER') return 1;
    return 0;
  });

  for (const staff of sortedStaff) {
    const normalizedEmail = staff.email.trim().toLowerCase();
    let userId = emailToIdMap.get(normalizedEmail);

    if (!userId) {
      if (inviteOnly || !staff.password) {
        console.log(`📧 Sending Supabase Auth invite to: ${normalizedEmail} (${staff.role})...`);
        const { data: inviteRes, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
          normalizedEmail,
          {
            data: { label: staff.label, role: staff.role },
          }
        );
        if (inviteErr || !inviteRes.user) {
          console.error(`   ❌ Failed to invite ${normalizedEmail}: ${inviteErr?.message}`);
          continue;
        }
        userId = inviteRes.user.id;
      } else {
        console.log(`👤 Creating confirmed user: ${normalizedEmail} (${staff.role})...`);
        const { data: createRes, error: createErr } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: staff.password,
          email_confirm: true,
          user_metadata: { label: staff.label, role: staff.role },
        });
        if (createErr || !createRes.user) {
          console.error(`   ❌ Failed to create ${normalizedEmail}: ${createErr?.message}`);
          continue;
        }
        userId = createRes.user.id;
      }
      emailToIdMap.set(normalizedEmail, userId);
    } else {
      console.log(`ℹ️  User ${normalizedEmail} already exists in auth.users (ID: ${userId})`);
    }

    // Resolve manager_id if associate
    let managerId: string | null = null;
    if (staff.role === 'INVESTMENT_ASSOCIATE') {
      if (staff.managerEmail) {
        managerId = emailToIdMap.get(staff.managerEmail.toLowerCase()) || null;
      }
      if (!managerId) {
        // Find any existing INVESTMENT_MANAGER
        const { data: managers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'INVESTMENT_MANAGER')
          .limit(1);
        managerId = managers && managers.length > 0 ? managers[0].id : null;
      }
    }

    // Upsert into profiles
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email: normalizedEmail,
        role: staff.role,
        label: staff.label,
        manager_id: managerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileErr) {
      console.error(`   ❌ Failed to update profile for ${normalizedEmail}: ${profileErr.message}`);
    } else {
      console.log(`   ✅ Profile synced: ${staff.label} | Role: ${staff.role} | ID: ${userId}`);
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    actor: 'System / Provisioning CLI',
    text: `Production staff provisioned (${sortedStaff.length} accounts configured).`,
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ Production staff provisioning complete!');
  console.log('='.repeat(70));
  console.log('Next Steps:');
  console.log('1. Have staff sign in at /login with their institutional email.');
  console.log('2. Administrators can manage and invite additional team members at /admin/users.');
  console.log('3. Ensure NEXT_PUBLIC_DEMO_MODE=false in production deployments.');
  console.log('='.repeat(70) + '\n');
}

main().catch((e) => {
  console.error('Fatal error in provisioning script:', e);
  process.exit(1);
});
