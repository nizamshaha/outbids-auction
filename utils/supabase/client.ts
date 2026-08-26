import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://fmuxahgignhhmnprxxey.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_jc3QWKQVFpPvkCMpzjeWJg_CzHUEOpR';

/**
 * Supabase client for browser-side usage (realtime subscriptions, public reads)
 */
export const createBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// Default singleton client instance for client components
export const supabase = createBrowserClient();
