/**
 * G-15b-retry — Gosaki Discography Save retry + updated_at investigation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15b-gosaki-discography-save-retry-result-and-updated-at-investigation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-save-retry-result-and-updated-at-investigation.md";
const TRIGGER_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-updated-at-trigger.template.sql";
const SCHEDULE_TRIGGER_REL = "scripts/supabase/schedules-updated-at-trigger.sql";
const GRANT_DOC = "tools/static-to-astro/docs/gosaki-discography-update-grant-apply-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
const TARGET_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
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
const triggerTpl = read(TRIGGER_REL);
const scheduleTrigger = read(SCHEDULE_TRIGGER_REL);
const grantDoc = read(GRANT_DOC);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15b-retry", doc.includes("G-15b-retry-gosaki-discography-save-retry-result"));
assert("doc complete gate", doc.includes("gosakiDiscographySaveRetryResultComplete: true"));
assert("doc save succeeded", doc.includes("保存しました"));
assert("doc purchase_url after", doc.includes(PURCHASE_URL_AFTER));
assert("doc purchase_url before", doc.includes(PURCHASE_URL_BEFORE));
assert("doc updated_at unchanged", doc.includes("updatedAtChanged: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc no re-save", doc.includes("readyForG15bSaveReExecution: false"));
assert("doc trigger gap", doc.includes("discography_set_updated_at") || doc.includes("no BEFORE UPDATE trigger"));
assert("doc schedules comparison", doc.includes("schedules_set_updated_at"));
assert("doc G-15b-f8 next", doc.includes("G-15b-f8"));
assert("doc approval id", doc.includes(G15B_APPROVAL_ID));

assert("trigger template exists", exists(TRIGGER_REL));
assert("trigger template DO NOT RUN", triggerTpl.includes("DO NOT RUN"));
assert("trigger discography_set_updated_at", triggerTpl.includes("discography_set_updated_at"));
assert("trigger tg_discography_set_updated_at", triggerTpl.includes("tg_discography_set_updated_at"));
assert("schedule trigger reference", scheduleTrigger.includes("schedules_set_updated_at"));

assert("grant doc prerequisite", grantDoc.includes("readyForG15bRetrySaveExecution: true"));

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
assert("staging host only", url.includes(STAGING_REF), "host");
assert("not production host", !url.includes(SARISWING_HOST), "production");
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
    assert("live id", row.id === TARGET_ID);
    assert("live purchase_url after value", row.purchase_url === PURCHASE_URL_AFTER);
    assert("live purchase_url not before", row.purchase_url !== PURCHASE_URL_BEFORE);
    assert("live updated_at unchanged", row.updated_at === BASELINE_UPDATED_AT);
    assert("save retry updated purchase_url", row.purchase_url === PURCHASE_URL_AFTER);
  }
}

assert("verifier did not execute Save", true);
assert("verifier did not execute trigger SQL", true);

console.log(`\nG-15b-retry verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
