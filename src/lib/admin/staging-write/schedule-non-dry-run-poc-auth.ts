/**
 * G-6-e5 fix — Schedule non-dry-run PoC auth helpers.
 * Signed-in Supabase session required; mock allowlist is informational only.
 */

import type { StagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES } from "./schedule-non-dry-run-poc-error";

export const SCHEDULE_NON_DRY_RUN_POC_MOCK_ROLE_WARNING =
  "Local mock role is not admin; proceeding with Supabase Auth + RLS/admin_users verification.";

export function isSignedInStagingAuth(auth: StagingAuthSessionDetails): boolean {
  return auth.session.status === "signed-in" && Boolean(auth.rawEmail);
}

export function collectScheduleNonDryRunPocAuthWarnings(
  auth: StagingAuthSessionDetails,
): string[] {
  const warnings: string[] = [];
  if (auth.session.role !== "admin") {
    warnings.push(SCHEDULE_NON_DRY_RUN_POC_MOCK_ROLE_WARNING);
    warnings.push(
      `mock role: ${auth.session.role ?? "denied"} (${SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES.MOCK_ROLE_NOT_ADMIN_WARNING}; admin_users not queried in UI).`,
    );
  }
  return warnings;
}

export function formatMockRoleDisplay(
  auth: StagingAuthSessionDetails,
): string {
  return auth.session.role ?? "denied";
}
