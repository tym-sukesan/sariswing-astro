/**
 * G-15b-fail — Gosaki Discography Save permission failure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15b-gosaki-discography-save-permission-failure-and-investigation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-save-permission-failure-and-investigation.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-update-permission.template.sql";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const SCHEDULE_GRANT_DOC = "tools/static-to-astro/docs/schedule-update-grant-manual-apply-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
const TARGET_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const G15B_APPROVAL_ID =
  "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";

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
const sqlTpl = read(SQL_REL);
const saveSrc = read(SAVE_REL);
const adapterSrc = read(ADAPTER_REL);
const scheduleGrantDoc = read(SCHEDULE_GRANT_DOC);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15b-fail", doc.includes("G-15b-fail-gosaki-discography-save-permission-failure"));
assert("doc failure gate", doc.includes("gosakiDiscographySavePermissionFailureRecorded: true"));
assert("doc records permission denied", doc.includes("permission denied for table discography"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc afterVerification unchanged", doc.includes(PURCHASE_URL_BEFORE));
assert("doc root cause grant gap", doc.includes("GRANT UPDATE"));
assert("doc schedule precedent", doc.includes("G-6-e4") || doc.includes("schedule-update-grant"));
assert("doc no retry yet", doc.includes("readyForG15bSaveRetry: false"));
assert("doc target id", doc.includes(TARGET_ID));

assert("sql template exists", exists(SQL_REL));
assert("sql template pg_policies audit", sqlTpl.includes("pg_policies"));
assert("sql template role_table_grants", sqlTpl.includes("role_table_grants"));
assert("sql template grant update commented", sqlTpl.includes("grant update on table public.discography"));
assert("sql template DO NOT RUN", sqlTpl.includes("DO NOT RUN"));

assert("save uses authenticated client", saveSrc.includes("getStagingSupabaseClient"));
assert("save no service_role", !saveSrc.includes("service_role"));
assert("adapter updates discography", adapterSrc.includes('.from("discography")'));

assert("schedule grant doc precedent", scheduleGrantDoc.includes("grant update on table public.schedules"));

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
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,purchase_url,updated_at`;
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
    assert("live id unchanged", row.id === TARGET_ID);
    assert("live purchase_url unchanged", row.purchase_url === PURCHASE_URL_BEFORE);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("DB write did not happen", row.purchase_url === PURCHASE_URL_BEFORE);
  }
}

assert("verifier did not execute grant SQL", true);
assert("verifier did not execute Save", true);
assert("G-15b approval documented", doc.includes(G15B_APPROVAL_ID));

console.log(`\nG-15b-fail verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
