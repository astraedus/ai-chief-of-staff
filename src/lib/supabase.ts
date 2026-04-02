import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized clients to avoid build-time crashes when env vars are missing.
// Next.js loads route modules during `next build` to collect page data --
// module-level Supabase instantiation will throw if env vars are absent.

let _anonClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

function getUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

/**
 * Client-safe Supabase instance (anon key, RLS enforced).
 * Returns null when env vars are missing (graceful degradation).
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = getUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  if (!_anonClient) {
    _anonClient = createClient(url, anonKey);
  }
  return _anonClient;
}

/**
 * Server-only Supabase instance (service role key, bypasses RLS).
 * Returns null when env vars are missing (graceful degradation).
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const url = getUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  if (!_serviceClient) {
    _serviceClient = createClient(url, serviceKey);
  }
  return _serviceClient;
}
