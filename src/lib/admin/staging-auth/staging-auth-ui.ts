/**
 * G-5y-d — Browser UI for staging shell Supabase Auth (not /admin/).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  getStagingAuthSession,
  signInStagingAuth,
  signOutStagingAuth,
} from "./staging-auth-session";

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

async function refreshAuthStatusPanel(): Promise<void> {
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
    setText("staging-auth-role", "—");
    setError(
      "Supabase Auth config missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY locally.",
    );
    return;
  }

  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    setText("staging-auth-session-status", "mock");
    setText("staging-auth-user-email", "mock-admin@example.com");
    setText("staging-auth-role", "admin (mock preview)");
    return;
  }

  try {
    const session = await getStagingAuthSession(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
    setText(
      "staging-auth-session-status",
      session.status === "signed-in" ? "signed-in" : "signed-out",
    );
    setText("staging-auth-user-email", session.email ?? "—");
    setText("staging-auth-role", session.role ?? "viewer");
    const signOutBtn = document.getElementById("staging-sign-out-btn");
    if (signOutBtn) {
      signOutBtn.hidden = session.status !== "signed-in";
    }
  } catch {
    setText("staging-auth-session-status", "unknown");
    setError("Could not read Auth session.");
  }
}

function wireLoginForm(): void {
  const form = document.getElementById("staging-admin-login-form");
  const loginBtn = document.getElementById("staging-login-submit");
  const signOutBtn = document.getElementById("staging-sign-out-btn");
  if (!form || !loginBtn) return;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      loginBtn.removeAttribute("disabled");
    }
  });

  signOutBtn?.addEventListener("click", async () => {
    const config = getStagingAuthConfig();
    if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;
    setError("");
    signOutBtn.setAttribute("disabled", "true");
    try {
      await signOutStagingAuth(config.supabaseUrl, config.supabaseAnonKey);
      await refreshAuthStatusPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed.");
    } finally {
      signOutBtn.removeAttribute("disabled");
    }
  });
}

export function initStagingAuthUi(): void {
  const root = document.getElementById("admin-staging-auth-root");
  if (!root) return;

  wireLoginForm();
  void refreshAuthStatusPanel();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initStagingAuthUi();
  });
}
