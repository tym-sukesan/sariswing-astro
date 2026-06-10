/**
 * G-6-d-auth-session-display-investigation — Auth / write gate debug panel (staging shell only).
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

  setText("debug-auth-provider", authConfig.provider);
  setText(
    "debug-auth-mode",
    authConfig.authMode === "supabase-staging"
      ? "supabase"
      : authConfig.authMode,
  );
  setText(
    "debug-auth-enabled",
    authConfig.stagingAuthEnabled && authConfig.supabaseConfigured
      ? "true"
      : "false",
  );

  let authStatus = "mock-preview";
  let userEmail = "—";
  let userId = "—";
  let adminRole = "—";
  let roleSource = "mock-allowlist (admin_users not queried)";

  if (authConfig.stagingAuthEnabled && authConfig.supabaseConfigured) {
    try {
      const details = await getStagingAuthSessionDetails(
        authConfig.supabaseUrl,
        authConfig.supabaseAnonKey,
      );
      authStatus = details.session.status;
      userEmail = details.rawEmail ?? details.session.email ?? "—";
      userId = shortenUserId(details.userId);
      const resolution = resolveMockAdminRole(details.rawEmail);
      adminRole =
        resolution.displayRole === "denied"
          ? "denied (not in mock allowlist)"
          : (resolution.displayRole ?? "—");
      roleSource = details.roleSource;
      if (
        details.session.status === "signed-in" &&
        resolution.status === "mock-denied"
      ) {
        authBlockers.push(
          "signed-in email is not in mock allowlist — admin_users role not resolved yet",
        );
      }
      if (details.session.status === "signed-out") {
        authBlockers.push("no Supabase Auth session — sign in via staging login form");
      }
    } catch {
      authStatus = "error";
      authBlockers.push("could not read Supabase Auth session");
    }
  } else {
    userEmail = "— (mock preview — not signed in)";
    adminRole = "mock preview only";
    authBlockers.push("real Supabase Auth disabled — showing mock preview state");
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
