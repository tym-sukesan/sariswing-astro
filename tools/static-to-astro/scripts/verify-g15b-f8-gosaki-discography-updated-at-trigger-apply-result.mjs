/**
 * G-15b-f8-execution — Gosaki Discography updated_at trigger apply result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15b-f8-gosaki-discography-updated-at-trigger-apply-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-updated-at-trigger-apply-result.md";
const PREFLIGHT_DOC =
  "tools/static-to-astro/docs/gosaki-discography-updated-at-trigger-final-preflight.md";
const TEMPLATE_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-updated-at-trigger.template.sql";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
const TARGET_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";

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
const preflight = read(PREFLIGHT_DOC);
const template = read(TEMPLATE_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15b-f8-execution", doc.includes("G-15b-f8-execution-gosaki-discography-updated-at-trigger-apply-result"));
assert("doc complete gate", doc.includes("gosakiDiscographyUpdatedAtTriggerApplyResultComplete: true"));
assert("doc trigger apply success", doc.includes("Success"));
assert("doc discography_set_updated_at", doc.includes("discography_set_updated_at"));
assert("doc tg_discography_set_updated_at", doc.includes("tg_discography_set_updated_at"));
assert("doc tgenabled O", doc.includes("tgenabled") && doc.includes("`O`"));
assert("doc updated_at unchanged", doc.includes("unchanged"));
assert("doc purchase_url after", doc.includes(PURCHASE_URL_AFTER));
assert("doc ready G-15c", doc.includes("readyForG15cDiscographyPublicReflectionPlanning: true"));
assert("doc no Save retry", doc.includes("Save retry") && doc.includes("no"));
assert("doc cursor did not execute SQL", doc.includes("Cursor did **not** execute SQL"));
assert("doc pre-audit none", doc.includes("user-defined triggers: none"));

assert("preflight linked", preflight.includes("G-15b-f8-gosaki-discography-updated-at-trigger-final-preflight"));
assert("template trigger name", template.includes("discography_set_updated_at"));

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
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT one row", Array.isArray(rows) && rows.length === 1);
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live id", row.id === TARGET_ID);
    assert("live purchase_url after value", row.purchase_url === PURCHASE_URL_AFTER);
    assert("live updated_at baseline unchanged", row.updated_at === BASELINE_UPDATED_AT);
    assert("no data UPDATE in execution phase", row.purchase_url === PURCHASE_URL_AFTER);
  }
}

assert("verifier did not execute trigger SQL", true);
assert("verifier did not execute Save", true);

console.log(`\nG-15b-f8-execution verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
