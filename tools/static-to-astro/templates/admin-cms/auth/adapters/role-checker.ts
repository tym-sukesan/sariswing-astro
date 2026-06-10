/**
 * Admin role checker scaffold (G-5y-b).
 */

import type { AdminRole } from "./auth-adapter.types.js";

const ADMIN_ROLES: readonly AdminRole[] = ["admin", "editor", "viewer"];

export function isValidAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function isAdmin(role: AdminRole | undefined): boolean {
  return role === "admin";
}

export function isEditor(role: AdminRole | undefined): boolean {
  return role === "editor";
}

export function isViewer(role: AdminRole | undefined): boolean {
  return role === "viewer";
}

export function isEditorOrAdmin(role: AdminRole | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function isViewerOnly(role: AdminRole | undefined): boolean {
  return role === "viewer";
}
