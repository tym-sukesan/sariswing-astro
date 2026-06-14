/**
 * G-6-f10 — Optimistic lock helpers for dry-run UI (SELECT-only stale check).
 */

import { getScheduleOptimisticLockConfig } from "./schedule-optimistic-lock-config";
import { checkScheduleRowStale } from "./schedule-optimistic-lock-stale-check";
import type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
import type { ScheduleRecord } from "./schedule-dry-run-types";

export function createEditSessionBaseline(record: ScheduleRecord): {
  scheduleId: string;
  baselineUpdatedAt: string | null;
  loadedAt: string;
} {
  return {
    scheduleId: record.id,
    baselineUpdatedAt: record.updated_at ?? null,
    loadedAt: new Date().toISOString(),
  };
}

export function buildSkippedStaleCheckState(
  baselineUpdatedAt: string | null,
): ScheduleOptimisticLockDryRunState {
  const lockConfig = getScheduleOptimisticLockConfig();
  return {
    baselineUpdatedAt,
    staleCheckPerformed: false,
    staleDetected: false,
    optimisticLockEnabled: lockConfig.enabled,
  };
}

export async function runDryRunStaleCheck(options: {
  url: string;
  anonKey: string;
  scheduleId: string;
  baselineUpdatedAt: string | null;
  liveSupabaseRead: boolean;
}): Promise<ScheduleOptimisticLockDryRunState> {
  const lockConfig = getScheduleOptimisticLockConfig();

  if (!lockConfig.dryRunStaleCheckEnabled || !options.liveSupabaseRead) {
    return buildSkippedStaleCheckState(options.baselineUpdatedAt);
  }

  const check = await checkScheduleRowStale({
    url: options.url,
    anonKey: options.anonKey,
    scheduleId: options.scheduleId,
    baselineUpdatedAt: options.baselineUpdatedAt,
  });

  return {
    baselineUpdatedAt: check.baselineUpdatedAt,
    staleCheckPerformed: check.staleCheckPerformed,
    staleDetected: check.staleDetected,
    currentUpdatedAt: check.currentUpdatedAt,
    message: check.message,
    optimisticLockEnabled: lockConfig.enabled,
  };
}

export function renderOptimisticLockDryRunHtml(
  state: ScheduleOptimisticLockDryRunState | undefined,
  escapeHtml: (value: string) => string,
): string {
  if (!state) return "";

  const staleClass = state.staleDetected
    ? "schedule-optimistic-lock-dry-run__stale"
    : "schedule-optimistic-lock-dry-run__fresh";

  const messageBlock = state.message
    ? `<p class="${staleClass}" role="alert"><strong>${escapeHtml(state.message)}</strong></p>`
    : "";

  return [
    messageBlock,
    `<dl class="schedule-optimistic-lock-dry-run__meta">`,
    `<div><dt>optimisticLockEnabled</dt><dd>${state.optimisticLockEnabled ? "true" : "false"}</dd></div>`,
    `<div><dt>baselineUpdatedAt</dt><dd>${escapeHtml(state.baselineUpdatedAt ?? "—")}</dd></div>`,
    `<div><dt>staleCheckPerformed</dt><dd>${state.staleCheckPerformed ? "true" : "false"}</dd></div>`,
    `<div><dt>staleDetected</dt><dd>${state.staleDetected ? "true" : "false"}</dd></div>`,
    state.currentUpdatedAt != null
      ? `<div><dt>currentUpdatedAt</dt><dd>${escapeHtml(state.currentUpdatedAt)}</dd></div>`
      : "",
    `</dl>`,
  ].join("");
}
