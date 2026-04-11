import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * Lazy-initialized Supabase admin client.
 * Uses service_role key for server-side operations (bypasses RLS).
 * All routes MUST use auth middleware to verify user identity first.
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — cannot initialize Supabase');
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// Legacy export for backward compat — lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
