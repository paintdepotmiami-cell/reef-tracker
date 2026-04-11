import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _isPlaceholder = false;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      console.warn('Supabase env vars not available — using placeholder');
      _isPlaceholder = true;
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    } else {
      _supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'implicit',
          // Bypass navigator.locks API — causes 5s+ hangs in Chrome Incognito
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lock: (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            return fn();
          },
        } as any,
      });
    }
  }
  return _supabase;
}

export function isSupabasePlaceholder(): boolean {
  return _isPlaceholder;
}

/**
 * Get Authorization headers for API calls to our own server routes.
 * Returns { Authorization: 'Bearer <token>' } or empty object.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}
