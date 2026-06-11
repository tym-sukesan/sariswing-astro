/**
 * G-6-d-staging-password-reset-callback — Recovery hash / update password (staging shell only).
 * Anon client only. No resetPasswordForEmail. No service role.
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import { getStagingSupabaseClient } from "./supabase-staging-auth-client";

export type StagingPasswordResetCallbackStatus =
  | "disabled"
  | "hash-error"
  | "waiting"
  | "recovery-ready"
  | "no-recovery-session"
  | "success";

export interface StagingPasswordResetCallbackState {
  enabled: boolean;
  status: StagingPasswordResetCallbackStatus;
  recoveryDetected: boolean;
  userEmail?: string;
  hashError?: string;
  disabledReason?: string;
}

export function formatStagingPasswordResetError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("expired") || lower.includes("otp_expired")) {
    return "Recovery link expired. Send password recovery again from Supabase Dashboard.";
  }
  if (lower.includes("same password")) {
    return "Choose a different password than your current one.";
  }
  if (lower.includes("weak") || lower.includes("at least")) {
    return "Password does not meet Supabase requirements. Use at least 8 characters.";
  }
  return "Password update failed. Try again or request a new recovery link.";
}

/** Parse hash errors without exposing tokens. */
export function parseStagingAuthHashError(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const error = params.get("error");
  if (!error) return null;

  const code = params.get("error_code") ?? "";
  if (code === "otp_expired" || error === "access_denied") {
    return "Recovery link expired or invalid. Send password recovery again from Supabase Dashboard.";
  }

  const description = params.get("error_description");
  if (description) {
    try {
      return decodeURIComponent(description.replace(/\+/g, " "));
    } catch {
      return "Recovery link error. Send password recovery again from Supabase Dashboard.";
    }
  }

  return "Recovery link error. Send password recovery again from Supabase Dashboard.";
}

export function hashIndicatesRecoveryFlow(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  if (params.get("error")) return false;
  return (
    params.has("access_token") ||
    params.get("type") === "recovery" ||
    params.has("refresh_token")
  );
}

export function clearStagingAuthHashFromUrl(): void {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;
  const path = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", path);
}

export function getStagingPasswordResetGateState(): StagingPasswordResetCallbackState {
  const config = getStagingAuthConfig();
  const hashError = parseStagingAuthHashError();

  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    return {
      enabled: false,
      status: "disabled",
      recoveryDetected: false,
      disabledReason:
        "Staging Supabase Auth is disabled. Set ENABLE_ADMIN_STAGING_AUTH=true and PUBLIC_ADMIN_AUTH_PROVIDER=supabase.",
    };
  }

  if (hashError) {
    return {
      enabled: true,
      status: "hash-error",
      recoveryDetected: false,
      hashError,
    };
  }

  return {
    enabled: true,
    status: hashIndicatesRecoveryFlow() ? "waiting" : "no-recovery-session",
    recoveryDetected: false,
  };
}

export async function ensureStagingRecoverySession(
  url: string,
  anonKey: string,
): Promise<{ ok: boolean; email?: string; error?: string }> {
  const client = getStagingSupabaseClient(url, anonKey);

  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user?.email) {
    clearStagingAuthHashFromUrl();
    return { ok: true, email: session.user.email };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: { ok: boolean; email?: string; error?: string }) => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeoutId);
      resolve(result);
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (event === "SIGNED_IN" && nextSession?.user)
      ) {
        clearStagingAuthHashFromUrl();
        finish({
          ok: true,
          email: nextSession?.user?.email ?? undefined,
        });
      }
    });

    const timeoutId = window.setTimeout(async () => {
      const {
        data: { session: retry },
      } = await client.auth.getSession();
      if (retry?.user?.email) {
        clearStagingAuthHashFromUrl();
        finish({ ok: true, email: retry.user.email });
        return;
      }
      finish({
        ok: false,
        error:
          "No recovery session detected. Open the newest recovery email link, then return to this staging shell route with the URL hash intact.",
      });
    }, 3000);
  });
}

export async function updateStagingAuthPassword(
  url: string,
  anonKey: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getStagingSupabaseClient(url, anonKey);
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, error: formatStagingPasswordResetError(error.message) };
  }
  return { ok: true };
}

export async function signOutStagingAfterPasswordReset(
  url: string,
  anonKey: string,
): Promise<void> {
  const client = getStagingSupabaseClient(url, anonKey);
  await client.auth.signOut();
}
