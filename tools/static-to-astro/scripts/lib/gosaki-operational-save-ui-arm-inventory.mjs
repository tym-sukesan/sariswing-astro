/**
 * Gosaki site adapter — operational client Save UI arm inventory (mutex v1).
 *
 * Site-specific registration only. Does NOT evaluate mutex
 * (evaluation lives in Core mutex utils + Gosaki package gate adapter).
 * Core helpers must not import this file for generic Kit logic.
 *
 * Policy: tools/static-to-astro/docs/cms-core-v2-global-save-arm-mutex-policy.md
 *
 * Legacy classification safety:
 * - Prefer explicit allowlist for known non-operational Save-arm-like PUBLIC envs.
 * - Never use broad prefixes (e.g. PUBLIC_ADMIN_GOSAKI_SCHEDULE_*) to mark
 *   SAVE_UI_ARMED / SAVE_ARMED / NON_DRY_RUN_ARMED names as legacy.
 * - Unknown Save-arm-like PUBLIC names must remain unregistered → verifier FAIL.
 */

/** @typedef {"schedule"|"discography"|"youtube"|"about"} FeatureFamily */
/** @typedef {"none"|"contents"|"supabase"} WriteVariant */
/** @typedef {"operational-client-save-ui"} OperationalClass */

/**
 * @typedef {object} GosakiOperationalClientSaveUiArm
 * @property {string} featureId
 * @property {FeatureFamily} family
 * @property {string} featureLabel
 * @property {WriteVariant} variant
 * @property {string} clientEnv
 * @property {string} htmlDatasetAttr
 * @property {string} serverArmEnv
 * @property {OperationalClass} classification
 * @property {boolean} mutexTargetV1
 */

/** Package generate gate implements mutex; inventory remains registration-only. */
export const GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED = true;

export const GOSAKI_MUTEX_INVENTORY_SITE_KEY = "gosaki-piano";

/**
 * Exactly six operational client Save UI arms for Gosaki multi-route Admin.
 * Contents + Supabase pairs intentionally share htmlDatasetAttr within a family.
 */
export const GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS = Object.freeze([
  Object.freeze({
    featureId: "gosaki-schedule",
    family: "schedule",
    featureLabel: "Schedule",
    variant: "none",
    clientEnv: "PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED",
    htmlDatasetAttr: "data-gosaki-schedule-save-armed",
    serverArmEnv: "GOSAKI_SCHEDULE_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
  Object.freeze({
    featureId: "gosaki-discography",
    family: "discography",
    featureLabel: "Discography",
    variant: "none",
    clientEnv: "PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED",
    htmlDatasetAttr: "data-gosaki-discography-save-armed",
    serverArmEnv: "GOSAKI_DISCOGRAPHY_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
  Object.freeze({
    featureId: "gosaki-youtube-contents",
    family: "youtube",
    featureLabel: "YouTube Contents",
    variant: "contents",
    clientEnv: "PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED",
    htmlDatasetAttr: "data-gosaki-youtube-save-armed",
    serverArmEnv: "GOSAKI_YOUTUBE_URL_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
  Object.freeze({
    featureId: "gosaki-youtube-supabase",
    family: "youtube",
    featureLabel: "YouTube Supabase",
    variant: "supabase",
    clientEnv: "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED",
    htmlDatasetAttr: "data-gosaki-youtube-save-armed",
    serverArmEnv: "GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
  Object.freeze({
    featureId: "gosaki-about-contents",
    family: "about",
    featureLabel: "About Contents",
    variant: "contents",
    clientEnv: "PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED",
    htmlDatasetAttr: "data-gosaki-about-save-armed",
    serverArmEnv: "GOSAKI_ABOUT_CONTENT_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
  Object.freeze({
    featureId: "gosaki-about-supabase",
    family: "about",
    featureLabel: "About Supabase",
    variant: "supabase",
    clientEnv: "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED",
    htmlDatasetAttr: "data-gosaki-about-save-armed",
    serverArmEnv: "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED",
    classification: "operational-client-save-ui",
    mutexTargetV1: true,
  }),
]);

/** Path-enable / build-read — not Save arms · not mutex targets. */
export const GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS = Object.freeze([
  Object.freeze({
    kind: "path-enable",
    env: "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED",
    notes: "YouTube Contents vs Supabase route switch",
  }),
  Object.freeze({
    kind: "path-enable",
    env: "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED",
    notes: "About Contents vs Supabase route switch",
  }),
  Object.freeze({
    kind: "build-read",
    env: "CMS_KIT_SITE_EMBEDS_BUILD_READ",
    notes: "Public YouTube build overlay",
  }),
  Object.freeze({
    kind: "build-read",
    env: "CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ",
    notes: "Public About build overlay",
  }),
]);

/**
 * Explicit legacy / non-operational env literals (prefer allowlist over patterns).
 * Any Save-arm-like PUBLIC name missing from inventory + this list must FAIL discovery.
 */
export const GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS = Object.freeze([
  // musician-basic / Schedule slice arms
  "PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED",
  "PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN",
  "PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3F_GENERAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED",
  // Gosaki Schedule historical slice / insert arms (explicit names only)
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
  // CMS Core v2 Schedule TBD CREATE oneshot (Path B shell; dual-arm with server ADMIN_)
  "PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED",
  // Discography historical slice arms (explicit names only)
  "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED",
  // Other historical / non-operational
  "G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED",
  "G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED",
  "ENABLE_ADMIN_STAGING_WRITE",
]);

/**
 * Negative fixtures: unregistered Save-arm-like PUBLIC names that MUST NOT be
 * treated as legacy by prefix heuristics (must FAIL discovery if found in source).
 * Built from parts so these names are not themselves discovered as source literals.
 */
export const GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES = Object.freeze([
  ["PUBLIC_ADMIN_GOSAKI_SCHEDULE", "NEW", "SAVE_UI_ARMED"].join("_"),
  ["PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY", "BULK", "SAVE_ARMED"].join("_"),
  ["PUBLIC_ADMIN_GOSAKI_YOUTUBE", "NEW", "SAVE_UI_ARMED"].join("_"),
  ["PUBLIC_ADMIN_GOSAKI_ABOUT", "NEW", "NON_DRY_RUN_ARMED"].join("_"),
  ["PUBLIC_GOSAKI", "NEW_FEATURE", "SAVE_UI_ARMED"].join("_"),
]);

/** Families that must register both Contents + Supabase client arms. */
export const GOSAKI_DUAL_VARIANT_FAMILIES = Object.freeze(["youtube", "about"]);

/**
 * @param {string} name
 * @returns {boolean}
 */
export function looksLikePublicSaveArmEnv(name) {
  if (!name.startsWith("PUBLIC_")) return false;
  return /SAVE_UI_ARMED|SAVE_ARMED|NON_DRY_RUN_ARMED/.test(name);
}

/**
 * Legacy / non-operational classifier.
 *
 * For Save-arm-like PUBLIC names (`SAVE_UI_ARMED` / `SAVE_ARMED` / `NON_DRY_RUN_ARMED`):
 * **allowlist only** — no broad SCHEDULE_/DISCOGRAPHY_/G\d prefix heuristics.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isLegacyOrNonOperationalArmEnv(name) {
  if (GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS.includes(name)) return true;
  // Unknown Save-arm-like PUBLIC → NOT legacy (verifier must FAIL if discovered)
  if (looksLikePublicSaveArmEnv(name)) return false;
  // Non-PUBLIC (server Secrets etc.) are not client operational Save UI candidates
  if (!name.startsWith("PUBLIC_")) return true;
  // PUBLIC but not Save-arm-like (path/build-read handled separately; SAVE_ENABLED etc.)
  return true;
}

/**
 * @typedef {"inventory"|"non-mutex"|"legacy-allowlist"|"server-or-non-public"|"unregistered-operational-candidate"|"unregistered-path-or-build-read"|"other"} ArmClassKind
 *
 * @param {string} name
 * @returns {{ kind: ArmClassKind, reason: string }}
 */
export function classifyDiscoveredArmEnv(name) {
  const ops = getOperationalClientEnvSet();
  const non = getNonMutexEnvSet();
  if (ops.has(name)) {
    return { kind: "inventory", reason: "registered operational client Save UI arm" };
  }
  if (non.has(name)) {
    return { kind: "non-mutex", reason: "path-enable or build-read (out of mutex)" };
  }
  if (GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS.includes(name)) {
    return { kind: "legacy-allowlist", reason: "explicit legacy / non-operational allowlist" };
  }
  if (looksLikePublicSaveArmEnv(name)) {
    return {
      kind: "unregistered-operational-candidate",
      reason: "Save-arm-like PUBLIC not in inventory or legacy allowlist",
    };
  }
  if (/PATH_ENABLED|BUILD_READ/.test(name)) {
    return {
      kind: "unregistered-path-or-build-read",
      reason: "PATH_ENABLED/BUILD_READ not listed in non-mutex inventory",
    };
  }
  if (!name.startsWith("PUBLIC_")) {
    return {
      kind: "server-or-non-public",
      reason: "non-PUBLIC (server accept / other) — not client mutex inventory",
    };
  }
  return { kind: "other", reason: "PUBLIC but not Save-arm-like / path / build-read" };
}

export function getOperationalClientEnvSet() {
  return new Set(GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.map((a) => a.clientEnv));
}

export function getNonMutexEnvSet() {
  return new Set(GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS.map((e) => e.env));
}
