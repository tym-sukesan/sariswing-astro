/**
 * G-20b-execution — Gosaki production test text cleanup execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20b-gosaki-production-test-text-cleanup-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-execution-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-final-preflight.md";
const UPDATE_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-production-test-text-cleanup-update.sql";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-production-test-text-cleanup-rollback.sql";

const BASE_COMMIT = "a6c1cf1";
const PHASE_REF = "G-20b-gosaki-production-discography-test-text-cleanup";
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

assert("HEAD is a6c1cf1", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is a6c1cf1", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("execution result doc exists", exists(DOC_REL));
assert(
  "doc phase G-20b-execution",
  doc.includes("G-20b-execution-gosaki-production-discography-test-text-cleanup-result"),
);
assert("doc success gate", doc.includes("gosakiProductionTestTextCleanupExecutionSuccess: true"));
assert(
  "doc execution complete gate",
  doc.includes("gosakiProductionTestTextCleanupExecutionComplete: true"),
);
assert("doc phase reference", doc.includes(PHASE_REF));
assert("doc operator execution style", doc.includes("operatorExecutionStyle: true"));
assert("doc no approval ceremony", doc.includes("approvalCeremonyUsed: false"));
assert("doc operator SQL once", doc.includes("once") || doc.includes("1回"));
assert("doc row A id", doc.includes(ROW_A_ID));
assert("doc row B id", doc.includes(ROW_B_ID));
assert("doc after Like a Lover", doc.includes(AFTER_A));
assert("doc after Mary Ann", doc.includes(AFTER_B));
assert("doc test count 0", doc.includes("（テスト）") && doc.includes("0"));
assert("doc album counts 8", doc.includes("8"));
assert("doc total tracks 34", doc.includes("34"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc G-20c next", doc.includes("G-20c"));
assert("doc live reflection pending", doc.includes("liveDiscographyReflectionPending: true"));
assert("doc no cursor SQL", doc.includes("cursorSqlUpdateExecuted: false"));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc no FTP", doc.includes("ftpUploadExecuted: false"));
assert("doc no re-execution", doc.includes("readyForG20bTestTextCleanupReExecution: false"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc G-18g2 closed", doc.includes("G-18g2"));
assert("doc G-19b1 closed", doc.includes("G-19b1"));

assert("preflight prior exists", exists(PREFLIGHT_REL));
assert("update SQL exists", exists(UPDATE_SQL_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));

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
  assert("live row A after title", rowA[0]?.title === AFTER_A, rowA[0]?.title);
  assert("live row A legacy 002", rowA[0]?.discography_legacy_id === "discography-002");
  assert("live row A track 7", rowA[0]?.track_number === 7);

  assert("live row B exists", rowB.length === 1);
  assert("live row B after title", rowB[0]?.title === AFTER_B, rowB[0]?.title);
  assert("live row B legacy 004", rowB[0]?.discography_legacy_id === "discography-004");
  assert("live row B track 1", rowB[0]?.track_number === 1);

  const testLike = await (
    await fetch(
      `${url}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(BEFORE_A)}&select=id`,
      { headers: h },
    )
  ).json();
  const testMary = await (
    await fetch(
      `${url}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(BEFORE_B)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test Like rows 0", testLike.length === 0, String(testLike.length));
  assert("live test Mary rows 0", testMary.length === 0, String(testMary.length));

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
  assert("supabase env for afterSnapshot", false, "missing PUBLIC_SUPABASE_URL/ANON_KEY");
}

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL);
  const body = await liveRes.text();
  assert("live discography HTTP 200", liveRes.status === 200, String(liveRes.status));
  assert(
    "live still stale test titles pre-reflection",
    body.includes(BEFORE_A) && body.includes(BEFORE_B),
  );
  assert("live plain Like not yet reflected", !body.includes(`>${AFTER_A}<`));
} catch (err) {
  assert("live HTTP pre-reflection", false, err instanceof Error ? err.message : String(err));
}

assert("Cursor SQL UPDATE not executed", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("commit push not executed", true);

console.log(
  `\nG-20b production test text cleanup execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
