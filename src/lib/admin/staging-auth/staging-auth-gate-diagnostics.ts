/**
 * G-6-d-auth-session-display-investigation — Auth / write gate diagnostics (staging shell only).
 */

import type { StagingAuthConfig } from "./staging-auth-config";
import type { StagingWriteConfig } from "../staging-write/staging-write-config";

export function collectAuthGateBlockers(config: StagingAuthConfig): string[] {
  const blockers: string[] = [];

  if (!config.dev) blockers.push("not in DEV mode");
  if (!config.stagingShellEnabled) {
    blockers.push("ENABLE_ADMIN_STAGING_SHELL is not true");
  }
  if (!config.stagingAuthFlag) {
    blockers.push("ENABLE_ADMIN_STAGING_AUTH is not true");
  }
  if (config.provider !== "supabase") {
    blockers.push(
      `PUBLIC_ADMIN_AUTH_PROVIDER is "${config.provider}" (need "supabase")`,
    );
  }
  if (!config.supabaseConfigured) {
    blockers.push(
      "PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY missing (Astro reads repo-root .env / .env.local)",
    );
  }

  return blockers;
}

export function collectWriteGateBlockers(config: StagingWriteConfig): string[] {
  const blockers: string[] = [];

  if (config.disabledReason) {
    blockers.push(config.disabledReason);
  }
  if (!config.canWrite) {
    if (blockers.length === 0) blockers.push("canWrite is false");
  }

  return blockers;
}

export function formatGateBlockers(blockers: string[]): string {
  if (blockers.length === 0) return "—";
  return blockers.join("; ");
}
