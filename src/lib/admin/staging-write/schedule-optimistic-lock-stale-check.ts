/**
 * G-6-f10 — SELECT-only stale check for dry-run / edit UI (no writes).
 */

import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import type { ScheduleOptimisticLockStaleCheckResult } from "./schedule-optimistic-lock-types";
import { evaluateScheduleStaleState } from "./schedule-write-utils";

export async function fetchScheduleRowUpdatedAt(options: {
  url: string;
  anonKey: string;
  scheduleId: string;
}): Promise<{ updatedAt: string | null; error: string | null }> {
  const { url, anonKey, scheduleId } = options;
  if (!url || !anonKey || !scheduleId) {
    return { updatedAt: null, error: "Supabase config or schedule id missing." };
  }

  try {
    const client = getStagingSupabaseClient(url, anonKey);
    const { data, error } = await client
      .from("schedules")
      .select("updated_at")
      .eq("id", scheduleId)
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

export async function checkScheduleRowStale(options: {
  url: string;
  anonKey: string;
  scheduleId: string;
  baselineUpdatedAt: string | null | undefined;
}): Promise<ScheduleOptimisticLockStaleCheckResult> {
  const { updatedAt, error } = await fetchScheduleRowUpdatedAt({
    url: options.url,
    anonKey: options.anonKey,
    scheduleId: options.scheduleId,
  });

  return evaluateScheduleStaleState({
    baselineUpdatedAt: options.baselineUpdatedAt,
    currentUpdatedAt: updatedAt,
    selectError: error,
    staleCheckPerformed: true,
  });
}
