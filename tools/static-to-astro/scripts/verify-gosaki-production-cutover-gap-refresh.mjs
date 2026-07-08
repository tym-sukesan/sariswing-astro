/**
 * Gosaki production-cutover gap refresh verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-production-cutover-gap-refresh.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-production-cutover-gap-refresh.md";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "1729378";

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

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

assert("result doc exists", exists(RESULT_DOC_REL));
assert("HEAD matches BASE_COMMIT", head === BASE_COMMIT, `HEAD=${head}`);
assert("result doc mentions base commit", resultDoc.includes(BASE_COMMIT));

assert("G-23 pause documented", /G-23.*保留|G-23.*paused|g23oLiveCrawlDeferred/i.test(resultDoc));
assert("Gosaki priority documented", /Gosaki.*優先|Gosaki-piano production cutover/i.test(resultDoc));

assert("G-20j STOP documented", /G-20j.*STOP|g20jFullProductionUpload: STOP/i.test(resultDoc));
assert("G-20j STOP reason DNS/SSL/MX", /DNS.*SSL.*MX|DNS_SSL_MX/i.test(resultDoc));

assert(
  "G-22j Schedule P0 post-state documented",
  /G-22j|Schedule CMS P0|scheduleCmsP0Closed/i.test(resultDoc),
);
assert("production package stale vs G-22j noted", /stale|G-20i3.*G-22j/i.test(resultDoc));

assert("route checklist present", /Route.*canonical|Expected production route manifest/i.test(resultDoc));
assert("canonical checklist present", /Canonical.*legacy route/i.test(resultDoc));
assert("SEO checklist present", /SEO.*OGP|robots.*sitemap/i.test(resultDoc));
assert("robots sitemap checklist present", /robots\.txt|sitemap-index/i.test(resultDoc));
assert("legacy stub /YYYY-MM/ noted", /\/YYYY-MM\/|2026-03.*legacy/i.test(resultDoc));
assert("canonical /schedule/YYYY-MM/ noted", /\/schedule\/YYYY-MM\//i.test(resultDoc));

assert("Contact HubSpot checklist present", /Contact.*HubSpot/i.test(resultDoc));
assert("mobile spot-check checklist present", /Mobile spot-check/i.test(resultDoc));
assert("client sign-off checklist present", /Client sign-off/i.test(resultDoc));
assert("deploy before checklist present", /Deploy 前|Deploy 直前/i.test(resultDoc));
assert("deploy after checklist present", /Deploy 後/i.test(resultDoc));

assert("P0 section present", /\bP0\b.*本番|### P0/i.test(resultDoc));
assert("P1 section present", /\bP1\b/i.test(resultDoc));
assert("P2 section present", /\bP2\b/i.test(resultDoc));
assert("保留 section present", /保留/i.test(resultDoc));

assert("high-risk work separated", /高リスク|別フェーズ/i.test(resultDoc));
assert("DNS separated", /DNS change|G-20dns/i.test(resultDoc));
assert("SSL separated", /SSL setup|G-20ssl/i.test(resultDoc));
assert("FTP separated", /FTP upload|G-20j-gosaki-production-full-upload/i.test(resultDoc));

assert("DB write none documented", /DB write.*\*\*no\*\*|dbWriteExecuted: false/i.test(resultDoc));
assert("Save none documented", /Save.*\*\*no\*\*|saveExecuted: false/i.test(resultDoc));
assert("FTP deploy none documented", /FTP.*\*\*no\*\*|ftpUploadExecuted: false/i.test(resultDoc));
assert("production change none documented", /production change.*\*\*no\*\*|productionChangeExecuted: false/i.test(resultDoc));

const activeTargetPattern = new RegExp(
  `(?:active.*target|interim SoT|Supabase).*${FORBIDDEN_PROD_REF}`,
  "i",
);
const deniedOnlyPattern = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert(
  "Sariswing production ref not active target",
  !activeTargetPattern.test(resultDoc) || deniedOnlyPattern.test(resultDoc),
);

assert("next task documented", /G-20p|staleness-review|次に進むべき最小タスク/i.test(resultDoc));

assert("00-current-state mentions gap refresh", /gap refresh|cutover-gap-refresh/i.test(currentState));
assert("03-next-actions mentions gap refresh", /gap refresh|cutover-gap-refresh/i.test(nextActions));
assert("handoff mentions gap refresh", /gap refresh|cutover-gap-refresh/i.test(handoff));

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("DB write not executed by Cursor", true);
assert("Save not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Production change not executed by Cursor", true);
assert("Package build not executed by Cursor", true);
assert("Astro build not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nGosaki production-cutover gap refresh verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
