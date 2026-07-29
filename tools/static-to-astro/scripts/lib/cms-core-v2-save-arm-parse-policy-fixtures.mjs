/**
 * CMS Core v2 — Save arm parse policy fixtures (verifier-only).
 * Mirrors current Family A / B semantics for matrix tests.
 * NOT wired into Admin / Edge / package runtime. Do not import from production Save paths.
 */

import { isSaveArmExactTrue } from "./save-arm-utils.mjs";

/** Policy target SoT — delegates to Core helper (still unwired to runtime). */
export function policyArmedExactTrue(raw) {
  return isSaveArmExactTrue(raw);
}

export { isSaveArmExactTrue };

/** Current client / bake Family A. */
export function currentClientTrimArmed(raw) {
  return String(raw ?? "").trim() === "true";
}

/** Current Edge / Deno Family B. */
export function currentServerExactArmed(raw) {
  return raw === "true";
}

/** Current boolean hard gate Family C. */
export function currentBooleanHardGate(saveArmed) {
  return saveArmed === true;
}

/** Current HTML dataset Family D. */
export function currentDatasetArmed(attr) {
  return attr === "true";
}

/**
 * Inventory of operational Save arms (client PUBLIC_* + server Secrets).
 * New Save arms discovered in source must be registered here or the verifier fails.
 */
export const SAVE_ARM_INVENTORY = Object.freeze([
  {
    id: "schedule-client",
    feature: "Schedule",
    layer: "client",
    env: "PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts"],
  },
  {
    id: "schedule-server",
    feature: "Schedule",
    layer: "server",
    env: "GOSAKI_SCHEDULE_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-schedule-save-dry-run/handler.ts"],
  },
  {
    id: "discography-client",
    feature: "Discography",
    layer: "client",
    env: "PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts"],
  },
  {
    id: "discography-server",
    feature: "Discography",
    layer: "server",
    env: "GOSAKI_DISCOGRAPHY_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-discography-save-dry-run/handler.ts"],
  },
  {
    id: "youtube-contents-client",
    feature: "YouTube Contents",
    layer: "client",
    env: "PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts"],
  },
  {
    id: "youtube-contents-server",
    feature: "YouTube Contents",
    layer: "server",
    env: "GOSAKI_YOUTUBE_URL_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-youtube-url-save.ts"],
  },
  {
    id: "youtube-supabase-client",
    feature: "YouTube Supabase",
    layer: "client",
    env: "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts"],
  },
  {
    id: "youtube-supabase-server",
    feature: "YouTube Supabase",
    layer: "server",
    env: "GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-youtube-supabase-save-dry-run/handler.ts"],
  },
  {
    id: "about-contents-client",
    feature: "About Contents",
    layer: "client",
    env: "PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts"],
  },
  {
    id: "about-contents-server",
    feature: "About Contents",
    layer: "server",
    env: "GOSAKI_ABOUT_CONTENT_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-about-content-save.ts"],
  },
  {
    id: "about-supabase-client",
    feature: "About Supabase",
    layer: "client",
    env: "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED",
    parserFamily: "A",
    policyCompliant: false,
    sourceHints: ["gosaki-staging-read-only-admin.ts", "package-run-marker.mjs"],
  },
  {
    id: "about-supabase-server",
    feature: "About Supabase",
    layer: "server",
    env: "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED",
    parserFamily: "B",
    policyCompliant: true,
    sourceHints: ["gosaki-about-supabase-save-dry-run/handler.ts"],
  },
]);

/** Path / build-read flags — NOT Save arms. */
export const NON_SAVE_ARM_ENVS = Object.freeze([
  "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED",
  "PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED",
  "CMS_KIT_SITE_EMBEDS_BUILD_READ",
  "CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ",
]);

export const HTML_SAVE_ARM_ATTRS = Object.freeze([
  "data-gosaki-about-save-armed",
  "data-gosaki-youtube-save-armed",
  "data-gosaki-schedule-save-armed",
  "data-gosaki-discography-save-armed",
]);

/**
 * Fixture matrix rows: [label, rawInput, policyArmed, clientA, serverB]
 * undefined raw simulated as missing env.
 */
export const ARM_PARSE_FIXTURE_MATRIX = Object.freeze([
  { label: "unset", raw: undefined, policy: false, clientA: false, serverB: false },
  { label: "empty", raw: "", policy: false, clientA: false, serverB: false },
  { label: "false", raw: "false", policy: false, clientA: false, serverB: false },
  { label: "true", raw: "true", policy: true, clientA: true, serverB: true },
  { label: "TRUE", raw: "TRUE", policy: false, clientA: false, serverB: false },
  { label: "True", raw: "True", policy: false, clientA: false, serverB: false },
  { label: "padded-true", raw: " true ", policy: false, clientA: true, serverB: false },
  { label: "True-padded", raw: " True ", policy: false, clientA: false, serverB: false },
  { label: "true-tab-padded", raw: "\ttrue\t", policy: false, clientA: true, serverB: false },
  { label: "junk-1", raw: "1", policy: false, clientA: false, serverB: false },
  { label: "junk-yes", raw: "yes", policy: false, clientA: false, serverB: false },
]);

export const POLICY_FULLY_IMPLEMENTED = false;
export const KNOWN_DIVERGENCE_REASON =
  "client bake uses String(...).trim() === \"true\" while policy/server require raw === \"true\"";
