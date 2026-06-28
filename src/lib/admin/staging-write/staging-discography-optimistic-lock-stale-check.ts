/**
 * G-15a2 — SELECT-only stale check for Discography dry-run (no writes).
 */

import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  evaluateScheduleStaleState,
  type ScheduleStaleEvaluateResult,
} from "./schedule-write-utils";

export async function fetchDiscographyRowUpdatedAt(options: {
  url: string;
  anonKey: string;
  legacyId: string;
}): Promise<{ updatedAt: string | null; error: string | null }> {
  const { url, anonKey, legacyId } = options;
  if (!url || !anonKey || !legacyId) {
    return { updatedAt: null, error: "Supabase config or legacy_id missing." };
  }

  try {
    const client = getStagingSupabaseClient(url, anonKey);
    const { data, error } = await client
      .from("discography")
      .select("updated_at")
      .eq("legacy_id", legacyId)
      .single();

    if (error) {
      return { updatedAt: null, error: error.message };
    }

    const row = data as { updated_at?: string | null } | null;
    const updatedAt = row?.updated_at != null ? String(row.updated_at) : null;
    return { updatedAt, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { updatedAt: null, error: message };
  }
}

export async function checkDiscographyRowStale(options: {
  url: string;
  anonKey: string;
  legacyId: string;
  baselineUpdatedAt: string | null | undefined;
}): Promise<ScheduleStaleEvaluateResult> {
  const { updatedAt, error } = await fetchDiscographyRowUpdatedAt({
    url: options.url,
    anonKey: options.anonKey,
    legacyId: options.legacyId,
  });

  return evaluateScheduleStaleState({
    baselineUpdatedAt: options.baselineUpdatedAt,
    currentUpdatedAt: updatedAt,
    selectError: error,
    staleCheckPerformed: true,
  });
}
