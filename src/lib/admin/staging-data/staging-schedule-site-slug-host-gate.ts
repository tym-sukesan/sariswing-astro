/**
 * G-9g3a — Supabase host hard gate for Gosaki site_slug schedule edit (staging shell).
 */

import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  extractSupabaseHost,
} from "../staging-write/schedule-non-dry-run-poc-config";

/** Sariswing production Supabase host — block writes when active. */
export const SARISWING_PRODUCTION_SUPABASE_HOST = "vsbvndwuajjhnzpohghh.supabase.co";

export type SupabaseHostGateResult = {
  activeHost: string;
  expectedHost: string;
  hostGatePassed: boolean;
  isKnownProductionHost: boolean;
  warningMessage: string | null;
};

export function evaluateSupabaseHostGate(
  supabaseUrl: string | null | undefined,
): SupabaseHostGateResult {
  const expectedHost = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;
  const activeHost = extractSupabaseHost(String(supabaseUrl ?? "").trim());
  const hostGatePassed =
    activeHost !== "—" && activeHost === expectedHost;
  const isKnownProductionHost =
    activeHost === SARISWING_PRODUCTION_SUPABASE_HOST;

  let warningMessage: string | null = null;
  if (!hostGatePassed) {
    if (isKnownProductionHost) {
      warningMessage =
        `DANGER: active host is Sariswing production (${activeHost}). ` +
        `Expected staging host ${expectedHost}. Save and live stale checks are blocked.`;
    } else if (activeHost === "—") {
      warningMessage =
        "Supabase URL missing or invalid — host gate failed. Save is blocked.";
    } else {
      warningMessage =
        `Active host ${activeHost} does not match expected staging host ${expectedHost}. ` +
        "Save and live stale checks are blocked.";
    }
  }

  return {
    activeHost,
    expectedHost,
    hostGatePassed,
    isKnownProductionHost,
    warningMessage,
  };
}
