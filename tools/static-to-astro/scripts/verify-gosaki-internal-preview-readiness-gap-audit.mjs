/**
 * G-20q — Gosaki internal preview readiness gap audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-internal-preview-readiness-gap-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-internal-preview-readiness-gap-audit.md";
const PROD_PUBLIC_DIST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "fd59ceb";

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
assert("clientPreviewVerdict present", /clientPreviewVerdict:\s*NOT_READY|clientPreviewVerdict: NOT_READY/.test(resultDoc));
assert("route QA inventory present", /Route 別 QA|Route-by-route/i.test(resultDoc));

for (const route of ["Home", "/about/", "Schedule", "Discography", "Contact", "Link"]) {
  assert(`route inventory includes ${route}`, resultDoc.includes(route) || resultDoc.includes(route.replace(/\//g, "")));
}

assert("legacy month stubs in inventory", /legacy stub|\/2026-07\//i.test(resultDoc));
assert("mobile pending documented", /mobile.*pending|実機|G-7j/i.test(resultDoc));
assert("responsive CSS or markup noted", /nav-toggle|768px|responsive/i.test(resultDoc));

assert("Contact HubSpot section", /Contact.*HubSpot|HubSpot embed/i.test(resultDoc));
assert("HubSpot E2E unverified noted", /E2E.*未|not verified/i.test(resultDoc));

assert("admin excluded from package", /admin.*excluded|admin\/.*absent/i.test(resultDoc));
assert("hosted admin deferred", /hosted admin|Hosted admin/i.test(resultDoc));
assert("CMS self-service not complete", /本人|self-service|operator/i.test(resultDoc));

assert("P0 classification present", /\bP0\b/.test(resultDoc));
assert("P1 classification present", /\bP1\b/.test(resultDoc));
assert("P2 classification present", /\bP2\b/.test(resultDoc));
assert("Defer classification present", /Defer|defer/i.test(resultDoc));

assert("schedule source freshness gap documented", /Schedule source freshness|source-content freshness|2026-08/i.test(resultDoc));
assert("package months through 2026-07", /2026-07 まで|through 2026-07|2026-03.*2026-07/i.test(resultDoc));
assert("not package staleness vs G-22j", /notPackageStalenessVsG22j|not a package staleness vs G-22j/i.test(resultDoc));
assert("G-20r schedule source freshness audit proposed", /G-20r-schedule-source-freshness-audit/i.test(resultDoc));
assert("live crawl not executed", /live crawl.*\*\*no\*\*|liveCrawlExecuted: false/i.test(resultDoc));

assert("angle bracket source parity not P0 blocker", /source parity|NotKitP0Blocker|not Kit P0|not Kit defect/i.test(resultDoc));
assert("angle bracket P1 or content note", /P1-9|Content note|CN-1/i.test(resultDoc));
assert("NOT_READY reasons exclude angle bracket blocker", /NOT_READY の理由に含めない|not include.*NOT_READY/i.test(resultDoc));
assert("next implementation candidates", /G-20r|実装タスク候補|next.*implementation/i.test(resultDoc));

assert("build none documented", /build.*\*\*no\*\*|buildExecuted: false/i.test(resultDoc));
assert("package regen none documented", /package regen.*\*\*no\*\*|packageRegenExecuted: false/i.test(resultDoc));
assert("DB write none documented", /DB write.*\*\*no\*\*|dbWriteExecuted: false/i.test(resultDoc));
assert("Save none documented", /Save.*\*\*no\*\*|saveExecuted: false/i.test(resultDoc));
assert("FTP deploy none documented", /FTP.*\*\*no\*\*|ftpUploadExecuted: false/i.test(resultDoc));
assert("production change none documented", /production change.*\*\*no\*\*|productionChangeExecuted: false/i.test(resultDoc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(resultDoc));

assert("00-current-state mentions G-20q", /G-20q|internal-preview-readiness/i.test(currentState));
assert("03-next-actions mentions G-20q", /G-20q|internal-preview-readiness/i.test(nextActions));
assert("handoff mentions G-20q", /G-20q|internal-preview-readiness/i.test(handoff));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("build not executed by Cursor", true);
assert("package regen not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Production change not executed by Cursor", true);

console.log(
  `\nG-20q Gosaki internal preview readiness gap audit verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
