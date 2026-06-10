/**
 * G-5y-e-a — Staging permission status (aligned with G-5y-b permission-checker).
 */

import type {
  AdminModule,
  AdminPermission,
  AdminRole,
} from "../../../../tools/static-to-astro/templates/admin-cms/auth/adapters/auth-adapter.types";
import { can } from "../../../../tools/static-to-astro/templates/admin-cms/auth/adapters/permission-checker";

export const STAGING_PERMISSION_MODULES: AdminModule[] = [
  "dashboard",
  "profile",
  "schedule",
  "discography",
  "links",
  "news",
  "media",
  "publish",
  "settings",
];

export const STAGING_PERMISSION_ACTIONS: AdminPermission[] = [
  "read",
  "create",
  "update",
  "delete",
  "upload",
  "stagingPublish",
  "productionPublish",
];

export interface StagingModulePermissionStatus {
  module: AdminModule;
  permissions: Record<AdminPermission, boolean>;
}

export function getStagingPermissionStatus(
  role: AdminRole | undefined,
): StagingModulePermissionStatus[] {
  return STAGING_PERMISSION_MODULES.map((module) => {
    const permissions = {} as Record<AdminPermission, boolean>;
    for (const permission of STAGING_PERMISSION_ACTIONS) {
      permissions[permission] = can(role, module, permission);
    }
    permissions.productionPublish = false;
    return { module, permissions };
  });
}

export function formatPermissionFlags(flags: Record<AdminPermission, boolean>): string {
  return STAGING_PERMISSION_ACTIONS.filter((p) => flags[p])
    .map((p) => (p === "productionPublish" ? `${p}:false` : p))
    .join(", ") || "—";
}
