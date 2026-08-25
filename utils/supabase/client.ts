import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const getSupabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder.supabase.co';

const getSupabaseAnonKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

/**
 * Supabase client for browser-side usage (realtime subscriptions, public reads)
 */
export const createBrowserClient = () => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return createClient<Database>(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// Default singleton client instance for client components
export const supabase = createBrowserClient();
