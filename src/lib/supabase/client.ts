import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://pgznqlqfywnqtohvpeti.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnem5xbHFmeXducXRvaHZwZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTI3ODgsImV4cCI6MjEwNjkyODc4OH0.zc5hXpsu9DQ0K7m5L1FxLHPRQN4lHdA5kC6jS-9xQP0';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
