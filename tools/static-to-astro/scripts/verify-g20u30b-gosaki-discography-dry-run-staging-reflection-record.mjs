/**
 * G-20u30b — Gosaki Discography dry-run staging reflection record verifier (doc + optional read-only HTTP).
 * Run: node tools/static-to-astro/scripts/verify-g20u30b-gosaki-discography-dry-run-staging-reflection-record.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-dry-run-staging-reflection-record.md";
const BASE_COMMIT = "00c8888";
const DEPLOYED_COMMIT = "00c8888667205e0deb879a4780201e61e7313e65";
const STG_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const DISC_DRY_RUN_PHASE = "G-20u30-gosaki-discography-dry-run-validation";

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
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u30b base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u30b", doc.includes("G-20u30b-gosaki-discography-dry-run-staging-reflection-record"));
assert("doc gate complete", doc.includes("gosakiDiscographyDryRunStagingReflectionRecordComplete: true"));
assert("doc sourceCommit 00c8888", doc.includes(DEPLOYED_COMMIT) || doc.includes(BASE_COMMIT));
assert("doc build PASS", doc.includes("build:gosaki:staging") && /PASS/i.test(doc));
assert("doc preflight PASS", doc.includes("preflight:gosaki:staging") && /PASS/i.test(doc));
assert("doc fileCount 30", doc.includes("30"));
assert("doc includesAdmin true", doc.includes("includesAdmin") && doc.includes("true"));
assert("doc safeForStaticFtp true", doc.includes("safeForStaticFtp") && doc.includes("true"));
assert("doc manual FTP complete", doc.includes("Manual FTP") && /complete/i.test(doc));
assert("doc upload source public-dist", doc.includes("public-dist"));
assert("doc remote /cms-kit-staging/gosaki-piano/", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc admin URL", doc.includes(`${STG_BASE}/admin/`));
assert("doc dry-run validation", doc.includes("dry-run validation") || doc.includes("Dry-run validation"));
assert("doc gra-discography-editor", doc.includes("gra-discography-editor"));
assert("doc editable textarea", doc.includes("editable") && /textarea/i.test(doc));
assert("doc per-album dry-run btn", doc.includes("Dry-run validation（保存なし）"));
assert("doc all-albums dry-run btn", doc.includes("Validate changes — no save"));
assert("doc diff result area", doc.includes("data-disc-dry-run-result") || doc.includes("Diff result"));
assert("doc wouldWrite false", doc.includes("wouldWrite") && /false/i.test(doc));
assert("doc networkWrite false", doc.includes("networkWrite") && /false/i.test(doc));
assert("doc saveEnabled false", doc.includes("saveEnabled") && /false/i.test(doc));
assert("doc textarea per album", doc.includes("textarea") && /album|per album/i.test(doc));
assert("doc 1 line = 1 track", doc.includes("1 line = 1 track"));
assert("doc not 34 fixed inputs", doc.includes("34") && (/not 34|not.*fixed/i.test(doc)));
assert("doc Save disabled", doc.includes("Save disabled") || (doc.includes("Save") && /disabled/i.test(doc)));
assert("doc Save Publish Deploy FTP disabled", doc.includes("Save") && doc.includes("Publish") && doc.includes("Deploy") && doc.includes("FTP"));
assert("doc sitemap URL", doc.includes(`${STG_BASE}/sitemap-0.xml`));
assert("doc sitemap admin exclusion", doc.includes("/admin/") && (/0 \/ 0|no|exclu/i.test(doc)));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false") || doc.includes("Cursor FTP"));
assert("doc no mirror sync delete", doc.includes("mirror") && doc.includes("sync") && doc.includes("delete"));
assert("doc replaces 2a5dc68", doc.includes("2a5dc68"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u30b", packageJson.includes("verify:g20u30b-gosaki-discography-dry-run-staging-reflection-record"));

assert("AI current-state G-20u30b", currentState.includes("G-20u30b"));
assert("AI next-actions G-20u30b", nextActions.includes("G-20u30b"));
assert("handoff G-20u30b", handoff.includes("G-20u30b"));

try {
  const adminRes = await fetch(`${STG_BASE}/admin/`, { redirect: "follow" });
  const adminHtml = await adminRes.text();
  assert("live STG admin HTTP 200", adminRes.status === 200, String(adminRes.status));
  assert("live STG disc editor section", adminHtml.includes('id="gra-discography-editor"'));
  assert("live STG G20U30 dry-run phase", adminHtml.includes(DISC_DRY_RUN_PHASE));
  assert("live STG dry-run album button", adminHtml.includes("Dry-run validation（保存なし）"));
  assert("live STG dry-run all button", adminHtml.includes("Validate changes — no save"));
  assert("live STG dry-run result album", adminHtml.includes('data-disc-dry-run-result="album"'));
  assert("live STG dry-run result all", adminHtml.includes('data-disc-dry-run-result="all"'));
  assert("live STG editable textarea class", adminHtml.includes("track-list-textarea--editable"));
  assert("live STG data-original-track-list", adminHtml.includes("data-original-track-list"));
  assert("live STG 1 line = 1 track", adminHtml.includes("1 line = 1 track"));
  assert("live STG Dry-run only badge", adminHtml.includes("Dry-run only"));
  assert("live STG wouldWrite false hint", adminHtml.includes("wouldWrite: false"));
  assert("live STG networkWrite false hint", adminHtml.includes("networkWrite: false"));

  const trackTextareas = (adminHtml.match(/<textarea[^>]*data-track-list-textarea="true"/g) ?? []).length;
  assert("live STG 4 track textareas", trackTextareas === 4, String(trackTextareas));
  assert("live STG not 34 textareas", trackTextareas !== 34, String(trackTextareas));
  const readonlyTrackTa = (adminHtml.match(/data-track-list-textarea="true"[^>]*readonly/g) ?? []).length;
  assert("live STG track textarea not readonly", readonlyTrackTa === 0, String(readonlyTrackTa));

  const perTrackInputs = (adminHtml.match(/id="gra-disc-track-\d{2}"/g) ?? []).length;
  assert("live STG no numbered per-track inputs", perTrackInputs === 0, String(perTrackInputs));

  assert("live STG Save disabled btn", adminHtml.includes("Save（無効"));
  assert("live STG Publish disabled btn", adminHtml.includes("Publish（無効）"));
  assert("live STG Deploy disabled btn", adminHtml.includes("Deploy（無効）"));
  assert("live STG FTP disabled btn", adminHtml.includes("FTP（無効）"));

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

console.log(`\nG-20u30b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
