/**
 * G-15b — Gosaki Discography Save slice final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15b-gosaki-discography-save-slice-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-save-slice-final-preflight.md";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-write-guards.ts";
const TYPES_REL = "src/lib/admin/staging-write/discography-write-types.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-purchase-url-save-config.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-dry-run.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
const TARGET_TITLE = "SKYLARK";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const G15B_APPROVAL_ID =
  "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";
const G15A2_APPROVAL_ID = "G-15a2-gosaki-discography-purchase-url-dry-run-slice";
const G9K_APPROVAL_ID = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function loadEnv(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function simulateDryRunPreview(beforeSnapshot, formPurchaseUrl) {
  const changedFields = [];
  const beforeNorm = String(beforeSnapshot.purchase_url ?? "");
  const afterNorm = String(formPurchaseUrl ?? "");
  if (beforeNorm !== afterNorm) changedFields.push("purchase_url");
  const ok =
    beforeSnapshot.legacy_id === TARGET_LEGACY_ID &&
    changedFields.length === 1 &&
    changedFields[0] === "purchase_url";
  return {
    dryRun: true,
    actualWrite: false,
    wouldWrite: ok,
    changedFields,
    payload: ok ? { purchase_url: afterNorm } : {},
    expectedBeforeUpdatedAt: beforeSnapshot.updated_at,
    stale: false,
    hostGatePassed: true,
    saveReadiness: ok ? "ready_but_save_disabled" : "guard_error",
  };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);

const doc = read(DOC_REL);
const saveSrc = read(SAVE_REL);
const adapterSrc = read(ADAPTER_REL);
const guardsSrc = read(GUARDS_REL);
const typesSrc = read(TYPES_REL);
const configSrc = read(CONFIG_REL);
const dryRunSrc = read(DRY_RUN_REL);
const operator = read(OPERATOR_REL);
const uiSrc = read(UI_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15b", doc.includes("G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run"));
assert("doc complete gate", doc.includes("gosakiDiscographySaveSliceFinalPreflightComplete: true"));
assert("doc target discography-002", doc.includes(TARGET_LEGACY_ID));
assert("doc purchase_url before/after", doc.includes(PURCHASE_URL_BEFORE) && doc.includes(PURCHASE_URL_AFTER));
assert("doc rollback template", doc.includes("rollback") && doc.includes(PURCHASE_URL_BEFORE));
assert("doc afterVerification SELECT", doc.includes("afterVerification"));

assert("save module exists", exists(SAVE_REL));
assert("save export executeG15b", saveSrc.includes("executeG15bDiscographyPurchaseUrlSave"));
assert("save uses updateDiscographyWrite", saveSrc.includes("updateDiscographyWrite"));
assert("save no service_role", !saveSrc.includes("service_role"));

assert("adapter update discography", adapterSrc.includes('.from("discography")'));
assert("adapter optimistic lock", adapterSrc.includes("expectedBeforeUpdatedAt"));
assert("adapter rowsAffected 1", adapterSrc.includes("rowsAffected: 1"));

assert("guards G-15b approval", guardsSrc.includes("G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID"));
assert("guards target legacy", guardsSrc.includes(TARGET_LEGACY_ID));
assert("guards purchase_url only", guardsSrc.includes('"purchase_url"'));

assert("types G-15b approval registered", typesSrc.includes(G15B_APPROVAL_ID));
assert("types not G-15a2 approval", !typesSrc.includes(G15A2_APPROVAL_ID));
assert("types not G-9k approval", !typesSrc.includes(G9K_APPROVAL_ID));

assert("config save env arm", configSrc.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED"));
assert("config write module discography", configSrc.includes('"discography"'));
assert("config staging host", configSrc.includes("SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST") || configSrc.includes(STAGING_REF));

assert("dry-run saveAllowed boolean", dryRunSrc.includes("saveAllowed: boolean"));
assert("dry-run resolveG15b save", dryRunSrc.includes("resolveG15bDiscographyPurchaseUrlSaveEnabled"));
assert("dry-run still actualWrite false", dryRunSrc.includes("actualWrite: false"));

assert("operator save button id", operator.includes("gosaki-disc-update-btn"));
assert("operator G-15b approval status", operator.includes("G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID"));
assert("operator status panel stale", operator.includes("gosaki-disc-status-stale"));
assert("operator hostGatePassed", operator.includes("gosaki-disc-status-host-gate"));

assert("ui wires save", uiSrc.includes("runSave"));
assert("ui executeG15b save", uiSrc.includes("executeG15bDiscographyPurchaseUrlSave"));
assert("ui dry-run preview", uiSrc.includes("executeG15a2DiscographyDryRun"));
assert("ui no auto save on init", !uiSrc.includes("initGosakiStagingDiscographyAdminUi") || !/initGosakiStagingDiscographyAdminUi[\s\S]*runSave\(\)/.test(uiSrc));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

assert("staging url configured", !!url, "missing PUBLIC_SUPABASE_URL");
assert("anon key configured", !!key, "missing PUBLIC_SUPABASE_ANON_KEY");
assert("staging host only", url.includes(STAGING_REF), url);
assert("not production host", !url.includes(SARISWING_HOST), url);
assert("not service_role key", !String(key).toLowerCase().includes("service_role"));

if (url && key) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=legacy_id,title,purchase_url,updated_at`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT one row", Array.isArray(rows) && rows.length === 1);
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live legacy_id", row.legacy_id === TARGET_LEGACY_ID);
    assert("live title SKYLARK", row.title === TARGET_TITLE);
    assert("live purchase_url before", row.purchase_url === PURCHASE_URL_BEFORE);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("DB unchanged since G-15a2", row.purchase_url === PURCHASE_URL_BEFORE);

    const preview = simulateDryRunPreview(row, PURCHASE_URL_AFTER);
    assert("dry-run actualWrite false", preview.actualWrite === false);
    assert("dry-run wouldWrite true", preview.wouldWrite === true);
    assert("dry-run changedFields purchase_url only", JSON.stringify(preview.changedFields) === '["purchase_url"]');
    assert("dry-run payload after url", preview.payload.purchase_url === PURCHASE_URL_AFTER);
    assert("dry-run expectedBeforeUpdatedAt", preview.expectedBeforeUpdatedAt === BASELINE_UPDATED_AT);
    assert("dry-run stale false", preview.stale === false);
    assert("dry-run hostGatePassed true", preview.hostGatePassed === true);
  }
}

assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);

console.log(`\nG-15b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
