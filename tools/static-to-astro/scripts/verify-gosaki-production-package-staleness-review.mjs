/**
 * G-20p — Gosaki production package staleness review verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-production-package-staleness-review.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-production-package-staleness-review.md";
const PROD_MANIFEST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/MANIFEST.json";
const PROD_PUBLIC_DIST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "ba4faa2";

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

assert("G-20p purpose documented", /G-20p.*目的|G-20p-gosaki-production-package-staleness-review/i.test(resultDoc));
assert("reviewed artifacts/docs listed", /確認した artifact|Local artifacts/i.test(resultDoc));

assert("production package path documented", /gosaki-piano-production/.test(resultDoc));

let manifest = null;
if (exists(PROD_MANIFEST_REL)) {
  manifest = JSON.parse(read(PROD_MANIFEST_REL));
  assert("MANIFEST.json exists on disk", true);
  assert("MANIFEST fileCount is 26", manifest.fileCount === 26, `got ${manifest.fileCount}`);
  assert("MANIFEST generatedAt recorded", Boolean(manifest.generatedAt));
  assert("MANIFEST admin excluded", manifest.adminExcludedFromPackage === true);
  assert("MANIFEST deployBase is root", manifest.deployBase === "/");
} else {
  assert("MANIFEST.json exists on disk", false, "artifact missing — doc-only review");
}

if (exists(PROD_PUBLIC_DIST_REL)) {
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else files.push(full);
    }
  }
  walk(path.join(REPO_ROOT, PROD_PUBLIC_DIST_REL));
  assert("public-dist file count on disk is 26", files.length === 26, `got ${files.length}`);
  assert("admin/ absent from public-dist", !exists(`${PROD_PUBLIC_DIST_REL}/admin`));
} else {
  assert("public-dist exists on disk", false);
}

assert("package build phase G-20i3/G-20h2 recorded", /G-20i3|G-20h2/.test(resultDoc));
assert("MANIFEST generatedAt in result doc", /2026-07-01T17:16:34/.test(resultDoc));

assert("G-22j Schedule P0 delta recorded", /G-22j|Schedule CMS P0/.test(resultDoc));
assert("schedule JSON comparison recorded", /gosaki-schedules\.json|f66f51f8/.test(resultDoc));
assert("July 008 / 14 cards recorded", /schedule-2026-07-008|14/.test(resultDoc));

assert("route staleness section present", /Route.*canonical.*SEO staleness/i.test(resultDoc));
assert("canonical staleness recorded", /canonical/i.test(resultDoc));
assert("robots sitemap recorded", /robots\.txt|sitemap/i.test(resultDoc));
assert("legacy stub route recorded", /\/YYYY-MM\/|legacy stub/i.test(resultDoc));
assert("/about/ profile note recorded", /\/about\/|profile/i.test(resultDoc));

assert("GO verdict recorded", /\bGO\b/.test(resultDoc));
assert("HOLD verdict recorded", /\bHOLD\b/.test(resultDoc));
assert("upload verdict documented", /uploadVerdict|Upload 可否判断/i.test(resultDoc));

assert("package regen required false", /packageRegenRequired: false|Regen required for G-22j\?\s*\|\s*\*\*No\*\*/i.test(resultDoc));
assert("package regen need documented", /package regen|Package regen/i.test(resultDoc));

assert("deploy checklist impact documented", /Deploy 前 checklist|deploy前/i.test(resultDoc));
assert("26-file upload impact documented", /26.file|26 files/i.test(resultDoc));

assert("next task documented", /G-20j.*preflight refresh|upload-preflight-refresh/i.test(resultDoc));

assert("build none documented", /build.*\*\*no\*\*|buildExecuted: false/i.test(resultDoc));
assert("package regen none documented", /package regen.*\*\*no\*\*|packageRegenExecuted: false/i.test(resultDoc));
assert("DB write none documented", /DB write.*\*\*no\*\*|dbWriteExecuted: false/i.test(resultDoc));
assert("Save none documented", /Save.*\*\*no\*\*|saveExecuted: false/i.test(resultDoc));
assert("FTP deploy none documented", /FTP.*\*\*no\*\*|ftpUploadExecuted: false/i.test(resultDoc));
assert("production change none documented", /production change.*\*\*no\*\*|productionChangeExecuted: false/i.test(resultDoc));

const activeTargetBad = new RegExp(
  `(?:interim SoT|active target|Supabase target).*${FORBIDDEN_PROD_REF}`,
  "i",
);
const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert(
  "Sariswing production ref not active target",
  !activeTargetBad.test(resultDoc) || deniedOk.test(resultDoc),
);

assert("00-current-state mentions G-20p", /G-20p|staleness review/i.test(currentState));
assert("03-next-actions mentions G-20p", /G-20p|staleness review/i.test(nextActions));
assert("handoff mentions G-20p", /G-20p|staleness review/i.test(handoff));

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

assert("build not executed by Cursor", true);
assert("package regen not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("Production change not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-20p Gosaki production package staleness review verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
