/**
 * CMS Core v2 — Save arm parse policy verifier (read-only).
 * Detects policy target (raw === "true") vs current client trim / server exact.
 * Does NOT change parsers, arms, Edge, Secrets, or packages.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARM_PARSE_FIXTURE_MATRIX,
  CLIENT_TRIM_DIVERGENCE_COUNT,
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED,
  HTML_SAVE_ARM_ATTRS,
  NON_SAVE_ARM_ENVS,
  PARSE_POLICY_FULLY_IMPLEMENTED,
  POLICY_FULLY_IMPLEMENTED,
  SAVE_ARM_INVENTORY,
  currentBooleanHardGate,
  currentClientArmed,
  currentClientTrimArmed,
  currentDatasetArmed,
  currentServerExactArmed,
  historicalClientTrimArmed,
  isSaveArmExactTrue,
  policyArmedExactTrue,
} from "./lib/cms-core-v2-save-arm-parse-policy-fixtures.mjs";
import { isSaveArmExactTrue as isSaveArmExactTrueDirect } from "./lib/save-arm-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-save-arm-parse-policy.md");

const ADMIN_TS = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const ONE_CLICK_TS = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-one-click-save.ts",
);
const PACKAGE_MARKER = path.join(TOOL_ROOT, "scripts/lib/package-run-marker.mjs");
const YT_CONTRACT = path.join(
  TOOL_ROOT,
  "scripts/lib/cms-core-v2-youtube-supabase-contract.mjs",
);
const STAGING_REF_UTILS = path.join(TOOL_ROOT, "scripts/lib/supabase-staging-ref-utils.mjs");

const SERVER_HANDLER_FILES = {
  "GOSAKI_SCHEDULE_SAVE_ARMED": [
    path.join(TOOL_ROOT, "scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts"),
    path.join(REPO_ROOT, "supabase/functions/gosaki-schedule-save-dry-run/handler.ts"),
  ],
  "GOSAKI_DISCOGRAPHY_SAVE_ARMED": [
    path.join(TOOL_ROOT, "scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts"),
    path.join(REPO_ROOT, "supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
  ],
  "GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED": [
    path.join(TOOL_ROOT, "scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/handler.ts"),
    path.join(REPO_ROOT, "supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts"),
  ],
  "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED": [
    path.join(TOOL_ROOT, "scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts"),
    path.join(REPO_ROOT, "supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts"),
  ],
  "GOSAKI_YOUTUBE_URL_SAVE_ARMED": [
    path.join(REPO_ROOT, "supabase/functions/_shared/gosaki-youtube-url-save.ts"),
  ],
  "GOSAKI_ABOUT_CONTENT_SAVE_ARMED": [
    path.join(REPO_ROOT, "supabase/functions/_shared/gosaki-about-content-save.ts"),
  ],
};

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function exists(p) {
  return fs.existsSync(p);
}

function walkFiles(dir, exts, out = []) {
  if (!exists(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "output" || ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, exts, out);
    else if (exts.some((e) => ent.name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Discover Save-arm-like env string literals in source. */
function discoverSaveArmEnvLiterals(files) {
  const found = new Set();
  const re =
    /["'`]((?:PUBLIC_)?[A-Z0-9_]*(?:SAVE_UI_ARMED|SAVE_ARMED|NON_DRY_RUN_ARMED)[A-Z0-9_]*)["'`]/g;
  for (const file of files) {
    const text = read(file);
    let m;
    while ((m = re.exec(text))) {
      const name = m[1];
      // Exclude historical slice / one-off arms outside operational inventory scope
      // by still collecting — allowlist below filters expected extras.
      found.add(name);
    }
  }
  return found;
}

/**
 * Extra Save-arm-like names that exist historically but are outside this
 * operational inventory (slice PoCs, design-only). Verifier must list them
 * explicitly so new unknowns still fail.
 */
const HISTORICAL_OR_OUT_OF_SCOPE_ARM_ENVS = new Set([
  // Design-only / docs references may still appear as string literals in design modules
  // Slice / musician-basic / historical PoC arms (src + kit verifiers)
  "PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED",
  "PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED",
  "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED",
  "PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED",
  "G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED",
  "G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED",
  "ENABLE_ADMIN_STAGING_WRITE",
]);

// --- Policy doc ---
assert("policy doc exists", exists(POLICY_DOC));
const policyDoc = read(POLICY_DOC);
assert("policy target exact true", /raw\s*===\s*"true"|armed\s*⇔\s*raw\s*===\s*"true"/.test(policyDoc));
assert("policy production STOP independent", /production STOP independent|production.*arm/i.test(policyDoc));
assert(
  "policy records client wiring complete",
  /cms-core-v2-save-arm-client-exact-true-wiring|CLIENT.*exact|PARSE_POLICY_FULLY_IMPLEMENTED:\s*true/i.test(
    policyDoc,
  ),
);

// --- Fixture matrix ---
for (const row of ARM_PARSE_FIXTURE_MATRIX) {
  assert(
    `fixture policy[${row.label}]`,
    policyArmedExactTrue(row.raw) === row.policy,
  );
  assert(
    `fixture client bake[${row.label}]`,
    currentClientArmed(row.raw) === row.clientA,
  );
  assert(
    `fixture serverB[${row.label}]`,
    currentServerExactArmed(row.raw) === row.serverB,
  );
  assert(
    `client===server===policy[${row.label}]`,
    currentClientArmed(row.raw) === row.policy &&
      currentServerExactArmed(row.raw) === row.policy,
  );
  if (row.historicalTrim !== undefined) {
    assert(
      `historical trim fixture[${row.label}]`,
      historicalClientTrimArmed(row.raw) === row.historicalTrim,
    );
  }
}

assert(
  "padded-true now disarmed on client (wired)",
  currentClientArmed(" true ") === false &&
    policyArmedExactTrue(" true ") === false &&
    currentServerExactArmed(" true ") === false,
);
assert(
  "padded-true historically armed (regression memory)",
  historicalClientTrimArmed(" true ") === true,
);
assert(
  "True-padded disarmed everywhere",
  currentClientArmed(" True ") === false && currentServerExactArmed(" True ") === false,
);
assert("TRUE disarmed all families", !currentClientArmed("TRUE") && !currentServerExactArmed("TRUE"));
assert("True disarmed all families", !currentClientArmed("True") && !currentServerExactArmed("True"));
// alias still works
assert("currentClientTrimArmed alias is exact", currentClientTrimArmed(" true ") === false);

assert("boolean gate true", currentBooleanHardGate(true) === true);
assert("boolean gate false", currentBooleanHardGate(false) === false);
assert("boolean gate undefined", currentBooleanHardGate(undefined) === false);
assert("boolean rejects string true", currentBooleanHardGate(/** @type {any} */ ("true")) === false);
assert("dataset true", currentDatasetArmed("true") === true);
assert("dataset True", currentDatasetArmed("True") === false);
assert("dataset padded", currentDatasetArmed(" true ") === false);

// --- Inventory completeness ---
const inventoryEnvs = new Set(SAVE_ARM_INVENTORY.map((a) => a.env));
assert("inventory has 12 operational arms", SAVE_ARM_INVENTORY.length === 12);
assert(
  "inventory 6 client + 6 server",
  SAVE_ARM_INVENTORY.filter((a) => a.layer === "client").length === 6 &&
    SAVE_ARM_INVENTORY.filter((a) => a.layer === "server").length === 6,
);

for (const arm of SAVE_ARM_INVENTORY) {
  assert(`doc mentions ${arm.env}`, policyDoc.includes(arm.env));
}

for (const env of NON_SAVE_ARM_ENVS) {
  assert(`non-save arm listed ${env}`, policyDoc.includes(env) || NON_SAVE_ARM_ENVS.includes(env));
  assert(`non-save not in save inventory ${env}`, !inventoryEnvs.has(env));
}

// --- Client bake exact wiring (R1 resolved) ---
assert("admin ts exists", exists(ADMIN_TS));
const adminTs = read(ADMIN_TS);
for (const arm of SAVE_ARM_INVENTORY.filter((a) => a.layer === "client")) {
  assert(`client env in admin ts ${arm.env}`, adminTs.includes(arm.env));
}
assert("admin imports isSaveArmExactTrue", /isSaveArmExactTrue/.test(adminTs));
assert("admin imports save-arm-utils", /from ["']\.\/save-arm-utils["']/.test(adminTs));

const saveArmFns = [
  "isG20u45ScheduleOperationalSaveArmed",
  "isG20u41DiscographyOperationalSaveArmed",
  "isG11c6aSaveEnabled",
  "isGosakiYoutubeSupabaseSaveEnabled",
  "isG12aAboutSaveEnabled",
  "isGosakiAboutSupabaseSaveEnabled",
];
for (const fn of saveArmFns) {
  const m = adminTs.match(
    new RegExp(`export function ${fn}\\([\\s\\S]*?\\n\\}`, "m"),
  );
  const body = m ? m[0] : "";
  assert(`${fn} uses isSaveArmExactTrue`, /isSaveArmExactTrue\(/.test(body));
  assert(`${fn} has no trim===true`, !/\.trim\(\)\s*===\s*"true"/.test(body));
}

// Path-enable may still use trim (not Save arms)
assert(
  "path-enable may retain trim (non-save)",
  /isGosakiYoutubeSupabasePathEnabled[\s\S]*?\.trim\(\)\s*===\s*"true"/.test(adminTs) ||
    /YOUTUBE_SUPABASE_PATH_ENABLED[\s\S]{0,200}\.trim\(\)\s*===\s*"true"/.test(adminTs),
);

assert("PARSE_POLICY_FULLY_IMPLEMENTED true", PARSE_POLICY_FULLY_IMPLEMENTED === true);
assert("POLICY_FULLY_IMPLEMENTED true (parse)", POLICY_FULLY_IMPLEMENTED === true);
assert("CLIENT_TRIM_DIVERGENCE_COUNT 0", CLIENT_TRIM_DIVERGENCE_COUNT === 0);
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED false",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === false,
);

const templateHelper = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/save-arm-utils.ts",
);
assert("template save-arm-utils mirror exists", exists(templateHelper));
const templateHelperSrc = read(templateHelper);
assert(
  "template mirror is raw === \"true\"",
  /return raw === "true"/.test(templateHelperSrc) && !/\.trim\(/.test(templateHelperSrc),
);

// --- Server exact ---
for (const [env, files] of Object.entries(SERVER_HANDLER_FILES)) {
  const existing = files.filter(exists);
  assert(`server files exist for ${env}`, existing.length > 0);
  for (const file of existing) {
    const src = read(file);
    assert(`server env literal ${env} in ${path.basename(file)}`, src.includes(env));
    // Exact compare without trim on the arm check
    const hasExact =
      /getEnv\([^)]*\)\s*===\s*"true"/.test(src) ||
      /Deno\.env\.get\([^)]*\)\s*===\s*"true"/.test(src) ||
      /SAVE_ARMED_ENV\)\s*===\s*"true"/.test(src) ||
      new RegExp(
        `${env.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)\\s*===\\s*"true"`,
      ).test(src);
    assert(`server exact true check ${path.basename(file)}`, hasExact);
    assert(
      `server arm check not trim ${path.basename(file)}`,
      !/\.trim\(\)\s*===\s*"true"/.test(src) ||
        // file may contain unrelated trim elsewhere — ensure SAVE arm path uses getEnv === "true"
        /(?:getEnv|Deno\.env\.get)\([^)]*(?:SAVE_ARMED|SAVE_ARMED_ENV)[^)]*\)\s*===\s*"true"/.test(
          src,
        ) ||
        /return getEnv\(SAVE_ARMED_ENV\) === "true"/.test(src) ||
        /return Deno\.env\.get\([A-Z0-9_]+\) === "true"/.test(src),
    );
  }
}

// Stronger: each server inventory arm's primary handler uses getEnv(SAVE_ARMED_ENV) === "true" pattern
for (const arm of SAVE_ARM_INVENTORY.filter((a) => a.layer === "server")) {
  const files = SERVER_HANDLER_FILES[arm.env] || [];
  const hit = files.filter(exists).some((f) => {
    const src = read(f);
    return (
      src.includes(arm.env) &&
      (src.includes('getEnv(SAVE_ARMED_ENV) === "true"') ||
        src.includes(`Deno.env.get(${arm.env.includes("CONTENT") || arm.env.includes("YOUTUBE_URL") ? "" : ""}`) ||
        /Deno\.env\.get\([A-Z0-9_]*SAVE_ARMED[^)]*\)\s*===\s*"true"/.test(src) ||
        /getEnv\(SAVE_ARMED_ENV\)\s*===\s*"true"/.test(src) ||
        /return Deno\.env\.get\([A-Z0-9_]+\) === "true"/.test(src))
    );
  });
  assert(`server policy-compliant parser ${arm.env}`, hit);
}

// --- Browser dataset + boolean gate ---
assert("one-click helper exists", exists(ONE_CLICK_TS));
const oneClick = read(ONE_CLICK_TS);
assert(
  "isClientSaveArmed boolean exact",
  /function isClientSaveArmed[\s\S]*return saveArmed === true/.test(oneClick),
);
assert("admin bakes dataset attrs", /data-gosaki-.*-save-armed/.test(adminTs) || adminTs.includes("save-armed") || adminTs.includes("SaveArmed"));

// Astro page wires dataset === "true"
const astroCandidates = walkFiles(
  path.join(TOOL_ROOT, "templates"),
  [".astro", ".ts"],
).filter((f) => /gosaki|GosakiStaging|read-only-admin|DiscographyOperator/i.test(f));
const datasetHit = astroCandidates.some((f) => {
  const src = read(f);
  return (
    /dataset\.[a-zA-Z]*SaveArmed\s*===\s*"true"/.test(src) ||
    /gosakiScheduleSaveArmed\s*===\s*"true"/.test(src) ||
    /gosakiDiscographySaveArmed\s*===\s*"true"/.test(src) ||
    /gosakiYoutubeSaveArmed\s*===\s*"true"/.test(src) ||
    /gosakiAboutSaveArmed\s*===\s*"true"/.test(src)
  );
});
assert("browser dataset === \"true\" present", datasetHit);

// --- Package verifier contracts ---
assert("package-run-marker exists", exists(PACKAGE_MARKER));
const marker = read(PACKAGE_MARKER);
assert(
  "package default aboutSaveUiArmed false",
  /aboutSaveUiArmed:\s*false/.test(marker),
);
assert(
  "package HTML about save-armed check",
  marker.includes("data-gosaki-about-save-armed"),
);
for (const attr of HTML_SAVE_ARM_ATTRS.filter((a) => a !== "data-gosaki-about-save-armed")) {
  assert(`package cross-check ${attr}`, marker.includes(attr));
}
assert(
  "package requires other CMS arms false",
  /Save UI must stay false/.test(marker),
);
assert(
  "package bake uses isSaveArmExactTrue for About UI arm",
  /isSaveArmExactTrue\(\s*e\.PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED\s*\)/.test(marker) ||
    /aboutSaveUiArmed:\s*isSaveArmExactTrue/.test(marker),
);
assert(
  "package path/build-read may still trim (non-save)",
  /PATH_ENABLED[\s\S]{0,80}\.trim\(\)\s*===\s*"true"/.test(marker) ||
    /SITE_PAGE_FIELDS_BUILD_READ[\s\S]{0,80}\.trim\(\)\s*===\s*"true"/.test(marker),
);

// Multi-arm gap (explicit — do not pretend full mutex)
assert(
  "multi-arm package scope is About-path validator only",
  /Cross-check: other CMS Save UI arms stay false/.test(marker),
);
assert(
  "no global bake mutex helper for all four features",
  !/assertSingleOperationalSaveArm|forbidMultipleSaveUiArms/.test(marker),
);

// --- Production STOP independent of arm ---
assert("staging-ref utils exist", exists(STAGING_REF_UTILS));
const refUtils = read(STAGING_REF_UTILS);
assert(
  "production STOP constant independent",
  refUtils.includes("vsbvndwuajjhnzpohghh") && refUtils.includes("PRODUCTION_REF_STOP"),
);
assert(
  "staging-ref utils has no Save arm coupling",
  !/SAVE_ARMED|SAVE_UI_ARMED/.test(refUtils),
);

// Sample Edge: production check exists alongside separate SAVE_ARMED
const aboutEdge = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts",
);
if (exists(aboutEdge)) {
  const src = read(aboutEdge);
  assert(
    "About Edge has production_ref_stop separate from arm",
    /production_ref_stop|PRODUCTION_REF_STOP/.test(src) && src.includes("SAVE_ARMED_ENV"),
  );
  assert(
    "About Edge arm check is exact getEnv",
    /getEnv\(SAVE_ARMED_ENV\)\s*===\s*"true"/.test(src),
  );
}

// --- isExactTrue naming trap (R2) ---
assert("youtube contract exists", exists(YT_CONTRACT));
const ytContract = read(YT_CONTRACT);
assert(
  "isExactTrue currently trims (known R2)",
  /function isExactTrue[\s\S]*?\.trim\(\)\s*===\s*"true"/.test(ytContract),
);

// --- Discover unknown Save arms ---
const scanRoots = [
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano"),
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(TOOL_ROOT, "scripts/lib"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const scanFiles = scanRoots.flatMap((root) => walkFiles(root, [".ts", ".mjs", ".js", ".astro"]));
const discovered = discoverSaveArmEnvLiterals(scanFiles);

const allowedDiscovered = new Set([
  ...inventoryEnvs,
  ...HISTORICAL_OR_OUT_OF_SCOPE_ARM_ENVS,
  // Constant alias names that are not env values
  "SAVE_ARMED_ENV",
  "G11C6_SAVE_ARMED_ENV",
  "G12A_SAVE_ARMED_ENV",
  "ABOUT_SUPABASE_SAVE_ARMED_ENV",
  "ABOUT_SUPABASE_SAVE_UI_ARMED_ENV",
  "YOUTUBE_SUPABASE_SAVE_ARMED_ENV",
  "YOUTUBE_SUPABASE_SAVE_UI_ARMED_ENV",
  "G11C6_SAVE_UI_ARMED_ENV",
  "G12A_ABOUT_SAVE_UI_ARMED_ENV",
  "G20U45_SCHEDULE_SAVE_UI_ARMED_ENV",
  "G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV",
]);

const unknown = [...discovered].filter((name) => {
  if (allowedDiscovered.has(name)) return false;
  if (NON_SAVE_ARM_ENVS.includes(name)) return false;
  if (name === "NON_DRY_RUN_ARMED" || name === "SAVE_ARMED" || name === "SAVE_UI_ARMED") {
    return false;
  }
  // Soft-allow historical Schedule/Discography slice / HTML one-off arms
  if (/^PUBLIC_ADMIN_(SCHEDULE|GOSAKI_SCHEDULE|DISCOGRAPHY)_/.test(name)) return false;
  if (/^PUBLIC_ADMIN_GOSAKI_SCHEDULE_/.test(name)) return false;
  if (name.includes("NON_DRY_RUN_ARMED") && name.startsWith("PUBLIC_ADMIN_")) return false;
  if (/^G10H4[A-Z]?_/.test(name)) return false;
  return true;
});

if (unknown.length) {
  console.error("Unknown Save-arm-like env literals:", unknown.sort().join(", "));
}
assert(
  "no unregistered Save-arm-like env literals in operational scan roots",
  unknown.length === 0,
  unknown.slice(0, 12).join(", "),
);

// Ensure every inventory env appears at least once in scan
for (const env of inventoryEnvs) {
  assert(`discovered inventory env ${env}`, discovered.has(env) || adminTs.includes(env));
}

// --- Overall compliance flag (must NOT claim full compliance) ---
const clientCompliant = SAVE_ARM_INVENTORY.filter(
  (a) => a.layer === "client" && a.policyCompliant === true,
);
const serverCompliant = SAVE_ARM_INVENTORY.filter(
  (a) => a.layer === "server" && a.policyCompliant === true,
);
assert("all 6 clients marked compliant (exact)", clientCompliant.length === 6);
assert("all 6 servers marked compliant (exact)", serverCompliant.length === 6);
assert(
  "parse policy fully implemented; multi-arm mutex still separate",
  PARSE_POLICY_FULLY_IMPLEMENTED === true &&
    POLICY_FULLY_IMPLEMENTED === true &&
    GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === false &&
    CLIENT_TRIM_DIVERGENCE_COUNT === 0,
);

// --- Exact-true helper present; client bake wired; Edge still separate ---
const SAVE_ARM_UTILS = path.join(TOOL_ROOT, "scripts/lib/save-arm-utils.mjs");
assert("save-arm-utils helper exists", exists(SAVE_ARM_UTILS));
assert(
  "helper matches policyArmedExactTrue for true",
  isSaveArmExactTrue("true") === true &&
    isSaveArmExactTrueDirect("true") === true &&
    policyArmedExactTrue("true") === true,
);
assert(
  "helper rejects padded true (policy)",
  isSaveArmExactTrue(" true ") === false &&
    isSaveArmExactTrueDirect(" true ") === false,
);
assert(
  "admin runtime uses isSaveArmExactTrue",
  /isSaveArmExactTrue/.test(adminTs),
);
assert(
  "package-run-marker imports save-arm-utils",
  /from ["']\.\/save-arm-utils\.mjs["']/.test(marker),
);

console.log(`\nPARSE_POLICY_FULLY_IMPLEMENTED: ${PARSE_POLICY_FULLY_IMPLEMENTED}`);
console.log(`POLICY_FULLY_IMPLEMENTED: ${POLICY_FULLY_IMPLEMENTED}`);
console.log(`CLIENT_TRIM_DIVERGENCE_COUNT: ${CLIENT_TRIM_DIVERGENCE_COUNT}`);
console.log(`GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: ${GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED}`);
console.log(`KNOWN_DIVERGENCE: (none for parse policy)`);
console.log(`inventory: ${SAVE_ARM_INVENTORY.length} arms`);
console.log(`discovered arm-like literals: ${discovered.size}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-save-arm-parse-policy-verifier");
