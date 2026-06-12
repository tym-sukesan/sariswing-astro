/**
 * G-6-e3 — Schedule dry-run safety guards (no DB client; dry-run only).
 */

import type { ScheduleDryRunResult, ScheduleDryRunSafety } from "./schedule-dry-run-types";

export function getScheduleDryRunSafety(): ScheduleDryRunSafety {
  return {
    dbClientReceived: false,
    supabaseWriteCalled: false,
    scheduleMonthsTouched: false,
    deleteEnabled: false,
    nonDryRunEnabled: false,
  };
}

export function assertDryRunOnlyResult(
  result: ScheduleDryRunResult,
): asserts result is ScheduleDryRunResult & { actualWrite: false; dryRun: true } {
  if (result.actualWrite !== false || result.dryRun !== true) {
    throw new Error("Schedule dry-run adapter must return actualWrite:false and dryRun:true");
  }
}
