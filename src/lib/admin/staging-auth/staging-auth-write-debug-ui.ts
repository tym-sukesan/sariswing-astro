/**
 * G-6-d-hardening — Auth / write gate debug panel (staging shell only).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import { resolveStagingAuthDisplayStatus } from "./staging-auth-display-status";
import {
  collectAuthGateBlockers,
  collectWriteGateBlockers,
  formatGateBlockers,
} from "./staging-auth-gate-diagnostics";
import { resolveMockAdminRole } from "./staging-role-resolver";
import { getStagingWriteConfig } from "../staging-write/staging-write-config";
import { hasStagingShellServerGateInjection } from "../staging-shell/staging-shell-client-gates";
import { clearStagingAuthHashFromUrl } from "./staging-password-reset-callback";

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function shortenUserId(id: string | undefined): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export async function refreshAuthWriteDebugPanel(): Promise<void> {
  const root = document.getElementById("staging-auth-write-debug-panel");
  if (!root) return;

  const authConfig = getStagingAuthConfig();
  const writeConfig = getStagingWriteConfig();
  const authBlockers = collectAuthGateBlockers(authConfig);
  const writeBlockers = collectWriteGateBlockers(writeConfig);
  const authEnabled =
    authConfig.stagingAuthEnabled && authConfig.supabaseConfigured;

  setText(
    "debug-server-gates-injected",
    hasStagingShellServerGateInjection() ? "true" : "false",
  );
  setText("debug-auth-provider", authConfig.provider);
  setText("debug-auth-mode", authEnabled ? "enabled" : "disabled");
  setText("debug-auth-enabled", authEnabled ? "true" : "false");

  let adminRole = "—";
  let roleSource = "unavailable";
  let userEmail = "—";
  let userId = "—";

  const display = await resolveStagingAuthDisplayStatus();

  if (display.status === "authenticated" && display.recoveryHashPresent) {
    clearStagingAuthHashFromUrl();
  }

  setText("debug-auth-status", display.status);
  setText("debug-auth-detail", display.detail);
  setText(
    "debug-recovery-hash-present",
    display.recoveryHashPresent ? "true" : "false",
  );
  setText("debug-recovery-error-code", display.recoveryErrorCode ?? "—");
  setText("debug-session-present", display.sessionPresent ? "true" : "false");
  setText("debug-user-email", display.userEmail ?? "—");
  setText("debug-user-id", shortenUserId(display.userId));

  if (authEnabled) {
    roleSource = "mock-allowlist (admin_users not queried)";
    const resolution = resolveMockAdminRole(display.userEmail);
    adminRole =
      resolution.displayRole === "denied"
        ? "denied (not in mock allowlist — confirm admin_users in Supabase)"
        : (resolution.displayRole ?? "—");
    if (
      display.status === "authenticated" &&
      resolution.status === "mock-denied"
    ) {
      authBlockers.push(
        "UI role is mock-only (not in example.com allowlist) — DB write authorization uses public.admin_users RLS",
      );
    }
    if (display.status === "unauthenticated") {
      authBlockers.push("no Supabase Auth session — sign in via staging login form");
    }
    if (display.status === "recovery-error") {
      authBlockers.push("recovery link error — request a new recovery email from Supabase Dashboard");
    }
  } else if (authConfig.authMode === "mock") {
    userEmail = "— (mock preview — not signed in)";
    adminRole = "mock preview only";
    roleSource = "mock-allowlist";
    setText("debug-user-email", userEmail);
  } else {
    roleSource = "unavailable";
  }

  if (!hasStagingShellServerGateInjection()) {
    authBlockers.push(
      "server gate snapshot missing from page — reload staging shell after server restart",
    );
  }

  setText("debug-admin-role", adminRole);
  setText("debug-role-source", roleSource);
  setText("debug-dry-run", writeConfig.dryRun ? "true" : "false");
  setText("debug-approval-id", writeConfig.approvalId);
  setText("debug-write-enabled", writeConfig.canWrite ? "true" : "false");
  setText("debug-save-enabled", writeConfig.canWrite ? "true" : "false");

  const disabledReasons: string[] = [];
  if (authBlockers.length > 0) {
    disabledReasons.push(`Auth: ${formatGateBlockers(authBlockers)}`);
  }
  if (!writeConfig.canWrite && writeBlockers.length > 0) {
    disabledReasons.push(`Write: ${formatGateBlockers(writeBlockers)}`);
  }
  if (writeConfig.canWrite && writeConfig.dryRun) {
    disabledReasons.push(
      "Write gate open in dry-run mode (Save simulates payload; no DB update)",
    );
  }
  if (writeConfig.canWrite && !writeConfig.dryRun) {
    disabledReasons.push(
      "NON-DRY-RUN: Save will update staging DB — after test, restart with PUBLIC_ADMIN_WRITE_DRY_RUN=true",
    );
  }

  setText(
    "debug-disabled-reasons",
    disabledReasons.length > 0 ? disabledReasons.join(" | ") : "—",
  );

  const hardeningNote = document.getElementById("debug-hardening-note");
  if (hardeningNote) {
    hardeningNote.hidden = false;
    if (!writeConfig.dryRun && writeConfig.canWrite) {
      hardeningNote.textContent =
        "NON-DRY-RUN active. After any non-dry-run test, restart dev server with PUBLIC_ADMIN_WRITE_DRY_RUN=true.";
    } else {
      hardeningNote.textContent =
        "G-6-d first non-dry-run: SUCCESS (recorded). Keep PUBLIC_ADMIN_WRITE_DRY_RUN=true for day-to-day staging.";
    }
  }
}

export function initAuthWriteDebugPanel(): void {
  const root = document.getElementById("staging-auth-write-debug-panel");
  if (!root) return;
  void refreshAuthWriteDebugPanel();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initAuthWriteDebugPanel();
  });
}
