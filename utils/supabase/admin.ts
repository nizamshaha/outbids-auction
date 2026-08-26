import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://fmuxahgignhhmnprxxey.supabase.co';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

/**
 * Creates an Admin Supabase client with full service role permissions.
 * ALWAYS use in server-only routes / webhook endpoints. Never expose to client!
 */
export const createAdminClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Default singleton instance
export const supabaseAdmin = createAdminClient();
