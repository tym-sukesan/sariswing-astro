/**
 * About atomic Save RPC + public build overlay.
 * No SQL apply, Edge deploy, or network.
 *
 * Run: npm run verify:gosaki-about-atomic-save-and-public-overlay
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABOUT_BAND_STABLE_IDS,
  evaluateAboutFieldsAtomicSave,
} from "./lib/cms-core-v2-about-supabase-contract.mjs";
import {
  applySitePageFieldsLedeToAboutConfig,
  applySitePageFieldsToAboutConfig,
  loadGosakiAboutContentConfig,
  readAboutPublicOverlayFields,
  BLOCK_PROFILE_ID,
  BLOCK_BANDS_ID,
} from "./lib/gosaki-about-content.mjs";
import { finalizeSitePageFieldsAllowlistLoadResult } from "./lib/site-cms-features.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const sql = read(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-about-page-fields-save-rpc.template.sql",
);
const rollback = read(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-about-page-fields-save-rpc-rollback.template.sql",
);
const handler = read("supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts");
const mirror = read(
  "tools/static-to-astro/scripts/edge-functions/gosaki-about-supabase-save-dry-run/handler.ts",
);
const workflow = read(".github/workflows/gosaki-piano-production-public-dist.yml");

function sqlStatements(text) {
  return text
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
}

const sqlBody = sqlStatements(sql);
const rollbackBody = sqlStatements(rollback);

const writeAt = sql.indexOf("-- ATOMIC WRITES");
assert("sql validates before writes", writeAt > 0 && sql.indexOf("field_not_allowed") < writeAt);
assert("sql lock check before writes", sql.indexOf("stale_optimistic_lock") < writeAt);
assert("sql update is inside atomic section", sql.indexOf("UPDATE public.site_page_fields") > writeAt);
assert("sql insert is inside atomic section", sql.indexOf("INSERT INTO public.site_page_fields") > writeAt);
assert("sql raise rolls back a mismatched write", sql.includes("RAISE EXCEPTION 'about_fields_save:stale_optimistic_lock'"));
assert("sql is one transaction", sql.includes("BEGIN;") && sql.includes("COMMIT;"));
assert("sql invoker", sql.includes("SECURITY INVOKER"));
assert("sql can_write_site", sql.includes("public.can_write_site"));
assert("sql gosaki-piano", sql.includes("v_site_slug <> 'gosaki-piano'"));
assert("sql page about", sql.includes("v_page_key <> 'about'"));
assert("sql no service_role grant", !/GRANT[^;]*service_role/i.test(sqlBody));
assert("sql revokes service_role execute", sql.includes("REVOKE ALL ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) FROM service_role"));
assert("sql stays invoker", sqlBody.includes("SECURITY INVOKER") && !/SECURITY DEFINER/i.test(sqlBody));
assert(
  "sql grants table insert and update to authenticated",
  /GRANT INSERT, UPDATE ON TABLE public\.site_page_fields TO authenticated;/i.test(sqlBody),
);
assert(
  "sql does not grant insert or update to anon",
  !/GRANT[^;]*\b(INSERT|UPDATE)\b[^;]*TO anon/i.test(sqlBody),
);
assert("sql does not grant delete", !/GRANT[^;]*\bDELETE\b/i.test(sqlBody));
assert("sql keeps rls dependency", sql.includes("public.can_write_site"));
assert("rollback drops function", rollback.includes("DROP FUNCTION IF EXISTS public.gosaki_about_page_fields_save"));
assert(
  "rollback revokes only table insert and update",
  /REVOKE INSERT, UPDATE ON TABLE public\.site_page_fields FROM authenticated;/i.test(rollbackBody),
);
assert("rollback does not revoke select", !/REVOKE[^;]*\bSELECT\b/i.test(rollbackBody));
assert("rollback does not revoke from anon", !/REVOKE[^;]*\banon\b/i.test(rollbackBody));
assert("rollback does not drop policies", !/DROP POLICY/i.test(rollbackBody));
for (const id of ABOUT_BAND_STABLE_IDS) {
  assert(`sql stable id ${id}`, sql.includes(`'${id}'`));
  assert(`handler stable id ${id}`, handler.includes(`"${id}"`));
}

const existing = {
  "profile.heading": { valueText: "About", updatedAt: "2026-10-09T00:00:00.000Z" },
  "profile.body": { valueText: "body", updatedAt: "2026-10-09T00:00:00.000Z" },
  "profile.image_alt": { valueText: "alt", updatedAt: "2026-10-09T00:00:00.000Z" },
  "profile.lede": { valueText: "lede", updatedAt: "2026-10-09T00:00:00.000Z" },
  "bands.gosakirika-trio.name": { valueText: "Trio", updatedAt: "2026-10-09T00:00:00.000Z" },
};
const okPlan = evaluateAboutFieldsAtomicSave(
  [
    { fieldKey: "profile.heading", nextValueText: "About CMS", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "profile.body", nextValueText: "full body", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "profile.image_alt", nextValueText: "", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "profile.lede", nextValueText: "full", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "bands.gosakirika-trio.name", nextValueText: "Trio 2", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
  ],
  existing,
);
assert("atomic all-success", okPlan.ok === true && okPlan.writes.length === 5);
assert("empty alt allowed", okPlan.writes.find((row) => row.fieldKey === "profile.image_alt")?.nextValueText === "");

const lockFail = evaluateAboutFieldsAtomicSave(
  [
    { fieldKey: "profile.heading", nextValueText: "About CMS", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "profile.body", nextValueText: "full body", expectedBeforeUpdatedAt: "stale" },
  ],
  existing,
);
assert("lock mismatch rejects the whole set", lockFail.ok === false && lockFail.error === "stale_optimistic_lock");
assert("lock mismatch has no writes", lockFail.writes.length === 0);

const invalid = evaluateAboutFieldsAtomicSave(
  [
    { fieldKey: "profile.heading", nextValueText: "About", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" },
    { fieldKey: "bands.not-a-band.name", nextValueText: "Nope", expectedBeforeUpdatedAt: null },
  ],
  existing,
);
assert("invalid field rejects the whole set", invalid.ok === false && invalid.error === "field_not_allowed");
assert("invalid field has no writes", invalid.writes.length === 0);

const emptyHeading = evaluateAboutFieldsAtomicSave(
  [{ fieldKey: "profile.heading", nextValueText: "  ", expectedBeforeUpdatedAt: "2026-10-09T00:00:00.000Z" }],
  existing,
);
assert("non-alt empty rejected", emptyHeading.ok === false && emptyHeading.writes.length === 0);

const multiFn = handler.slice(handler.indexOf("async function handleAboutSupabaseFieldSet"));
assert("multi save calls one rpc", multiFn.includes('rpc("gosaki_about_page_fields_save"'));
assert("multi save has no per-field update", !multiFn.includes(".update("));
assert("multi save has no per-field insert", !multiFn.includes(".insert("));
assert("handler mirror byte match", handler === mirror);
assert("handler service role disconnected", handler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("handler has no service role key", !handler.includes("SUPABASE_SERVICE_ROLE_KEY"));
assert("handler keeps can_write_site", handler.includes("can_write_site"));

const loaded = loadGosakiAboutContentConfig(TOOL_ROOT);
const profile = loaded.config.blocks.find((block) => block.id === BLOCK_PROFILE_ID);
const bands = loaded.config.blocks.find((block) => block.id === BLOCK_BANDS_ID);
const currentFields = readAboutPublicOverlayFields(profile.html, bands.html);
for (const key of [
  "profile.heading",
  "profile.body",
  "profile.image_alt",
  "profile.lede",
]) {
  assert(`public readable ${key}`, Object.prototype.hasOwnProperty.call(currentFields, key));
}
for (const id of ABOUT_BAND_STABLE_IDS) {
  for (const part of ["name", "body", "image_alt"]) {
    assert(`public readable bands.${id}.${part}`, Object.prototype.hasOwnProperty.call(currentFields, `bands.${id}.${part}`));
  }
}
const parity = applySitePageFieldsToAboutConfig(loaded.config, {
  pageFieldDataSource: "supabase",
  aboutFields: currentFields,
  profileLede: { valueText: currentFields["profile.lede"] },
  fieldCount: Object.keys(currentFields).length,
});
const parityProfile = parity.config.blocks.find((block) => block.id === BLOCK_PROFILE_ID).html;
const parityBands = parity.config.blocks.find((block) => block.id === BLOCK_BANDS_ID).html;
assert("current html parity outcome", parity.overlayOutcome === "noop_equal");
assert("current profile html unchanged", parityProfile === profile.html);
assert("current bands html unchanged", parityBands === bands.html);

const changed = applySitePageFieldsToAboutConfig(loaded.config, {
  pageFieldDataSource: "supabase",
  aboutFields: { ...currentFields, "profile.heading": "About CMS", "profile.image_alt": "" },
  profileLede: { valueText: currentFields["profile.lede"] },
  fieldCount: Object.keys(currentFields).length,
});
const changedProfile = changed.config.blocks.find((block) => block.id === BLOCK_PROFILE_ID).html;
assert("heading overlay applied", changed.overlayOutcome === "applied" && changedProfile.includes("About CMS"));
assert("empty alt overlay keeps src", changedProfile.includes('alt=""') && changedProfile.includes("about-portrait-250428-1002.jpg"));
assert("bands untouched when only profile fields change", changed.config.blocks.find((block) => block.id === BLOCK_BANDS_ID).html === bands.html);

const ledeOnly = applySitePageFieldsLedeToAboutConfig(
  { blocks: [{ id: BLOCK_PROFILE_ID, html: "<p>first</p><p>second</p>" }] },
  { pageFieldDataSource: "supabase", profileLede: { valueText: "db lede" }, fieldCount: 1 },
);
assert(
  "existing lede still replaces first paragraph only",
  ledeOnly.overlayOutcome === "applied" &&
    ledeOnly.config.blocks[0].html.includes("db lede") &&
    ledeOnly.config.blocks[0].html.includes("second"),
);
const delegated = applySitePageFieldsToAboutConfig(
  { blocks: [{ id: BLOCK_PROFILE_ID, html: "<p>first</p><p>second</p>" }] },
  { pageFieldDataSource: "supabase", profileLede: { valueText: "db lede" }, aboutFields: { "profile.lede": "db lede" }, fieldCount: 1 },
);
assert("lede-only bundle delegates", delegated.config.blocks[0].html === ledeOnly.config.blocks[0].html);

const missing = finalizeSitePageFieldsAllowlistLoadResult({
  fields: [],
  siteSlug: "gosaki-piano",
  mapSitePageFieldRowToLedeDraft: (row) => ({
    fieldKey: String(row.field_key ?? ""),
    valueText: String(row.value_text ?? ""),
    updatedAt: null,
  }),
});
assert("missing db falls back", missing.pageFieldDataSource === "supabase-empty" && missing.aboutFields == null);
const fallback = applySitePageFieldsToAboutConfig(loaded.config, missing);
assert("fallback keeps json config", fallback.config === loaded.config && fallback.overlayOutcome === "failed");

assert(
  "workflow build read stays unset",
  workflow.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ") &&
    !/CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ:\s*"true"/.test(workflow),
);

const changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const touched = `${changedFiles}\n${untracked}`;
assert(
  "sariswing deploy untouched",
  !/(^|\n)\.github\/workflows\/deploy\.yml(\n|$)/.test(touched) && !/src\/pages\/admin\//.test(touched),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
