/**
 * Fixtures for CMS Core feature-flag trim-true helper.
 * Documents PATH_ENABLED / BUILD_READ contract vs Save arm exact-"true" (no import of save-arm SoT).
 */

import { isFeatureFlagTrimTrue } from "./feature-flag-trim-true-utils.mjs";

/** @type {ReadonlyArray<{ raw: unknown, trimTrue: boolean, exactTrue: boolean, label: string }>} */
export const FEATURE_FLAG_TRIM_TRUE_CASES = Object.freeze([
  { raw: "true", trimTrue: true, exactTrue: true, label: "exact true" },
  { raw: " true ", trimTrue: true, exactTrue: false, label: "padded true" },
  { raw: undefined, trimTrue: false, exactTrue: false, label: "undefined" },
  { raw: null, trimTrue: false, exactTrue: false, label: "null" },
  { raw: "", trimTrue: false, exactTrue: false, label: "empty" },
  { raw: "   ", trimTrue: false, exactTrue: false, label: "whitespace" },
  { raw: "false", trimTrue: false, exactTrue: false, label: "false string" },
  { raw: "junk", trimTrue: false, exactTrue: false, label: "junk" },
  { raw: "True", trimTrue: false, exactTrue: false, label: "True" },
  { raw: "TRUE", trimTrue: false, exactTrue: false, label: "TRUE" },
  { raw: true, trimTrue: true, exactTrue: false, label: "boolean true (String coerce legacy)" },
  { raw: false, trimTrue: false, exactTrue: false, label: "boolean false" },
  { raw: 1, trimTrue: false, exactTrue: false, label: "number 1" },
]);

/**
 * Legacy inline expression (pre-extraction) for deep-equality vs helper.
 * @param {unknown} raw
 */
export function legacyFeatureFlagTrimTrue(raw) {
  return String(raw ?? "").trim() === "true";
}

/**
 * Bake-shape deep-equality inputs for package-run-marker PATH/BUILD_READ.
 * Save UI arm stays exact-"true" (separate).
 */
export const ABOUT_PATH_BAKE_ENV_CASES = Object.freeze([
  {
    label: "path+build padded true · save arm padded false",
    env: {
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED: " true ",
      CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: " true ",
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: " true ",
    },
    expected: {
      aboutWriteBackend: "supabase",
      aboutSaveUiArmed: false,
      publicAboutBuildRead: true,
    },
  },
  {
    label: "path exact true · build unset · save exact true",
    env: {
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED: "true",
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: "true",
    },
    expected: {
      aboutWriteBackend: "supabase",
      aboutSaveUiArmed: true,
      publicAboutBuildRead: false,
    },
  },
  {
    label: "path True (case) · build TRUE · all false",
    env: {
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED: "True",
      CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: "TRUE",
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: "true",
    },
    expected: {
      aboutWriteBackend: "contents",
      aboutSaveUiArmed: true,
      publicAboutBuildRead: false,
    },
  },
  {
    label: "boolean true env · PATH/BUILD coerce on · Save arm off",
    env: {
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED: true,
      CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: true,
      PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: true,
    },
    expected: {
      aboutWriteBackend: "supabase",
      aboutSaveUiArmed: false,
      publicAboutBuildRead: true,
    },
  },
]);

/** Prove helper ↔ legacy for the matrix (Save-arm boundary checked in verifier). */
export function assertTrimTrueMatrix(assertFn) {
  for (const c of FEATURE_FLAG_TRIM_TRUE_CASES) {
    assertFn(
      `trimTrue ${c.label}`,
      isFeatureFlagTrimTrue(c.raw) === c.trimTrue &&
        legacyFeatureFlagTrimTrue(c.raw) === c.trimTrue,
    );
  }
}
