import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://fmuxahgignhhmnprxxey.supabase.co';

/**
 * Creates an Admin Supabase client with full service role permissions.
 * ALWAYS use in server-only routes / webhook endpoints. Never expose to client!
 */
export const createAdminClient = (): SupabaseClient<Database> => {
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
    throw new Error(
      '[CRITICAL SECURITY ERROR] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is mandatory in production for administrative operations.'
    );
  }

  const keyToUse =
    supabaseServiceRoleKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_placeholder_key_for_build';

  return createClient<Database>(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Lazy singleton getter for server-side admin client
let _supabaseAdmin: SupabaseClient<Database> | null = null;
export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createAdminClient();
  }
  return _supabaseAdmin;
};

export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin().from.bind(getSupabaseAdmin());
  },
  get channel() {
    return getSupabaseAdmin().channel.bind(getSupabaseAdmin());
  },
};
