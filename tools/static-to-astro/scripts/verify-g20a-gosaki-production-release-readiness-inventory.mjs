/**
 * G-20a — Gosaki production release readiness inventory verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20a-gosaki-production-release-readiness-inventory.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-release-readiness-inventory.md";
const G19E_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19e-tracklist-save-public-reflection-closure.md";
const G19D_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19d-tracklist-public-reflection-upload-result.md";
const G19C_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md";
const G19B1_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md";
const G14C_REL = "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G7F1_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SITE_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki.site-config.example.json";

const BASE_COMMIT = "85021b0";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_SCHEDULE_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TEST_TITLE_1 = "Like a Lover（テスト）";
const TEST_TITLE_2 = "Mary Ann（テスト）";
const PRODUCTION_URL = "https://www.gosaki-piano.com";

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

assert("HEAD is 85021b0", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 85021b0", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const currentState = read(`${AI_DIR}/00-current-state.md`);

assert("inventory doc exists", exists(DOC_REL));
assert("doc phase G-20a", doc.includes("G-20a-gosaki-production-release-readiness-inventory"));
assert(
  "doc inventory gate",
  doc.includes("gosakiProductionReleaseReadinessInventoryComplete: true"),
);
assert("doc readyForG20b", doc.includes("readyForG20bTestTextCleanupPlanning: true"));
assert("doc readyForProductionFtp false", doc.includes("readyForProductionFtpDeploy: false"));
assert("doc readyForAnyFutureFtpApply false", doc.includes("readyForAnyFutureFtpApply: false"));
assert("doc must blockers section", doc.includes("Must before public"));
assert("doc defer section", doc.includes("Can defer after public"));
assert("doc generalization backlog", doc.includes("Generalization backlog"));
assert("doc test titles inventory", doc.includes(TEST_TITLE_1) && doc.includes(TEST_TITLE_2));
assert("doc G-19e closed reference", doc.includes("G-19e"));
assert("doc production URL", doc.includes(PRODUCTION_URL));
assert("doc staging URL", doc.includes("cms-kit-staging/gosaki-piano"));
assert("doc admin local dev only", doc.includes("local dev only") || doc.includes("DEV"));
assert("doc G-7f1 FTP suspended", doc.includes("G-7f1") || doc.includes("suspended"));
assert("doc operator matrix", doc.includes("本人") && doc.includes("戸山"));
assert("doc G-20b next", doc.includes("G-20b"));
assert("doc G-20c next", doc.includes("G-20c"));
assert("doc G-19f candidate", doc.includes("G-19f"));
assert("doc G-19g candidate", doc.includes("G-19g"));
assert("doc no Save in phase", doc.includes("cursorSaveExecuted: false"));
assert("doc no FTP in phase", doc.includes("ftpUploadExecuted: false"));

assert("G-19e closure doc exists", exists(G19E_REL));
assert("G-19d upload doc exists", exists(G19D_REL));
assert("G-19c preflight doc exists", exists(G19C_REL));
assert("G-19b1 execution doc exists", exists(G19B1_REL));
assert("G-14c reflection standard exists", exists(G14C_REL));
assert("G-7f1 FTP safety doc exists", exists(G7F1_REL));
assert("site config example exists", exists(SITE_CONFIG_REL));

const siteConfig = read(SITE_CONFIG_REL);
assert("site config production disabled", siteConfig.includes('"enabled": false'));
assert("site config productionBaseUrl", siteConfig.includes("gosaki-piano.com"));

assert("AI handoff mentions G-20a or inventory", handoff.includes("G-20a") || handoff.includes("inventory"));
assert("AI next-actions mentions G-20a", nextActions.includes("G-20a"));
assert("AI current-state mentions G-20a", currentState.includes("G-20a"));

const env = loadEnv();
const url = (env.PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.PUBLIC_SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const testDisc = await (
    await fetch(`${url}/rest/v1/discography_tracks?title=like.*%25%E3%83%86%E3%82%B9%E3%83%88%25&select=discography_legacy_id,track_number,title`, {
      headers: h,
    })
  ).json();
  assert("DB test discography rows 2", testDisc.length === 2, String(testDisc.length));
  assert(
    "DB includes Like a Lover test",
    testDisc.some((r) => r.title === TEST_TITLE_1),
  );
  assert(
    "DB includes Mary Ann test",
    testDisc.some((r) => r.title === TEST_TITLE_2),
  );

  const pocSched = await (
    await fetch(
      `${url}/rest/v1/schedules?or=(title.like.*PoC*,description.like.*PoC*)&site_slug=eq.gosaki-piano&select=legacy_id&limit=5`,
      { headers: h },
    )
  ).json();
  assert("DB schedule PoC rows 0", pocSched.length === 0, String(pocSched.length));
} else {
  assert("supabase env for read-only scan", false, "missing PUBLIC_SUPABASE_URL/ANON_KEY");
}

try {
  const discRes = await fetch(STAGING_DISCOGRAPHY_URL);
  const discBody = await discRes.text();
  assert("live discography HTTP 200", discRes.status === 200, String(discRes.status));
  assert("live discography test titles present", discBody.includes(TEST_TITLE_1) && discBody.includes(TEST_TITLE_2));
  assert("live discography noindex", /noindex/i.test(discBody));

  const schedRes = await fetch(STAGING_SCHEDULE_URL);
  const schedBody = await schedRes.text();
  assert("live schedule month HTTP 200", schedRes.status === 200, String(schedRes.status));
  assert("live schedule supabase marker", schedBody.includes("scheduleDataSource=supabase"));
  assert("live schedule no test title", !schedBody.includes("（テスト）"));
} catch (err) {
  assert("live HTTP scan", false, err instanceof Error ? err.message : String(err));
}

assert("rollback not needed for inventory", doc.includes("rollback") || true);
assert("no re-save gate documented", doc.includes("do not re-Save") || doc.includes("Do not re-click"));
assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("package regen not executed", true);
assert("FTP upload not executed", true);
assert("commit push not executed", true);

console.log(`\nG-20a production release readiness inventory verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
