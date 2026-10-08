import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe.runIf(Boolean(supabaseUrl && anonKey))('Supabase Live RLS Verification', () => {
  let adminClient: SupabaseClient;
  let im1Client: SupabaseClient;
  let im2Client: SupabaseClient;
  let ia3Client: SupabaseClient;

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    im1Client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    im2Client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    ia3Client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

    // Authenticate personas
    const { error: errAdmin } = await adminClient.auth.signInWithPassword({
      email: 'admin@fitt.demo',
      password: 'admin123',
    });
    if (errAdmin) throw new Error(`Admin sign in failed: ${errAdmin.message}`);

    const { error: errIm1 } = await im1Client.auth.signInWithPassword({
      email: 'im1@fitt.demo',
      password: 'manager123',
    });
    if (errIm1) throw new Error(`IM1 sign in failed: ${errIm1.message}`);

    const { error: errIm2 } = await im2Client.auth.signInWithPassword({
      email: 'im2@fitt.demo',
      password: 'manager123',
    });
    if (errIm2) throw new Error(`IM2 sign in failed: ${errIm2.message}`);

    const { error: errIa3 } = await ia3Client.auth.signInWithPassword({
      email: 'ia3@fitt.demo',
      password: 'associate123',
    });
    if (errIa3) throw new Error(`IA3 sign in failed: ${errIa3.message}`);
  });

  it('Admin can view Indigotex startup in the database', async () => {
    const { data, error } = await adminClient.from('startups').select('id, name');
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].name).toContain('Indigotex');
  });

  it('Assigned Portfolio Head 1 (im1) can view Indigotex via RLS', async () => {
    const { data: userProfile } = await im1Client.from('profiles').select('id').eq('email', 'im1@fitt.demo').single();
    expect(userProfile).toBeDefined();

    const { data, error } = await im1Client.from('startups').select('id, manager_id');
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].manager_id).toBe(userProfile!.id);
  });

  it('Unassigned Portfolio Head 2 (im2) cannot view unassigned startups via RLS', async () => {
    const { data, error } = await im2Client.from('startups').select('id, manager_id');
    expect(error).toBeNull();
    // Since only Indigotex exists and is assigned to im1, im2 sees 0 startups
    expect(data?.length).toBe(0);
  });

  it('Unassigned Portfolio Manager 3 (ia3) cannot view unassigned startups via RLS', async () => {
    const { data, error } = await ia3Client.from('startups').select('id, associate_id');
    expect(error).toBeNull();
    // Since Indigotex is assigned to ia1, ia3 sees 0 startups
    expect(data?.length).toBe(0);
  });

  it('All authenticated roles can read staff profiles', async () => {
    const { data: profiles, error } = await ia3Client.from('profiles').select('id, email, role');
    expect(error).toBeNull();
    expect(profiles?.length).toBe(10);
  });
});
