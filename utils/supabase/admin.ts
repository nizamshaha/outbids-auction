import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const getSupabaseUrl = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder.supabase.co';

const getSupabaseServiceRoleKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  'placeholder-service-role-key';

/**
 * Creates an Admin Supabase client with full service role permissions.
 * ALWAYS use in server-only routes / webhook endpoints. Never expose to client!
 */
export const createAdminClient = () => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Default singleton instance
export const supabaseAdmin = createAdminClient();
