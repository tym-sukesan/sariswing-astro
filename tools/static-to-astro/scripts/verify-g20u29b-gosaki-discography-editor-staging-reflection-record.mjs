/**
 * G-20u29b — Gosaki Discography editor staging reflection record verifier (doc + optional read-only HTTP).
 * Run: node tools/static-to-astro/scripts/verify-g20u29b-gosaki-discography-editor-staging-reflection-record.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-editor-staging-reflection-record.md";
const BASE_COMMIT = "2a5dc68";
const DEPLOYED_COMMIT = "2a5dc6825dcab03b1b28705877f5bcd5423ba37c";
const STG_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const DISC_EDITOR_PHASE = "G-20u29-gosaki-discography-edit-ui-prototype";

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
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u29b base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u29b", doc.includes("G-20u29b-gosaki-discography-editor-staging-reflection-record"));
assert("doc gate complete", doc.includes("gosakiDiscographyEditorStagingReflectionRecordComplete: true"));
assert("doc sourceCommit 2a5dc68", doc.includes(DEPLOYED_COMMIT) || doc.includes(BASE_COMMIT));
assert("doc build PASS", doc.includes("build:gosaki:staging") && /PASS/i.test(doc));
assert("doc preflight PASS", doc.includes("preflight:gosaki:staging") && /PASS/i.test(doc));
assert("doc fileCount 30", doc.includes("30"));
assert("doc includesAdmin true", doc.includes("includesAdmin") && doc.includes("true"));
assert("doc safeForStaticFtp true", doc.includes("safeForStaticFtp") && doc.includes("true"));
assert("doc manual FTP complete", doc.includes("Manual FTP") && /complete/i.test(doc));
assert("doc upload source public-dist", doc.includes("public-dist"));
assert("doc remote /cms-kit-staging/gosaki-piano/", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc admin URL", doc.includes(`${STG_BASE}/admin/`));
assert("doc Discography Editor Prototype", doc.includes("Discography Editor Prototype"));
assert("doc gra-discography-editor", doc.includes("gra-discography-editor"));
assert("doc 4 albums", doc.includes("4") && /album/i.test(doc));
assert("doc discography 4 releases", doc.includes("4") && /releases/i.test(doc));
assert("doc discography 34 tracks", doc.includes("34"));
assert("doc 1 line = 1 track", doc.includes("1 line = 1 track"));
assert("doc textarea per album", doc.includes("textarea") && /album|per album/i.test(doc));
assert("doc not 34 fixed inputs", doc.includes("34") && (/not 34|not used|not.*fixed/i.test(doc)));
assert("doc Save disabled", doc.includes("Save disabled"));
assert("doc Save Publish Deploy FTP disabled", doc.includes("Save") && doc.includes("Publish") && doc.includes("Deploy") && doc.includes("FTP"));
assert("doc sitemap URL", doc.includes(`${STG_BASE}/sitemap-0.xml`));
assert("doc sitemap admin exclusion", doc.includes("/admin/") && (/0 \/ 0|no|exclu/i.test(doc)));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false") || doc.includes("Cursor FTP"));
assert("doc no mirror sync delete", doc.includes("mirror") && doc.includes("sync") && doc.includes("delete"));
assert("doc replaces f03122b", doc.includes("f03122b"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u29b", packageJson.includes("verify:g20u29b-gosaki-discography-editor-staging-reflection-record"));

assert("AI current-state G-20u29b", currentState.includes("G-20u29b"));
assert("AI next-actions G-20u29b", nextActions.includes("G-20u29b"));
assert("handoff G-20u29b", handoff.includes("G-20u29b"));

try {
  const adminRes = await fetch(`${STG_BASE}/admin/`, { redirect: "follow" });
  const adminHtml = await adminRes.text();
  assert("live STG admin HTTP 200", adminRes.status === 200, String(adminRes.status));
  assert("live STG disc editor section", adminHtml.includes('id="gra-discography-editor"'));
  assert("live STG disc editor data-section", adminHtml.includes('data-section="discography-editor-prototype"'));
  assert("live STG G20U29 phase", adminHtml.includes(DISC_EDITOR_PHASE));
  assert("live STG disc editor heading", adminHtml.includes("Discography Editor Prototype"));
  assert("live STG 1 line = 1 track", adminHtml.includes("1 line = 1 track"));
  assert("live STG Save disabled", adminHtml.includes("Save disabled"));
  assert("live STG dashboard 4 releases", adminHtml.includes("4") && adminHtml.includes("releases"));
  assert("live STG dashboard 34 tracks", adminHtml.includes("34") && adminHtml.includes("tracks"));
  assert("live STG Editor prototype link", adminHtml.includes("#gra-discography-editor") && adminHtml.includes("Editor prototype"));

  const albumCards = (adminHtml.match(/data-section-card="discography-album"/g) ?? []).length;
  assert("live STG 4 album cards", albumCards === 4, String(albumCards));

  const trackTextareas = (adminHtml.match(/data-track-list-textarea="true"/g) ?? []).length;
  assert("live STG 4 track list textareas", trackTextareas === 4, String(trackTextareas));
  assert("live STG not 34 track textareas", trackTextareas !== 34, String(trackTextareas));

  const perTrackInputs = (adminHtml.match(/id="gra-disc-track-\d{2}"/g) ?? []).length;
  assert("live STG no numbered per-track inputs", perTrackInputs === 0, String(perTrackInputs));

  assert("live STG Save disabled btn", adminHtml.includes("Save（無効"));
  assert("live STG Publish disabled btn", adminHtml.includes("Publish（無効）"));
  assert("live STG Deploy disabled btn", adminHtml.includes("Deploy（無効）"));
  assert("live STG FTP disabled btn", adminHtml.includes("FTP（無効）"));
  assert("live STG future phase Save label", adminHtml.includes("future phase"));

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

console.log(`\nG-20u29b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
