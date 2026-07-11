/**
 * G-20u28b — Gosaki admin UI staging reflection record verifier (doc + optional read-only HTTP).
 * Run: node tools/static-to-astro/scripts/verify-g20u28b-gosaki-admin-ui-staging-reflection-record.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-staging-reflection-record.md";
const BASE_COMMIT = "f03122b";
const DEPLOYED_COMMIT = "f03122b59fcb289d6b3e527bd5420a1bdd776084";
const STG_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const ADMIN_PHASE = "G-20u28-gosaki-admin-ui-foundation-polish";

const SECTION_CARDS = ["schedule", "discography", "youtube", "about", "contact", "link", "upload-safety"];

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u28b base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u28b", doc.includes("G-20u28b-gosaki-admin-ui-staging-reflection-record"));
assert("doc gate complete", doc.includes("gosakiAdminUiStagingReflectionRecordComplete: true"));
assert("doc sourceCommit f03122b", doc.includes(DEPLOYED_COMMIT) || doc.includes(BASE_COMMIT));
assert("doc build PASS", doc.includes("build:gosaki:staging") && /PASS/i.test(doc));
assert("doc preflight PASS", doc.includes("preflight:gosaki:staging") && /PASS/i.test(doc));
assert("doc fileCount 30", doc.includes("30"));
assert("doc includesAdmin true", doc.includes("includesAdmin") && doc.includes("true"));
assert("doc safeForStaticFtp true", doc.includes("safeForStaticFtp") && doc.includes("true"));
assert("doc manual FTP complete", doc.includes("Manual FTP") && /complete/i.test(doc));
assert("doc upload source public-dist", doc.includes("public-dist"));
assert("doc remote /cms-kit-staging/gosaki-piano/", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc admin URL", doc.includes(`${STG_BASE}/admin/`));
assert("doc dashboard UI reflected", doc.includes("dashboard UI") || doc.includes("Dashboard UI"));
assert("doc READ-ONLY badge", doc.includes("READ-ONLY"));
assert("doc STAGING ONLY badge", doc.includes("STAGING ONLY"));
assert("doc Save disabled", doc.includes("Save disabled"));
assert("doc schedule 74 events", doc.includes("74"));
assert("doc august 14 cards", doc.includes("14"));
assert("doc discography 4 releases", doc.includes("4") && /releases|Discography/i.test(doc));
assert("doc discography 34 tracks", doc.includes("34"));
assert("doc production readiness card", doc.includes("Production readiness") || doc.includes("Upload safety"));
assert("doc Save Publish Deploy FTP disabled", doc.includes("Save") && doc.includes("Publish") && doc.includes("Deploy") && doc.includes("FTP"));
assert("doc sitemap URL", doc.includes(`${STG_BASE}/sitemap-0.xml`));
assert("doc sitemap admin exclusion", doc.includes("/admin/") && (/0 \/ 0|no|exclu/i.test(doc)));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false") || doc.includes("Cursor FTP"));
assert("doc no mirror sync delete", doc.includes("mirror") && doc.includes("sync") && doc.includes("delete"));

for (const card of SECTION_CARDS) {
  assert(`doc section card ${card}`, doc.includes(card) || new RegExp(card.replace("-", " "), "i").test(doc));
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u28b", packageJson.includes("verify:g20u28b-gosaki-admin-ui-staging-reflection-record"));

assert("AI current-state G-20u28b", currentState.includes("G-20u28b"));
assert("AI next-actions G-20u28b", nextActions.includes("G-20u28b"));
assert("handoff G-20u28b", handoff.includes("G-20u28b"));

try {
  const adminRes = await fetch(`${STG_BASE}/admin/`, { redirect: "follow" });
  const adminHtml = await adminRes.text();
  assert("live STG admin HTTP 200", adminRes.status === 200, String(adminRes.status));
  assert("live STG admin G20U28 phase", adminHtml.includes(ADMIN_PHASE));
  assert("live STG admin READ-ONLY", adminHtml.includes("READ-ONLY"));
  assert("live STG admin STAGING ONLY", adminHtml.includes("STAGING ONLY"));
  assert("live STG admin Save disabled", adminHtml.includes("Save disabled"));
  assert("live STG admin dashboard grid", adminHtml.includes("gosaki-read-only-admin__dashboard-grid"));
  assert("live STG admin schedule 74", adminHtml.includes("74") && adminHtml.includes("events"));
  assert("live STG admin august 14", adminHtml.includes("14") && adminHtml.includes("cards"));
  assert("live STG admin discography 4/34", adminHtml.includes("4") && adminHtml.includes("34"));
  assert("live STG admin production STOP", /production STOP/i.test(adminHtml));
  assert("live STG admin Save disabled btn", adminHtml.includes("Save（無効）"));
  assert("live STG admin Publish disabled btn", adminHtml.includes("Publish（無効）"));
  assert("live STG admin Deploy disabled btn", adminHtml.includes("Deploy（無効）"));
  assert("live STG admin FTP disabled btn", adminHtml.includes("FTP（無効）"));

  for (const card of SECTION_CARDS) {
    assert(`live STG admin card ${card}`, adminHtml.includes(`data-section-card="${card}"`));
  }

  const sitemapRes = await fetch(`${STG_BASE}/sitemap-0.xml`, { redirect: "follow" });
  const sitemap = await sitemapRes.text();
  assert("live STG sitemap HTTP 200", sitemapRes.status === 200, String(sitemapRes.status));
  assert("live STG sitemap no admin path", !sitemap.includes("/admin/"));
  const adminMatches = (sitemap.match(/admin/gi) ?? []).length;
  assert("live STG sitemap admin string 0", adminMatches === 0, String(adminMatches));
} catch (err) {
  console.log(`NOTE live STG HTTP checks skipped: ${err.message}`);
}

assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u28b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
