/**
 * G-5y-e-a — Mock admin allowlist (example.com only). No DB. No fetch.
 */

import type { AdminRole } from "../../../../tools/static-to-astro/templates/admin-cms/auth/adapters/auth-adapter.types";

export const G5Y_E_A_PHASE = "G-5y-e-a";

export interface MockAllowlistEntry {
  email: string;
  role: AdminRole;
  active: boolean;
}

/** In-memory mock allowlist — mirrors mock-admin-allowlist.example.json */
export const MOCK_ADMIN_ALLOWLIST: MockAllowlistEntry[] = [
  { email: "mock-admin@example.com", role: "admin", active: true },
  { email: "mock-editor@example.com", role: "editor", active: true },
  { email: "mock-viewer@example.com", role: "viewer", active: true },
];

export const MOCK_ALLOWLIST_DEFAULT_EMAIL = "mock-admin@example.com";

export function normalizeAllowlistEmail(email?: string): string {
  return String(email ?? "").trim().toLowerCase();
}

export function findMockAllowlistEntry(email?: string): MockAllowlistEntry | undefined {
  const normalized = normalizeAllowlistEmail(email);
  if (!normalized) return undefined;
  return MOCK_ADMIN_ALLOWLIST.find(
    (entry) => normalizeAllowlistEmail(entry.email) === normalized && entry.active,
  );
}
