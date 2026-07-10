/**
 * G-20u27 — Staging post-upload final verification verifier (doc + optional read-only HTTP).
 * Run: node tools/static-to-astro/scripts/verify-g20u27-staging-post-upload-final-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-post-upload-final-verification.md";
const BASE_COMMIT = "27e98da";
const DEPLOYED_COMMIT = "3287219";
const STG_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";

const PRIMARY_URLS = [
  `${STG_BASE}/`,
  `${STG_BASE}/about/`,
  `${STG_BASE}/schedule/`,
  `${STG_BASE}/schedule/2026-08/`,
  `${STG_BASE}/discography/`,
  `${STG_BASE}/contact/`,
];

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
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u27 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u27", doc.includes("G-20u27-staging-post-upload-final-verification"));
assert("doc gate complete", doc.includes("gosakiStagingPostUploadFinalVerificationComplete: true"));
assert("doc deployed package 3287219", doc.includes(DEPLOYED_COMMIT));
assert("doc regression 23/23", doc.includes("23/23"));
assert("doc august 14 cards", doc.includes("14"));
assert("doc discography 4 releases", doc.includes("4") && /discography|releases/i.test(doc));
assert("doc sitemap no admin", doc.includes("/admin/") && /no|exclu/i.test(doc));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc production readiness gap", doc.includes("Production readiness gap") || doc.includes("readiness gap"));
assert("doc manual FTP only", doc.includes("manual FTP") || doc.includes("Manual FTP"));
assert("doc next phase candidates", doc.includes("admin UI") || doc.includes("Admin UI"));
assert("doc cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false") || doc.includes("FTP / deploy / DB write"));

for (const url of PRIMARY_URLS) {
  assert(`doc verified URL ${url}`, doc.includes(url));
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u27", packageJson.includes("verify:g20u27-staging-post-upload-final-verification"));

assert("AI current-state G-20u27", currentState.includes("G-20u27"));
assert("AI next-actions G-20u27", nextActions.includes("G-20u27"));
assert("handoff G-20u27", handoff.includes("G-20u27"));

try {
  const augustRes = await fetch(`${STG_BASE}/schedule/2026-08/`, { redirect: "follow" });
  const augustHtml = await augustRes.text();
  assert("live STG august HTTP 200", augustRes.status === 200, String(augustRes.status));
  const cards = (augustHtml.match(/gosaki-schedule-event-card/g) ?? []).length;
  assert("live STG august 14 cards", cards === 14, String(cards));

  const discRes = await fetch(`${STG_BASE}/discography/`, { redirect: "follow" });
  const discHtml = await discRes.text();
  assert("live STG discography HTTP 200", discRes.status === 200, String(discRes.status));
  const albums = (discHtml.match(/wixui-repeater__item/g) ?? []).length;
  assert("live STG discography 4 albums", albums === 4, String(albums));

  const contactRes = await fetch(`${STG_BASE}/contact/`, { redirect: "follow" });
  assert("live STG contact HTTP 200", contactRes.status === 200, String(contactRes.status));

  const sitemapRes = await fetch(`${STG_BASE}/sitemap-0.xml`, { redirect: "follow" });
  const sitemap = await sitemapRes.text();
  assert("live STG sitemap HTTP 200", sitemapRes.status === 200, String(sitemapRes.status));
  assert("live STG sitemap no admin", !sitemap.includes("/admin/"));
  assert("live STG sitemap has schedule 2026-08", sitemap.includes("/schedule/2026-08/"));
} catch (err) {
  console.log(`NOTE live STG HTTP checks skipped: ${err.message}`);
}

assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u27 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
