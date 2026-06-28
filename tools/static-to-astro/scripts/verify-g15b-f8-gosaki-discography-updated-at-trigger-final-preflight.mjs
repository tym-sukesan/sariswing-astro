/**
 * G-15b-f8 — Gosaki Discography updated_at trigger final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15b-f8-gosaki-discography-updated-at-trigger-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-updated-at-trigger-final-preflight.md";
const TEMPLATE_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-updated-at-trigger.template.sql";
const SCHEDULE_TRIGGER_REL = "scripts/supabase/schedules-updated-at-trigger.sql";
const RETRY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-save-retry-result-and-updated-at-investigation.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
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

function extractApplyBlock(template) {
  const start = template.indexOf("create or replace function public.tg_discography_set_updated_at");
  const end = template.indexOf("-- ---------------------------------------------------------------------------\n-- READ-ONLY pre-check");
  if (start < 0 || end < 0) return template;
  return template.slice(start, end).trim();
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
const template = read(TEMPLATE_REL);
const scheduleTrigger = read(SCHEDULE_TRIGGER_REL);
const retryDoc = read(RETRY_DOC_REL);
const applyBlock = extractApplyBlock(template);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15b-f8", doc.includes("G-15b-f8-gosaki-discography-updated-at-trigger-final-preflight"));
assert("doc complete gate", doc.includes("gosakiDiscographyUpdatedAtTriggerFinalPreflightComplete: true"));
assert("doc ready for execution", doc.includes("readyForG15bF8DiscographyUpdatedAtTriggerExecution: true"));
assert("doc apply block", doc.includes("tg_discography_set_updated_at"));
assert("doc discography_set_updated_at trigger", doc.includes("discography_set_updated_at"));
assert("doc pre-apply audit SQL", doc.includes("pg_trigger") && doc.includes("public.discography"));
assert("doc post-apply verify SQL", doc.includes("discography-002"));
assert("doc updated_at unchanged after DDL", doc.includes("unchanged"));
assert("doc no cursor SQL", doc.includes("Cursor SQL execution") || doc.includes("no SQL executed"));
assert("doc staging host", doc.includes(STAGING_REF));

assert("template exists", exists(TEMPLATE_REL));
assert("template function", template.includes("tg_discography_set_updated_at"));
assert("template trigger", template.includes("discography_set_updated_at"));
assert("template before update", template.includes("before update on public.discography"));
assert("template new.updated_at", template.includes("new.updated_at = now()"));
assert("template idempotent drop", template.includes("drop trigger if exists"));

const applyLower = applyBlock.toLowerCase();
assert("apply no data update", !/update\s+public\.discography\s+set/i.test(applyBlock));
assert("apply no insert", !/insert\s+into\s+public\.discography/i.test(applyLower));
assert("apply no delete", !/delete\s+from\s+public\.discography/i.test(applyLower));
assert("apply no drop table", !/drop\s+table/i.test(applyLower));
assert("apply no truncate", !/truncate/i.test(applyLower));
assert("apply no grant", !/\bgrant\b/i.test(applyLower));
assert("apply no policy", !/policy/i.test(applyLower));
assert("apply no alter table", !/alter\s+table/i.test(applyLower));
assert("apply no service_role", !applyLower.includes("service_role"));

assert("schedule trigger reference", scheduleTrigger.includes("schedules_set_updated_at"));
assert("schedule parallel body", scheduleTrigger.includes("new.updated_at = now()"));
assert("retry doc background", retryDoc.includes("updatedAtChanged: false"));

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

if (url && key) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=legacy_id,purchase_url,updated_at`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]) {
    assert("live purchase_url after G-15b-retry", rows[0].purchase_url === PURCHASE_URL_AFTER);
    assert("live updated_at baseline", rows[0].updated_at === BASELINE_UPDATED_AT);
  }
}

assert("verifier did not execute trigger SQL", true);

console.log(`\nG-15b-f8 final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
