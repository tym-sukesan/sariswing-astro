/**
 * G-6-d-auth-status-denied-fix — Staging auth display status (session vs recovery hash).
 * Valid Supabase session takes precedence over stale recovery hash errors.
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import { getStagingAuthSessionDetails } from "./staging-auth-session";
import {
  hashIndicatesRecoveryFlow,
  parseStagingAuthHashError,
} from "./staging-password-reset-callback";

export type StagingAuthDisplayStatus =
  | "authenticated"
  | "unauthenticated"
  | "recovery-error"
  | "recovery-session"
  | "mock-preview"
  | "error"
  | "disabled";

export interface StagingAuthDisplayDetails {
  status: StagingAuthDisplayStatus;
  detail: string;
  recoveryHashPresent: boolean;
  recoveryErrorCode: string | null;
  sessionPresent: boolean;
  userEmail?: string;
  userId?: string;
}

function readRecoveryHashPresent(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.length > 1;
}

function readRecoveryErrorCode(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const error = params.get("error");
  if (!error) return null;
  return params.get("error_code") ?? error;
}

export async function resolveStagingAuthDisplayStatus(): Promise<StagingAuthDisplayDetails> {
  const config = getStagingAuthConfig();
  const recoveryHashPresent = readRecoveryHashPresent();
  const recoveryErrorCode = readRecoveryErrorCode();

  if (config.configMissing) {
    return {
      status: "error",
      detail: "Supabase Auth config missing",
      recoveryHashPresent,
      recoveryErrorCode,
      sessionPresent: false,
    };
  }

  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    return {
      status: config.authMode === "mock" ? "mock-preview" : "disabled",
      detail:
        config.authMode === "mock"
          ? "Supabase Auth disabled — mock preview only"
          : "Supabase Auth disabled",
      recoveryHashPresent,
      recoveryErrorCode,
      sessionPresent: false,
    };
  }

  try {
    const details = await getStagingAuthSessionDetails(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
    const hasSession = Boolean(details.rawEmail ?? details.session.email);

    if (hasSession) {
      return {
        status: "authenticated",
        detail: "Supabase Auth session active",
        recoveryHashPresent,
        recoveryErrorCode: null,
        sessionPresent: true,
        userEmail: details.rawEmail ?? details.session.email,
        userId: details.userId,
      };
    }

    const hashError = parseStagingAuthHashError();
    if (hashError) {
      return {
        status: "recovery-error",
        detail: hashError,
        recoveryHashPresent,
        recoveryErrorCode,
        sessionPresent: false,
      };
    }

    if (hashIndicatesRecoveryFlow()) {
      return {
        status: "recovery-session",
        detail: "Password recovery flow detected — set a new password or wait for session",
        recoveryHashPresent,
        recoveryErrorCode: null,
        sessionPresent: false,
      };
    }

    return {
      status: "unauthenticated",
      detail: "Sign in via staging login form",
      recoveryHashPresent,
      recoveryErrorCode: null,
      sessionPresent: false,
    };
  } catch {
    return {
      status: "error",
      detail: "Could not read Supabase Auth session",
      recoveryHashPresent,
      recoveryErrorCode,
      sessionPresent: false,
    };
  }
}
