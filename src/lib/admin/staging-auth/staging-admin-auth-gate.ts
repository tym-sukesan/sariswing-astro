/**
 * G-9j5b — Gosaki staging admin auth gate (anon client only).
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import {
  getStagingAuthSessionDetails,
  signOutStagingAuth,
} from "./staging-auth-session";
import { getStagingSupabaseClient } from "./supabase-staging-auth-client";

export type StagingAdminGateState =
  | "loading"
  | "disabled"
  | "unauthenticated"
  | "authenticated";

const GATE_ROOT_ID = "staging-admin-auth-gate";
const LOADING_ID = "staging-admin-auth-gate-loading";
const LOGIN_ID = "staging-admin-auth-gate-login";
const PROTECTED_ID = "staging-admin-auth-gate-protected";
const SIGNED_IN_BAR_ID = "staging-admin-auth-gate-signed-in-bar";
const USER_EMAIL_ID = "staging-admin-gate-user-email";

function setHidden(id: string, hidden: boolean): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = hidden;
}

function setUserEmail(email: string | undefined): void {
  const el = document.getElementById(USER_EMAIL_ID);
  if (el) el.textContent = email ? `ログイン中: ${email}` : "";
}

export function applyStagingAdminAuthGateState(state: StagingAdminGateState): void {
  const root = document.getElementById(GATE_ROOT_ID);
  if (!root) return;

  root.dataset.gateState = state;

  switch (state) {
    case "loading":
      setHidden(LOADING_ID, false);
      setHidden(LOGIN_ID, true);
      setHidden(PROTECTED_ID, true);
      setHidden(SIGNED_IN_BAR_ID, true);
      break;
    case "disabled":
    case "unauthenticated":
      setHidden(LOADING_ID, true);
      setHidden(LOGIN_ID, false);
      setHidden(PROTECTED_ID, true);
      setHidden(SIGNED_IN_BAR_ID, true);
      setUserEmail(undefined);
      break;
    case "authenticated":
      setHidden(LOADING_ID, true);
      setHidden(LOGIN_ID, true);
      setHidden(PROTECTED_ID, false);
      setHidden(SIGNED_IN_BAR_ID, false);
      break;
  }
}

export async function resolveStagingAdminAuthGateState(): Promise<{
  state: StagingAdminGateState;
  email?: string;
}> {
  const config = getStagingAuthConfig();
  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    return { state: "disabled" };
  }

  const details = await getStagingAuthSessionDetails(
    config.supabaseUrl,
    config.supabaseAnonKey,
  );
  if (details.session.status === "signed-in") {
    return { state: "authenticated", email: details.rawEmail ?? details.session.email };
  }
  return { state: "unauthenticated" };
}

export async function refreshStagingAdminAuthGate(): Promise<void> {
  if (!document.getElementById(GATE_ROOT_ID)) return;

  const { state, email } = await resolveStagingAdminAuthGateState();
  applyStagingAdminAuthGateState(state);
  if (state === "authenticated") {
    setUserEmail(email);
  }
}

function wireGateSignOut(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-staging-admin-gate-sign-out]").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        void (async () => {
          const config = getStagingAuthConfig();
          if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;
          btn.disabled = true;
          try {
            await signOutStagingAuth(config.supabaseUrl, config.supabaseAnonKey);
            applyStagingAdminAuthGateState("unauthenticated");
          } finally {
            btn.disabled = false;
          }
        })();
      });
    },
  );
}

function subscribeStagingAdminAuthGate(): void {
  const config = getStagingAuthConfig();
  if (!config.stagingAuthEnabled || !config.supabaseConfigured) return;

  const client = getStagingSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.email) {
      applyStagingAdminAuthGateState("authenticated");
      setUserEmail(session.user.email);
      return;
    }
    applyStagingAdminAuthGateState("unauthenticated");
  });
}

export function initStagingAdminAuthGate(): void {
  const root = document.getElementById(GATE_ROOT_ID);
  if (!root) return;

  applyStagingAdminAuthGateState("loading");
  wireGateSignOut();
  subscribeStagingAdminAuthGate();

  void refreshStagingAdminAuthGate();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initStagingAdminAuthGate();
  });
}
