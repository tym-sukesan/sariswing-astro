/**
 * G-10h4a — Server-injected Save gate config bridge (client reads data attrs).
 */

import { G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID } from "./gosaki-about-profile-html-static-json-write-types";

export const G10H4A_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID =
  "g10h4a-about-profile-html-save-button-page-config";

export const G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED_ENV = "G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED";

export interface G10h4aSaveButtonPageConfig {
  saveButtonSaveEnabled: boolean;
  stagingShellEnabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG10h4aSaveButtonPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G10h4aSaveButtonPageConfig {
  return {
    saveButtonSaveEnabled:
      String(env[G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG10h4aSaveButtonPageConfigFromDom(): G10h4aSaveButtonPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G10H4A_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveButtonSaveEnabled:
      el.getAttribute("data-g10h4a-save-button-save-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g10h4a-staging-shell-enabled") === "true",
    writeProvider: el.getAttribute("data-g10h4a-write-provider") ?? "",
    writeModule: el.getAttribute("data-g10h4a-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g10h4a-write-approval-id") ?? "",
  };
}

export function isG10h4aSaveButtonPageConfigValid(
  pageConfig: G10h4aSaveButtonPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId === G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID
  );
}
