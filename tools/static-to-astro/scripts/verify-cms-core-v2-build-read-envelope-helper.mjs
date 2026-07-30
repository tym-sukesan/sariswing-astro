/**
 * CMS Core v2 — build-read envelope skeleton verifier.
 * Offline deep-equality fixtures · no network / DB / package / FTP.
 *
 * Run: node scripts/verify-cms-core-v2-build-read-envelope-helper.mjs
 * npm: verify:cms-core-v2-build-read-envelope
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABOUT_ENVELOPE_FIXTURES,
  ABOUT_DS,
  ABOUT_FIELD_ROW,
  ABOUT_PROFILE_LEDE,
  ABOUT_ROWS,
  ABOUT_SITE,
  EXTRA_METADATA_FIXTURE,
  YOUTUBE_ENVELOPE_FIXTURES,
  YT_DS,
  YT_EMBED_ROW,
  YT_ROWS,
  YT_SITE,
} from "./lib/cms-core-v2-build-read-envelope-fixtures.mjs";
import {
  buildReadRowCount,
  createBuildReadEnvelope,
  createBuildReadFallbackEnvelope,
  createBuildReadSuccessEnvelope,
} from "./lib/build-read-envelope-utils.mjs";
import { finalizeSitePageFieldsLoadResult } from "./lib/site-cms-features.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/build-read-envelope-utils.mjs");
const FEATURES = path.join(__dirname, "lib/site-cms-features.mjs");
const DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-build-read-envelope-helper.md");

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

function deepEqual(name, actual, expected) {
  try {
    assertNode.deepStrictEqual(actual, expected);
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err instanceof Error ? err.message : String(err));
  }
}

assert("core module exists", fs.existsSync(CORE));
assert("doc exists", fs.existsSync(DOC));

const coreSrc = fs.readFileSync(CORE, "utf8");
const featuresSrc = fs.readFileSync(FEATURES, "utf8");
const docSrc = fs.readFileSync(DOC, "utf8");

assert("core has no gosaki import", !/gosaki-/i.test(coreSrc));
assert("core has no createClient", !/createClient/.test(coreSrc));
assert("core has no fetch(", !/\bfetch\s*\(/.test(coreSrc));
assert("core has no resolveSupabaseAnonReadEnv", !/resolveSupabaseAnonReadEnv/.test(coreSrc));
assert(
  "features imports envelope utils",
  featuresSrc.includes("build-read-envelope-utils.mjs") &&
    featuresSrc.includes("createBuildReadFallbackEnvelope") &&
    featuresSrc.includes("createBuildReadSuccessEnvelope"),
);
assert("doc names SoT", docSrc.includes("build-read-envelope-utils.mjs"));

assert("buildReadRowCount array", buildReadRowCount([1, 2]) === 2);
assert("buildReadRowCount empty", buildReadRowCount([]) === 0);
assert("buildReadRowCount non-array", buildReadRowCount(null) === 0);
assert("buildReadRowCount undefined", buildReadRowCount(undefined) === 0);

// --- YouTube deep equality ---
deepEqual(
  "youtube success deepEqual",
  createBuildReadSuccessEnvelope({
    dataSourceKey: YT_DS,
    rowsKey: YT_ROWS,
    rows: [YT_EMBED_ROW],
    siteSlug: YT_SITE,
  }),
  YOUTUBE_ENVELOPE_FIXTURES.success,
);

deepEqual(
  "youtube empty deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: YT_DS,
    dataSource: "supabase-empty",
    fallbackReason: "no_published_site_embeds_rows",
    rowsKey: YT_ROWS,
    rows: [],
    siteSlug: YT_SITE,
  }),
  YOUTUBE_ENVELOPE_FIXTURES.empty,
);

deepEqual(
  "youtube not-configured deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: YT_DS,
    dataSource: "not-configured",
    fallbackReason: "site_embeds_table_migration_pending_G-9f",
    rowsKey: YT_ROWS,
    rows: [],
    siteSlug: YT_SITE,
  }),
  YOUTUBE_ENVELOPE_FIXTURES.notConfigured,
);

deepEqual(
  "youtube blocked deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: YT_DS,
    dataSource: "blocked",
    fallbackReason: "production_ref_stop",
    rowsKey: YT_ROWS,
    rows: [],
    siteSlug: YT_SITE,
  }),
  YOUTUBE_ENVELOPE_FIXTURES.blocked,
);

deepEqual(
  "youtube error deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: YT_DS,
    dataSource: "error",
    fallbackReason: "fetch failed",
    rowsKey: YT_ROWS,
    rows: [],
    siteSlug: YT_SITE,
  }),
  YOUTUBE_ENVELOPE_FIXTURES.error,
);

// --- About deep equality ---
deepEqual(
  "about success deepEqual",
  createBuildReadSuccessEnvelope({
    dataSourceKey: ABOUT_DS,
    rowsKey: ABOUT_ROWS,
    rows: [ABOUT_FIELD_ROW],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: ABOUT_PROFILE_LEDE, fieldCount: 1 },
  }),
  ABOUT_ENVELOPE_FIXTURES.success,
);

deepEqual(
  "about empty deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "supabase-empty",
    fallbackReason: "no_published_site_page_fields_rows",
    rowsKey: ABOUT_ROWS,
    rows: [],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 0 },
  }),
  ABOUT_ENVELOPE_FIXTURES.empty,
);

deepEqual(
  "about not-configured deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "not-configured",
    fallbackReason: "supabase_anon_read_env_missing",
    rowsKey: ABOUT_ROWS,
    rows: [],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 0 },
  }),
  ABOUT_ENVELOPE_FIXTURES.notConfigured,
);

deepEqual(
  "about blocked deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "blocked",
    fallbackReason: "production_ref_stop",
    rowsKey: ABOUT_ROWS,
    rows: [],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 0 },
  }),
  ABOUT_ENVELOPE_FIXTURES.blocked,
);

deepEqual(
  "about error deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "error",
    fallbackReason: "fetch failed",
    rowsKey: ABOUT_ROWS,
    rows: [],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 0 },
  }),
  ABOUT_ENVELOPE_FIXTURES.error,
);

deepEqual(
  "about empty value_text deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "supabase-empty",
    fallbackReason: "empty_profile_lede_value_text",
    rowsKey: ABOUT_ROWS,
    rows: [ABOUT_FIELD_ROW],
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 1 },
  }),
  ABOUT_ENVELOPE_FIXTURES.emptyValueText,
);

const multiFields = ABOUT_ENVELOPE_FIXTURES.multipleRows.fields;
deepEqual(
  "about multiple rows deepEqual",
  createBuildReadFallbackEnvelope({
    dataSourceKey: ABOUT_DS,
    dataSource: "error",
    fallbackReason: "multiple_profile_lede_rows",
    rowsKey: ABOUT_ROWS,
    rows: multiFields,
    siteSlug: ABOUT_SITE,
    extra: { profileLede: null, fieldCount: 2 },
  }),
  ABOUT_ENVELOPE_FIXTURES.multipleRows,
);

// finalizeSitePageFieldsLoadResult parity with fixtures
deepEqual(
  "finalize empty → fixture",
  finalizeSitePageFieldsLoadResult({
    fields: [],
    siteSlug: ABOUT_SITE,
    mapSitePageFieldRowToLedeDraft: () => ({ valueText: "" }),
  }),
  ABOUT_ENVELOPE_FIXTURES.empty,
);

deepEqual(
  "finalize success → fixture",
  finalizeSitePageFieldsLoadResult({
    fields: [ABOUT_FIELD_ROW],
    siteSlug: ABOUT_SITE,
    mapSitePageFieldRowToLedeDraft: () => ({ ...ABOUT_PROFILE_LEDE }),
  }),
  ABOUT_ENVELOPE_FIXTURES.success,
);

deepEqual(
  "finalize empty value_text → fixture",
  finalizeSitePageFieldsLoadResult({
    fields: [ABOUT_FIELD_ROW],
    siteSlug: ABOUT_SITE,
    mapSitePageFieldRowToLedeDraft: () => ({ valueText: "   " }),
  }),
  ABOUT_ENVELOPE_FIXTURES.emptyValueText,
);

deepEqual(
  "finalize multiple → fixture",
  finalizeSitePageFieldsLoadResult({
    fields: multiFields,
    siteSlug: ABOUT_SITE,
    mapSitePageFieldRowToLedeDraft: () => ({ valueText: "x" }),
  }),
  ABOUT_ENVELOPE_FIXTURES.multipleRows,
);

// unknown extras preserved · null vs undefined
const withExtra = createBuildReadEnvelope({
  dataSourceKey: YT_DS,
  dataSource: "error",
  fallbackReason: "x",
  rowsKey: YT_ROWS,
  rows: [],
  siteSlug: YT_SITE,
  extra: { ...EXTRA_METADATA_FIXTURE, keepNull: null },
});
assert("extra customMeta preserved", withExtra.customMeta === "keep-me");
assert("extra nested preserved", withExtra.nested?.a === 1);
assert("extra null preserved (not dropped)", withExtra.keepNull === null);
assert("no undefined key invented", !("keepUndefined" in withExtra));

const explicitRowCount = createBuildReadFallbackEnvelope({
  dataSourceKey: YT_DS,
  dataSource: "error",
  fallbackReason: "x",
  rowsKey: YT_ROWS,
  rows: [YT_EMBED_ROW],
  siteSlug: YT_SITE,
  rowCount: 0,
});
assert("explicit rowCount override", explicitRowCount.rowCount === 0);

assert(
  "youtube keys unchanged set",
  Object.keys(YOUTUBE_ENVELOPE_FIXTURES.success).sort().join(",") ===
    ["embedDataSource", "embeds", "fallbackReason", "rowCount", "siteSlug"].sort().join(","),
);
assert(
  "about keys unchanged set",
  Object.keys(ABOUT_ENVELOPE_FIXTURES.success).sort().join(",") ===
    [
      "fallbackReason",
      "fieldCount",
      "fields",
      "pageFieldDataSource",
      "profileLede",
      "rowCount",
      "siteSlug",
    ]
      .sort()
      .join(","),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-build-read-envelope-helper");
