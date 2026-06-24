/**
 * G-10h4c — Server-injected Save gate config bridge (client reads data attrs).
 */

import { G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID } from "./gosaki-about-bands-html-static-json-write-types";

export const G10H4C_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID =
  "g10h4c-about-bands-html-save-button-page-config";

export const G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED_ENV = "G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED";

export interface G10h4cSaveButtonPageConfig {
  saveButtonSaveEnabled: boolean;
  stagingShellEnabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG10h4cSaveButtonPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G10h4cSaveButtonPageConfig {
  return {
    saveButtonSaveEnabled:
      String(env[G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG10h4cSaveButtonPageConfigFromDom(): G10h4cSaveButtonPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G10H4C_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveButtonSaveEnabled:
      el.getAttribute("data-g10h4c-save-button-save-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g10h4c-staging-shell-enabled") === "true",
    writeProvider: el.getAttribute("data-g10h4c-write-provider") ?? "",
    writeModule: el.getAttribute("data-g10h4c-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g10h4c-write-approval-id") ?? "",
  };
}

export function isG10h4cSaveButtonPageConfigValid(
  pageConfig: G10h4cSaveButtonPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId === G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID
  );
}
