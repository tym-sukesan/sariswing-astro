/**
 * Mock Admin Auth adapter (G-5y-b).
 * No Supabase import. No fetch. No real Auth communication.
 */

import type { AdminAuthAdapter, AdminRole, AdminSession } from "./auth-adapter.types.js";

export interface MockAdminAuthAdapterOptions {
  email?: string;
  role?: AdminRole;
}

const DEFAULT_MOCK_EMAIL = "mock-admin@example.com";
const DEFAULT_MOCK_ROLE: AdminRole = "admin";

export function createMockAdminAuthAdapter(
  options: MockAdminAuthAdapterOptions = {},
): AdminAuthAdapter {
  const email = options.email ?? DEFAULT_MOCK_EMAIL;
  const role = options.role ?? DEFAULT_MOCK_ROLE;

  const baseSession = (): AdminSession => ({
    status: "mock",
    email,
    role,
    provider: "mock",
    connectedToRuntime: false,
    productionReady: false,
  });

  return {
    provider: "mock",
    connectedToRuntime: false,
    productionReady: false,
    async getSession() {
      return baseSession();
    },
    async signIn(_email: string, _password: string) {
      return baseSession();
    },
    async signOut() {
      /* mock only — no network */
    },
    async resetPassword(_email: string) {
      /* mock only — no network */
    },
  };
}
