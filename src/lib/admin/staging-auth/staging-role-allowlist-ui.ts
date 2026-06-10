/**
 * G-5y-e-a — Browser updates for role / allowlist status panel.
 */

import { getStagingAuthConfig } from "./staging-auth-config";
import { getStagingAuthSession } from "./staging-auth-session";
import {
  resolveMockAdminRole,
  resolveMockPreviewRole,
} from "./staging-role-resolver";
import {
  formatPermissionFlags,
  getStagingPermissionStatus,
} from "./staging-permission-status";
import { MOCK_ALLOWLIST_DEFAULT_EMAIL } from "./mock-allowlist";

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setDeniedNotice(visible: boolean): void {
  const el = document.getElementById("staging-allowlist-denied-notice");
  if (!el) return;
  if (visible) {
    el.hidden = false;
    el.setAttribute("role", "alert");
  } else {
    el.hidden = true;
    el.removeAttribute("role");
  }
}

function renderPermissionMatrix(role: ReturnType<typeof resolveMockAdminRole>["role"]): void {
  const tbody = document.getElementById("staging-permission-matrix-body");
  if (!tbody) return;

  const rows = getStagingPermissionStatus(role);
  tbody.innerHTML = rows
    .map(
      (row) =>
        `<tr data-module="${row.module}"><th scope="row">${row.module}</th>` +
        `<td class="admin-role-allowlist-panel__perm-cell">${formatPermissionFlags(row.permissions)}</td></tr>`,
    )
    .join("");
}

export async function refreshRoleAllowlistPanel(): Promise<void> {
  const config = getStagingAuthConfig();
  const useMockPreview =
    !config.stagingAuthEnabled ||
    !config.supabaseConfigured ||
    config.authMode === "mock";

  let email: string | undefined;
  if (useMockPreview) {
    const preview = resolveMockPreviewRole();
    email = preview.email;
  } else {
    try {
      const session = await getStagingAuthSession(
        config.supabaseUrl,
        config.supabaseAnonKey,
      );
      email = session.email;
    } catch {
      email = undefined;
    }
  }

  const resolution = email
    ? resolveMockAdminRole(email)
    : useMockPreview
      ? resolveMockPreviewRole()
      : resolveMockAdminRole(undefined);

  setText("staging-role-mode", "mock-only");
  setText(
    "staging-role-email",
    resolution.email ?? (useMockPreview ? MOCK_ALLOWLIST_DEFAULT_EMAIL : "—"),
  );
  setText("staging-role-value", resolution.displayRole);
  setText("staging-allowlist-source", "mock allowlist");
  setText(
    "staging-can-access-shell",
    resolution.canAccessAdminShell ? "true" : "false",
  );
  setText("staging-production-publish", "disabled");
  setDeniedNotice(resolution.status === "mock-denied");
  renderPermissionMatrix(resolution.role);
}
