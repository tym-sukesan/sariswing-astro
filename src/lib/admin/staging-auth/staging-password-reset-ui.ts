/**
 * G-6-d-staging-password-reset-callback — Browser UI (staging shell only).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import { refreshAuthWriteDebugPanel } from "./staging-auth-write-debug-ui";
import { refreshAuthStatusPanel } from "./staging-auth-ui";
import {
  ensureStagingRecoverySession,
  getStagingPasswordResetGateStateAsync,
  signOutStagingAfterPasswordReset,
  updateStagingAuthPassword,
  clearStagingAuthHashFromUrl,
} from "./staging-password-reset-callback";

const MIN_PASSWORD_LENGTH = 8;

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHidden(id: string, hidden: boolean): void {
  const el = document.getElementById(id);
  if (el) el.hidden = hidden;
}

function setError(message: string): void {
  const el = document.getElementById("staging-password-reset-error");
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function setSuccess(message: string): void {
  const el = document.getElementById("staging-password-reset-success");
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function scrollToResetPanel(): void {
  document
    .getElementById("staging-password-reset-callback")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function refreshPasswordResetPanel(): Promise<void> {
  const config = getStagingAuthConfig();
  const gate = config.stagingAuthEnabled && config.supabaseConfigured
    ? await getStagingPasswordResetGateStateAsync(
        config.supabaseUrl,
        config.supabaseAnonKey,
      )
    : {
        enabled: false,
        status: "disabled" as const,
        recoveryDetected: false,
        disabledReason:
          "Staging Supabase Auth is disabled. Set ENABLE_ADMIN_STAGING_AUTH=true and PUBLIC_ADMIN_AUTH_PROVIDER=supabase.",
      };

  setText("staging-password-reset-enabled", gate.enabled ? "true" : "false");
  setText("staging-password-reset-status", gate.status);
  setText(
    "staging-password-reset-recovery-detected",
    gate.recoveryDetected ? "true" : "false",
  );
  setText("staging-password-reset-user-email", gate.userEmail ?? "—");

  const form = document.getElementById("staging-password-reset-form");
  const updateBtn = document.getElementById(
    "staging-password-reset-submit",
  ) as HTMLButtonElement | null;

  if (!gate.enabled) {
    setError(gate.disabledReason ?? "Password reset callback is disabled.");
    setHidden("staging-password-reset-form", true);
    if (updateBtn) updateBtn.disabled = true;
    return;
  }

  if (gate.hashError) {
    setError(gate.hashError);
    setHidden("staging-password-reset-form", true);
    if (updateBtn) updateBtn.disabled = true;
    return;
  }

  setError("");
  setSuccess("");

  if (gate.status === "success") {
    setHidden("staging-password-reset-form", true);
    if (updateBtn) updateBtn.disabled = true;
    return;
  }

  if (gate.status === "recovery-ready") {
    setHidden("staging-password-reset-form", false);
    if (updateBtn) updateBtn.disabled = false;
    return;
  }

  if (gate.status === "waiting") {
    setText("staging-password-reset-status", "loading");
    setHidden("staging-password-reset-form", true);
    if (updateBtn) updateBtn.disabled = true;

    const config = getStagingAuthConfig();
    const result = await ensureStagingRecoverySession(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );

    if (result.ok) {
      setText("staging-password-reset-status", "recovery-ready");
      setText("staging-password-reset-recovery-detected", "true");
      setText("staging-password-reset-user-email", result.email ?? "—");
      setHidden("staging-password-reset-form", false);
      if (updateBtn) updateBtn.disabled = false;
      void refreshAuthWriteDebugPanel();
      return;
    }

    setText("staging-password-reset-status", "no-recovery-session");
    setError(result.error ?? "No recovery session detected.");
    setHidden("staging-password-reset-form", true);
    if (updateBtn) updateBtn.disabled = true;
    return;
  }

  setHidden("staging-password-reset-form", true);
  if (updateBtn) updateBtn.disabled = true;
}

async function handlePasswordUpdate(): Promise<void> {
  const config = getStagingAuthConfig();
  if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;

  const passwordInput = document.getElementById(
    "staging-password-reset-new",
  ) as HTMLInputElement | null;
  const confirmInput = document.getElementById(
    "staging-password-reset-confirm",
  ) as HTMLInputElement | null;
  const updateBtn = document.getElementById(
    "staging-password-reset-submit",
  ) as HTMLButtonElement | null;

  const password = passwordInput?.value ?? "";
  const confirm = confirmInput?.value ?? "";

  if (!password || !confirm) {
    setError("Enter and confirm your new password.");
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }

  if (password !== confirm) {
    setError("Password and confirmation do not match.");
    return;
  }

  setError("");
  setSuccess("");
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating…";
  }

  const result = await updateStagingAuthPassword(
    config.supabaseUrl,
    config.supabaseAnonKey,
    password,
  );

  if (updateBtn) {
    updateBtn.textContent = "Update password";
  }

  if (!result.ok) {
    setError(result.error ?? "Password update failed.");
    if (updateBtn) updateBtn.disabled = false;
    return;
  }

  if (passwordInput) passwordInput.value = "";
  if (confirmInput) confirmInput.value = "";

  await signOutStagingAfterPasswordReset(
    config.supabaseUrl,
    config.supabaseAnonKey,
  );

  clearStagingAuthHashFromUrl();

  setText("staging-password-reset-status", "success");
  setSuccess(
    "Password updated for staging Supabase Auth. You can now sign in with the new password.",
  );
  setHidden("staging-password-reset-form", true);
  if (updateBtn) updateBtn.disabled = true;

  await refreshAuthStatusPanel();
  await refreshAuthWriteDebugPanel();
  scrollToResetPanel();
}

function wirePasswordResetUi(): void {
  document
    .getElementById("staging-password-reset-submit")
    ?.addEventListener("click", () => {
      void handlePasswordUpdate();
    });

  document
    .getElementById("staging-password-reset-back-login")
    ?.addEventListener("click", () => {
      document.getElementById("login-ui-shell")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

  document
    .getElementById("staging-password-reset-sign-out")
    ?.addEventListener("click", async () => {
      const config = getStagingAuthConfig();
      if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;
      await signOutStagingAfterPasswordReset(
        config.supabaseUrl,
        config.supabaseAnonKey,
      );
      await refreshAuthStatusPanel();
      await refreshAuthWriteDebugPanel();
    });
}

export async function initStagingPasswordResetUi(): Promise<void> {
  const root = document.getElementById("staging-password-reset-callback");
  if (!root) return;

  wirePasswordResetUi();

  const config = getStagingAuthConfig();
  const gate =
    config.stagingAuthEnabled && config.supabaseConfigured
      ? await getStagingPasswordResetGateStateAsync(
          config.supabaseUrl,
          config.supabaseAnonKey,
        )
      : { status: "disabled" as const, hashError: undefined };

  if (gate.hashError || gate.status === "waiting") {
    scrollToResetPanel();
  }

  await refreshPasswordResetPanel();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    void initStagingPasswordResetUi();
  });
}
