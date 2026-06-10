/**
 * G-5y-d — Staging Auth session helpers. Auth only — no DB/RLS.
 */

import type { AdminSession } from "../../../../tools/static-to-astro/templates/admin-cms/auth/adapters/auth-adapter.types";
import { getStagingSupabaseClient } from "./supabase-staging-auth-client";
import { resolveMockAdminRole } from "./staging-role-resolver";

function mapSupabaseSession(
  email: string | undefined,
  status: AdminSession["status"],
): AdminSession {
  const resolution = resolveMockAdminRole(email);
  const sessionStatus =
    resolution.status === "mock-denied" && status === "signed-in" ? "denied" : status;

  return {
    status: sessionStatus,
    email: resolution.email ?? email,
    role: resolution.role,
    provider: "supabase",
    connectedToRuntime: true,
    productionReady: false,
  };
}

export function formatStagingAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。 / Invalid email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスが確認されていません。 / Email not confirmed.";
  }
  return "認証に失敗しました。しばらくしてから再度お試しください。 / Authentication failed.";
}

export async function getStagingAuthSession(
  url: string,
  anonKey: string,
): Promise<AdminSession> {
  const client = getStagingSupabaseClient(url, anonKey);
  const { data, error } = await client.auth.getSession();
  if (error) {
    return {
      status: "signed-out",
      provider: "supabase",
      connectedToRuntime: true,
      productionReady: false,
    };
  }
  const user = data.session?.user;
  if (!user?.email) {
    return {
      status: "signed-out",
      provider: "supabase",
      connectedToRuntime: true,
      productionReady: false,
    };
  }
  return mapSupabaseSession(user.email, "signed-in");
}

export async function signInStagingAuth(
  url: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<AdminSession> {
  const client = getStagingSupabaseClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(formatStagingAuthError(error.message));
  }
  const userEmail = data.user?.email ?? email;
  return mapSupabaseSession(userEmail, "signed-in");
}

export async function signOutStagingAuth(
  url: string,
  anonKey: string,
): Promise<void> {
  const client = getStagingSupabaseClient(url, anonKey);
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(formatStagingAuthError(error.message));
  }
}
