/**
 * G-5y-d — Staging-only Supabase Auth client (anon key only).
 * Not used on /admin/. No service role. No DB/Storage.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let stagingClient: SupabaseClient | null = null;

export function getStagingSupabaseClient(
  url: string,
  anonKey: string,
): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase Auth config missing");
  }
  if (!stagingClient) {
    stagingClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return stagingClient;
}

export function resetStagingSupabaseClient(): void {
  stagingClient = null;
}
