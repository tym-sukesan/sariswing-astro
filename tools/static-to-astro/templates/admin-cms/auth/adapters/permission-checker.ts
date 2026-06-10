/**
 * Admin permission checker scaffold (G-5y-b).
 * Aligned with G-5y-a permission matrix. productionPublish disabled by default.
 */

import type { AdminModule, AdminPermission, AdminRole } from "./auth-adapter.types.js";
import { isAdmin } from "./role-checker.js";

type Matrix = Record<AdminModule, Partial<Record<AdminRole, AdminPermission[]>>>;

/** G-5y-a matrix draft — scaffold only, not enforced at runtime yet. */
export const PERMISSION_MATRIX: Matrix = {
  dashboard: {
    viewer: ["read"],
    editor: ["read"],
    admin: ["read"],
  },
  profile: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  schedule: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore", "duplicate"],
  },
  discography: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  links: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  news: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  media: {
    viewer: ["read"],
    editor: ["read"],
    admin: ["read", "upload", "update", "delete"],
  },
  publish: {
    viewer: [],
    editor: ["stagingPublish"],
    admin: ["stagingPublish"],
  },
  settings: {
    viewer: [],
    editor: [],
    admin: ["read", "settingsManage"],
  },
};

export const PRODUCTION_PUBLISH_REQUIRES_APPROVAL = true;
export const PRODUCTION_PUBLISH_ENABLED_BY_DEFAULT = false;

export function getPermissionsForRole(
  role: AdminRole,
  module: AdminModule,
): AdminPermission[] {
  return PERMISSION_MATRIX[module]?.[role] ?? [];
}

export function can(
  role: AdminRole | undefined,
  module: AdminModule,
  permission: AdminPermission,
): boolean {
  if (!role) return false;

  if (permission === "productionPublish") {
    if (PRODUCTION_PUBLISH_ENABLED_BY_DEFAULT) return false;
    if (PRODUCTION_PUBLISH_REQUIRES_APPROVAL) return false;
    return isAdmin(role);
  }

  return getPermissionsForRole(role, module).includes(permission);
}
