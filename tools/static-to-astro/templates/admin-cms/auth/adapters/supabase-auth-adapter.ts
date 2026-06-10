/**
 * G-5y-d — Supabase staging Auth adapter (staging shell only).
 * Anon key only. No service role. No DB/RLS.
 */

import type { AdminAuthAdapter, AdminSession } from "./auth-adapter.types";
import {
  getStagingAuthSession,
  signInStagingAuth,
  signOutStagingAuth,
} from "../../../../../../src/lib/admin/staging-auth/staging-auth-session";
import { getStagingAuthConfig } from "../../../../../../src/lib/admin/staging-auth/staging-auth-config";

export function createSupabaseStagingAuthAdapter(): AdminAuthAdapter {
  const config = getStagingAuthConfig();

  if (!config.stagingAuthEnabled || !config.supabaseConfigured) {
    return {
      provider: "mock",
      connectedToRuntime: false,
      productionReady: false,
      async getSession(): Promise<AdminSession> {
        return {
          status: "mock",
          email: "mock-admin@example.com",
          role: "admin",
          provider: "mock",
          connectedToRuntime: false,
          productionReady: false,
        };
      },
    };
  }

  const { supabaseUrl, supabaseAnonKey } = config;

  return {
    provider: "supabase",
    connectedToRuntime: true,
    productionReady: false,
    async getSession() {
      return getStagingAuthSession(supabaseUrl, supabaseAnonKey);
    },
    async signIn(email: string, password: string) {
      return signInStagingAuth(supabaseUrl, supabaseAnonKey, email, password);
    },
    async signOut() {
      await signOutStagingAuth(supabaseUrl, supabaseAnonKey);
    },
  };
}
