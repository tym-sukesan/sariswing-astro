/**
 * G-5y-e-a — Mock role resolver for staging shell. No DB / admin_users / fetch.
 */

import type { AdminRole } from "../../../../tools/static-to-astro/templates/admin-cms/auth/adapters/auth-adapter.types";
import {
  findMockAllowlistEntry,
  MOCK_ALLOWLIST_DEFAULT_EMAIL,
  normalizeAllowlistEmail,
} from "./mock-allowlist";

export type StagingRoleResolutionStatus = "mock-allowed" | "mock-denied" | "unknown";

export interface StagingRoleResolution {
  email?: string;
  role?: AdminRole;
  displayRole: AdminRole | "denied";
  status: StagingRoleResolutionStatus;
  active: boolean;
  canAccessAdminShell: boolean;
  productionPublish: false;
  source: "mock-allowlist";
  adminUsersTableUsed: false;
  dbQueryPerformed: false;
  rlsPolicyChanged: false;
}

function buildDenied(email?: string): StagingRoleResolution {
  return {
    email,
    role: undefined,
    displayRole: "denied",
    status: "mock-denied",
    active: false,
    canAccessAdminShell: false,
    productionPublish: false,
    source: "mock-allowlist",
    adminUsersTableUsed: false,
    dbQueryPerformed: false,
    rlsPolicyChanged: false,
  };
}

export function resolveMockAdminRole(email?: string): StagingRoleResolution {
  const normalized = normalizeAllowlistEmail(email);
  if (!normalized) {
    return {
      ...buildDenied(undefined),
      status: "unknown",
    };
  }

  const entry = findMockAllowlistEntry(normalized);
  if (!entry) {
    return buildDenied(normalized);
  }

  return {
    email: normalized,
    role: entry.role,
    displayRole: entry.role,
    status: "mock-allowed",
    active: true,
    canAccessAdminShell: true,
    productionPublish: false,
    source: "mock-allowlist",
    adminUsersTableUsed: false,
    dbQueryPerformed: false,
    rlsPolicyChanged: false,
  };
}

/** Default mock preview when Auth is disabled (G-5y-c mock mode). */
export function resolveMockPreviewRole(): StagingRoleResolution {
  return resolveMockAdminRole(MOCK_ALLOWLIST_DEFAULT_EMAIL);
}
