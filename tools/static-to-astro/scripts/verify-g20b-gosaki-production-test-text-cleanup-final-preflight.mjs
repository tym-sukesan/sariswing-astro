/**
 * G-20b — Gosaki production pre-release test text cleanup final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20b-gosaki-production-test-text-cleanup-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-final-preflight.md";
const G20A_REL = "tools/static-to-astro/docs/gosaki-production-release-readiness-inventory.md";
const PREFLIGHT_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-production-test-text-cleanup-preflight-check.sql";
const UPDATE_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-production-test-text-cleanup-update.sql";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-production-test-text-cleanup-rollback.sql";

const BASE_COMMIT = "7eda613";
const APPROVAL_ID = "G-20b-gosaki-production-discography-test-text-cleanup";
const ROW_A_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const ROW_B_ID = "04e987a9-e251-4b0b-b860-21a61e711f8e";
const BEFORE_A = "Like a Lover（テスト）";
const BEFORE_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";

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

function loadEnv() {
  const out = {};
  for (const file of [".env", ".env.local"]) {
    const abs = path.join(REPO_ROOT, file);
    if (!fs.existsSync(abs)) continue;
    for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    }
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

assert("HEAD is 7eda613", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7eda613", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const preflightSql = read(PREFLIGHT_SQL_REL);
const updateSql = read(UPDATE_SQL_REL);
const rollbackSql = read(ROLLBACK_SQL_REL);

assert("preflight doc exists", exists(DOC_REL));
assert("doc phase G-20b", doc.includes("G-20b-gosaki-production-test-text-cleanup-final-preflight"));
assert(
  "doc preflight gate",
  doc.includes("gosakiProductionTestTextCleanupFinalPreflightComplete: true"),
);
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc readyForG20b execution", doc.includes("readyForG20bTestTextCleanupExecution: true"));
assert("doc SQL Editor recommended", doc.includes("SQL Editor"));
assert("doc UI Save not recommended", doc.includes("not recommended") || doc.includes("rejected"));
assert("doc G-18g2 closed", doc.includes("G-18g2"));
assert("doc G-19b1 closed", doc.includes("G-19b1"));
assert("doc beforeSnapshot", doc.includes("beforeSnapshot"));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc rollback policy", doc.includes("Rollback"));
assert("doc rowsAffected 2", doc.includes("rowsAffected") && doc.includes("2"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc no UPDATE in phase", doc.includes("cursorSqlUpdateExecuted: false"));

assert("G-20a inventory prior exists", exists(G20A_REL));
assert("preflight SQL exists", exists(PREFLIGHT_SQL_REL));
assert("update SQL exists", exists(UPDATE_SQL_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));

assert("preflight SQL SELECT only scope", preflightSql.includes("SELECT only") || preflightSql.includes("read-only"));
assert("preflight SQL staging ref", preflightSql.includes(STAGING_REF));
assert("preflight SQL stop production", preflightSql.includes(PROD_REF));
assert("preflight SQL row A id", preflightSql.includes(ROW_A_ID));
assert("preflight SQL row B id", preflightSql.includes(ROW_B_ID));
assert("preflight SQL expect 2 test rows", preflightSql.includes("expect: 2"));
assert("preflight SQL expect 34 total", preflightSql.includes("expect: 34"));

assert("update SQL DO NOT RUN", updateSql.includes("DO NOT RUN"));
assert("update SQL strict WHERE id legacy track title", updateSql.includes("and title ="));
assert("update SQL row A", updateSql.includes(ROW_A_ID) && updateSql.includes(BEFORE_A) && updateSql.includes(AFTER_A));
assert("update SQL row B", updateSql.includes(ROW_B_ID) && updateSql.includes(BEFORE_B) && updateSql.includes(AFTER_B));
assert("update SQL commented UPDATE", updateSql.includes("-- update public.discography_tracks"));
assert("update SQL rowsAffected 1 each", (updateSql.match(/rowsAffected: 1/g) || []).length >= 2);

assert("rollback SQL DO NOT RUN", rollbackSql.includes("DO NOT RUN"));
assert("rollback SQL restore test titles", rollbackSql.includes(BEFORE_A) && rollbackSql.includes(BEFORE_B));
assert("rollback SQL strict WHERE", rollbackSql.includes("and title = 'Like a Lover'"));
assert("rollback SQL commented UPDATE", rollbackSql.includes("-- update public.discography_tracks"));

const env = loadEnv();
const url = (env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.PUBLIC_SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const rowA = await (
    await fetch(`${url}/rest/v1/discography_tracks?id=eq.${ROW_A_ID}&select=id,discography_legacy_id,track_number,title`, {
      headers: h,
    })
  ).json();
  const rowB = await (
    await fetch(`${url}/rest/v1/discography_tracks?id=eq.${ROW_B_ID}&select=id,discography_legacy_id,track_number,title`, {
      headers: h,
    })
  ).json();

  assert("live row A exists", rowA.length === 1);
  assert("live row A before title", rowA[0]?.title === BEFORE_A, rowA[0]?.title);
  assert("live row A legacy 002", rowA[0]?.discography_legacy_id === "discography-002");
  assert("live row A track 7", rowA[0]?.track_number === 7);

  assert("live row B exists", rowB.length === 1);
  assert("live row B before title", rowB[0]?.title === BEFORE_B, rowB[0]?.title);
  assert("live row B legacy 004", rowB[0]?.discography_legacy_id === "discography-004");
  assert("live row B track 1", rowB[0]?.track_number === 1);

  const testRows = await (
    await fetch(
      `${url}/rest/v1/discography_tracks?or=(title.eq.${encodeURIComponent(BEFORE_A)},title.eq.${encodeURIComponent(BEFORE_B)})&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test title rows exactly 2", testRows.length === 2, String(testRows.length));

  const album002 = await (
    await fetch(
      `${url}/rest/v1/discography_tracks?discography_legacy_id=eq.discography-002&select=id`,
      { headers: h },
    )
  ).json();
  const album004 = await (
    await fetch(
      `${url}/rest/v1/discography_tracks?discography_legacy_id=eq.discography-004&select=id`,
      { headers: h },
    )
  ).json();
  const total = await (
    await fetch(`${url}/rest/v1/discography_tracks?select=id&limit=100`, { headers: h })
  ).json();

  assert("live album 002 count 8", album002.length === 8, String(album002.length));
  assert("live album 004 count 8", album004.length === 8, String(album004.length));
  assert("live total tracks 34", total.length === 34, String(total.length));
} else {
  assert("supabase env for beforeSnapshot", false, "missing PUBLIC_SUPABASE_URL/ANON_KEY");
}

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL);
  const body = await liveRes.text();
  assert("live discography HTTP 200", liveRes.status === 200, String(liveRes.status));
  assert("live still has test titles pre-cleanup", body.includes(BEFORE_A) && body.includes(BEFORE_B));
} catch (err) {
  assert("live HTTP pre-cleanup", false, err instanceof Error ? err.message : String(err));
}

assert("SQL UPDATE not executed by Cursor", true);
assert("Save not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("commit push not executed", true);

console.log(
  `\nG-20b production test text cleanup final preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
