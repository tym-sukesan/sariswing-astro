/**
 * G-9g3a — Supabase host hard gate for Gosaki site_slug schedule edit (staging shell).
 * G-9j4.5 — staging project ref allowlist (static-to-astro-cms-staging only).
 */

import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  extractSupabaseHost,
} from "../staging-write/schedule-non-dry-run-poc-config";

/** static-to-astro-cms-staging project ref — only allowlisted ref for G-9j5 writes. */
export const STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";

/** Sariswing production Supabase host — block writes when active. */
export const SARISWING_PRODUCTION_SUPABASE_HOST = "vsbvndwuajjhnzpohghh.supabase.co";

/** Sariswing production (sari-site) project ref — never allow G-9j writes. */
export const SARISWING_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";

/** Blocked Supabase project names (operator docs / safety preflight). */
export const BLOCKED_SUPABASE_PROJECT_NAMES = [
  "sari-site",
  "liberta-site-platform",
] as const;

export type StagingProjectAllowlistResult = {
  projectRef: string;
  expectedProjectRef: string;
  expectedProjectName: string;
  allowlistPassed: boolean;
  isKnownProductionRef: boolean;
  errorMessage: string | null;
};

export function extractSupabaseProjectRef(supabaseUrl: string | null | undefined): string {
  const host = extractSupabaseHost(String(supabaseUrl ?? "").trim());
  if (host === "—" || !host.endsWith(".supabase.co")) return "—";
  return host.replace(/\.supabase\.co$/i, "");
}

export function evaluateStagingProjectAllowlist(
  supabaseUrl: string | null | undefined,
): StagingProjectAllowlistResult {
  const expectedProjectRef = STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF;
  const expectedProjectName = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;
  const projectRef = extractSupabaseProjectRef(supabaseUrl);
  const isKnownProductionRef = projectRef === SARISWING_PRODUCTION_PROJECT_REF;
  const allowlistPassed =
    projectRef !== "—" && projectRef === expectedProjectRef;

  let errorMessage: string | null = null;
  if (!allowlistPassed) {
    if (projectRef === "—") {
      errorMessage =
        "Supabase URL missing or invalid — staging project allowlist check failed.";
    } else if (isKnownProductionRef) {
      errorMessage =
        `DANGER: project ref ${projectRef} is Sariswing production (sari-site). ` +
        `Expected ${expectedProjectName} (${expectedProjectRef}) only.`;
    } else {
      errorMessage =
        `Project ref ${projectRef} is not allowlisted. ` +
        `Expected ${expectedProjectName} (${expectedProjectRef}) only. ` +
        `Blocked project names include ${BLOCKED_SUPABASE_PROJECT_NAMES.join(", ")}.`;
    }
  }

  return {
    projectRef,
    expectedProjectRef,
    expectedProjectName,
    allowlistPassed,
    isKnownProductionRef,
    errorMessage,
  };
}

/** Throws when active Supabase URL is not static-to-astro-cms-staging. */
export function assertStaticToAstroCmsStagingSupabaseProject(
  supabaseUrl: string | null | undefined,
): void {
  const result = evaluateStagingProjectAllowlist(supabaseUrl);
  if (!result.allowlistPassed) {
    throw new Error(result.errorMessage ?? "Staging project allowlist check failed.");
  }
}

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
