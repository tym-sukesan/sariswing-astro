/**
 * G-5y-d — Browser UI for staging shell Supabase Auth (not /admin/).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  getStagingAuthSessionDetails,
  signInStagingAuth,
  signOutStagingAuth,
} from "./staging-auth-session";
import { resolveStagingAuthDisplayStatus } from "./staging-auth-display-status";
import { collectAuthGateBlockers, formatGateBlockers } from "./staging-auth-gate-diagnostics";
import { resolveMockAdminRole } from "./staging-role-resolver";
import { refreshRoleAllowlistPanel } from "./staging-role-allowlist-ui";
import { refreshAuthWriteDebugPanel } from "./staging-auth-write-debug-ui";
import { clearStagingAuthHashFromUrl } from "./staging-password-reset-callback";

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setError(message: string): void {
  const el = document.getElementById("staging-auth-error");
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function setSignOutButtonsVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-staging-sign-out]").forEach((btn) => {
    btn.hidden = !visible;
  });
}

export async function refreshAuthStatusPanel(): Promise<void> {
  const config = getStagingAuthConfig();
  setText("staging-auth-mode", config.authMode);
  setText(
    "staging-auth-enabled",
    config.stagingAuthEnabled && config.supabaseConfigured ? "true" : "false",
  );
  setText("staging-auth-provider", config.provider);
  setText(
    "staging-auth-connected",
    config.stagingAuthEnabled && config.supabaseConfigured ? "true" : "false",
  );
  setText("staging-auth-production-ready", "false");

  if (config.configMissing) {
    setText("staging-auth-session-status", "config-missing");
    setText("staging-auth-user-email", "—");
    setText("staging-auth-user-id", "—");
    setText("staging-auth-role", "—");
    setError(
      "Supabase Auth の設定が不足しています。PUBLIC_SUPABASE_URL と PUBLIC_SUPABASE_ANON_KEY をローカルに設定してください。",
    );
    setSignOutButtonsVisible(false);
    await refreshAuthWriteDebugPanel();
    return;
  }

  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    const blockers = collectAuthGateBlockers(config);
    setText("staging-auth-session-status", "mock-preview");
    setText(
      "staging-auth-user-email",
      "— (mock preview — not signed in)",
    );
    setText("staging-auth-role", "mock preview only");
    setText(
      "staging-auth-user-id",
      "—",
    );
    setError(
      blockers.length > 0
        ? `実ログインは無効です: ${formatGateBlockers(blockers)}`
        : "",
    );
    setSignOutButtonsVisible(false);
    await refreshRoleAllowlistPanel();
    await refreshAuthWriteDebugPanel();
    return;
  }

  try {
    const display = await resolveStagingAuthDisplayStatus();
    const details = await getStagingAuthSessionDetails(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );

    if (display.status === "authenticated" && display.recoveryHashPresent) {
      clearStagingAuthHashFromUrl();
    }

    const sessionLabel =
      display.status === "authenticated"
        ? "authenticated"
        : display.status === "recovery-error"
          ? "recovery-error"
          : display.status === "recovery-session"
            ? "recovery-session"
            : display.status === "unauthenticated"
              ? "signed-out"
              : display.status;

    setText("staging-auth-session-status", sessionLabel);
    setText("staging-auth-user-email", details.rawEmail ?? details.session.email ?? "—");
    setText(
      "staging-auth-user-id",
      details.userId
        ? `${details.userId.slice(0, 8)}…${details.userId.slice(-4)}`
        : "—",
    );
    const resolution = resolveMockAdminRole(details.rawEmail);
    setText(
      "staging-auth-role",
      resolution.displayRole === "denied"
        ? "denied (mock allowlist only — admin_users not queried)"
        : (details.session.role ?? "—"),
    );
    const signOutButtons = document.querySelectorAll<HTMLElement>("[data-staging-sign-out]");
    signOutButtons.forEach((btn) => {
      btn.hidden = display.status !== "authenticated";
    });
    if (display.status === "recovery-error") {
      setError(display.detail);
    } else if (display.status === "unauthenticated") {
      setError("");
    }
    await refreshRoleAllowlistPanel();
    await refreshAuthWriteDebugPanel();
  } catch {
    setText("staging-auth-session-status", "unknown");
    setError("Could not read Auth session.");
    await refreshAuthWriteDebugPanel();
  }
}

function wireLoginForm(): void {
  const form = document.getElementById("staging-admin-login-form");
  const loginBtn = document.getElementById("staging-login-submit");
  const signOutButtons = document.querySelectorAll<HTMLButtonElement>("[data-staging-sign-out]");
  if (!form || !loginBtn) return;

  const handleSignOut = async (signOutBtn: HTMLButtonElement) => {
    const config = getStagingAuthConfig();
    if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;
    setError("");
    signOutBtn.setAttribute("disabled", "true");
    try {
      await signOutStagingAuth(config.supabaseUrl, config.supabaseAnonKey);
      await refreshAuthStatusPanel();
      await refreshRoleAllowlistPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed.");
    } finally {
      signOutBtn.removeAttribute("disabled");
    }
  };

  loginBtn.addEventListener("click", async () => {
    const config = getStagingAuthConfig();
    if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;

    setError("");
    const emailInput = document.getElementById("admin-login-email") as
      | HTMLInputElement
      | null;
    const passwordInput = document.getElementById("admin-login-password") as
      | HTMLInputElement
      | null;
    if (!emailInput || !passwordInput) return;

    loginBtn.setAttribute("disabled", "true");
    try {
      await signInStagingAuth(
        config.supabaseUrl,
        config.supabaseAnonKey,
        emailInput.value.trim(),
        passwordInput.value,
      );
      await refreshAuthStatusPanel();
      await refreshRoleAllowlistPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      loginBtn.removeAttribute("disabled");
    }
  });

  signOutButtons.forEach((signOutBtn) => {
    signOutBtn.addEventListener("click", () => {
      void handleSignOut(signOutBtn);
    });
  });
}

export function initStagingAuthUi(): void {
  const root = document.getElementById("admin-staging-auth-root");
  if (!root) return;

  wireLoginForm();
  void refreshAuthStatusPanel();
  void refreshRoleAllowlistPanel();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initStagingAuthUi();
  });
}
