import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testLogins() {
  const accounts = [
    { email: 'admin@fitt.demo', pass: 'admin123' },
    { email: 'im1@fitt.demo', pass: 'manager123' },
    { email: 'im2@fitt.demo', pass: 'manager123' },
    { email: 'im3@fitt.demo', pass: 'manager123' },
    { email: 'ia1@fitt.demo', pass: 'associate123' },
    { email: 'ia2@fitt.demo', pass: 'associate123' },
    { email: 'ia3@fitt.demo', pass: 'associate123' },
    { email: 'ia4@fitt.demo', pass: 'associate123' },
    { email: 'ia5@fitt.demo', pass: 'associate123' },
    { email: 'ia6@fitt.demo', pass: 'associate123' },
  ];

  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (error) {
      console.log(`❌ ${acc.email}: FAILED (${error.message})`);
    } else {
      console.log(`✅ ${acc.email}: SUCCESS (UID: ${data.user.id})`);
    }
  }
}

testLogins().catch(console.error);
