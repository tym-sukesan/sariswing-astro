/**
 * G-6-d-staging-env-gate-client-fix — Auth / write gate debug panel (staging shell only).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  collectAuthGateBlockers,
  collectWriteGateBlockers,
  formatGateBlockers,
} from "./staging-auth-gate-diagnostics";
import { getStagingAuthSessionDetails } from "./staging-auth-session";
import { resolveMockAdminRole } from "./staging-role-resolver";
import { getStagingWriteConfig } from "../staging-write/staging-write-config";
import { hasStagingShellServerGateInjection } from "../staging-shell/staging-shell-client-gates";

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function shortenUserId(id: string | undefined): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function mapAuthStatus(
  status: string,
  authEnabled: boolean,
): string {
  if (!authEnabled) {
    return status === "mock" ? "mock-preview" : "disabled";
  }
  if (status === "signed-in") return "authenticated";
  if (status === "signed-out") return "unauthenticated";
  if (status === "denied") return "denied";
  if (status === "config-missing") return "error";
  return status;
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

  let authStatus = mapAuthStatus(authConfig.authMode, authEnabled);
  let userEmail = "—";
  let userId = "—";
  let adminRole = "—";
  let roleSource = "unavailable";

  if (authEnabled) {
    roleSource = "mock-allowlist (admin_users not queried)";
    try {
      const details = await getStagingAuthSessionDetails(
        authConfig.supabaseUrl,
        authConfig.supabaseAnonKey,
      );
      authStatus = mapAuthStatus(details.session.status, true);
      userEmail = details.rawEmail ?? details.session.email ?? "—";
      userId = shortenUserId(details.userId);
      const resolution = resolveMockAdminRole(details.rawEmail);
      adminRole =
        resolution.displayRole === "denied"
          ? "denied (not in mock allowlist)"
          : (resolution.displayRole ?? "—");
      if (
        details.session.status === "signed-in" &&
        resolution.status === "mock-denied"
      ) {
        authBlockers.push(
          "signed-in email is not in mock allowlist — confirm admin_users in Supabase SQL Editor",
        );
      }
      if (details.session.status === "signed-out") {
        authBlockers.push("no Supabase Auth session — sign in via staging login form");
      }
    } catch {
      authStatus = "error";
      authBlockers.push("could not read Supabase Auth session");
    }
  } else if (authConfig.authMode === "mock") {
    authStatus = "mock-preview";
    userEmail = "— (mock preview — not signed in)";
    adminRole = "mock preview only";
    roleSource = "mock-allowlist";
  } else {
    authStatus = authConfig.configMissing ? "error" : "disabled";
    roleSource = "unavailable";
  }

  if (!hasStagingShellServerGateInjection()) {
    authBlockers.push(
      "server gate snapshot missing from page — reload staging shell after server restart",
    );
  }

  setText("debug-auth-status", authStatus);
  setText("debug-user-email", userEmail);
  setText("debug-user-id", userId);
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

  setText(
    "debug-disabled-reasons",
    disabledReasons.length > 0 ? disabledReasons.join(" | ") : "—",
  );
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
