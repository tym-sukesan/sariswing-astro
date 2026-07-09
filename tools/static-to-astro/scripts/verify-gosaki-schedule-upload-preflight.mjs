/**
 * G-20r4d — Gosaki schedule August upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-upload-preflight.md";
const G20R4C_REL = "tools/static-to-astro/docs/gosaki-schedule-public-output-review.md";
const G20R4B_REL = "tools/static-to-astro/docs/gosaki-schedule-local-regen-dry-run-result.md";
const MANIFEST_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";

const BASE_COMMIT = "ffca478";
const STAGING_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const REMOTE_PATH = "/cms-kit-staging/gosaki-piano/";

const AUGUST_CRITICAL = [
  "schedule/index.html",
  "schedule/2026-08/index.html",
  "2026-08/index.html",
  "sitemap-0.xml",
  "sitemap-index.xml",
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

function listFilesRecursive(absDir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(abs, rel));
    else out.push(rel);
  }
  return out.sort();
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("HEAD is ffca478", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is ffca478", origin === BASE_COMMIT, `origin=${origin}`);

assert("preflight doc exists", exists(DOC_REL));
assert("G-20r4c review doc exists", exists(G20R4C_REL));
assert("G-20r4b result doc exists", exists(G20R4B_REL));

assert("phase G-20r4d", /G-20r4d-gosaki-schedule-upload-preflight/i.test(doc));
assert("preflight gate complete", /gosakiScheduleAugustUploadPreflightComplete: true/i.test(doc));
assert("ready for G-20r4e", /readyForG20r4eOperatorManualUpload: true/i.test(doc));
assert("file count 29", /fileCount: 29|29 files/i.test(doc));
assert("p0 none", /p0UploadBlockers: 0|P0.*none/i.test(doc));

assert("remote path documented", doc.includes(REMOTE_PATH));
assert("staging url documented", doc.includes(STAGING_URL));
assert("full upload recommended", /full.*29|full-public-dist/i.test(doc));

assert("filezilla lolipop manual", /FileZilla|Lolipop/i.test(doc));
assert("cursor ftp never", /cursorFtpExecuted: false|Cursor.*must not|AI.*must not/i.test(doc));
assert("no command line ftp", /commandLineFtpForbidden: true|Command-line FTP.*forbidden/i.test(doc));
assert("mirror delete forbidden", /mirrorDeleteForbidden: true|mirror --delete.*forbidden/i.test(doc));
assert("no delete policy", /no delete|no mirror|sync delete/i.test(doc));
assert("ftp not executed", /ftpUploadExecuted: false/i.test(doc));
assert("workflow forbidden", /workflowDispatchForbidden: true|workflow_dispatch.*forbidden/i.test(doc));

assert("http verify schedule hub", /\/schedule\//.test(doc) && /2026\.08|2026-08/.test(doc));
assert("http verify august month", /\/schedule\/2026-08\//.test(doc));
assert("http verify legacy august", /\/2026-08\//.test(doc));
assert("http verify 14 cards", /14.*card/i.test(doc));
assert("exclusion verify 007", /schedule-2026-08-007|007/.test(doc));
assert("success criteria", /Success criteria/i.test(doc));
assert("failure stop", /Failure criteria|STOP/i.test(doc));
assert("rollback note", /Rollback/i.test(doc));

for (const p of AUGUST_CRITICAL) {
  assert(`doc lists ${p}`, doc.includes(p));
}

if (exists(MANIFEST_REL)) {
  const m = JSON.parse(read(MANIFEST_REL));
  assert("manifest fileCount 29", m.fileCount === 29);
  assert("manifest safeForStaticFtp", m.safeForStaticFtp === true);
  assert("manifest upload target", m.uploadTarget === REMOTE_PATH);
}

if (exists(PACKAGE_DIST)) {
  const files = listFilesRecursive(path.join(REPO_ROOT, PACKAGE_DIST));
  assert("on-disk package 29 files", files.length === 29, `got ${files.length}`);
  assert("on-disk schedule/2026-08", files.includes("schedule/2026-08/index.html"));
  assert("on-disk legacy 2026-08", files.includes("2026-08/index.html"));
  assert("on-disk _astro css", files.some((f) => f.startsWith("_astro/") && f.endsWith(".css")));
}

assert("00-current-state mentions G-20r4d", /G-20r4d|upload-preflight/i.test(currentState));
assert("03-next-actions mentions G-20r4d", /G-20r4d|upload-preflight/i.test(nextActions));
assert("handoff mentions G-20r4d", /G-20r4d|upload-preflight/i.test(handoff));
assert("03-next-actions next G-20r4e", /G-20r4e/i.test(nextActions));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error("FAIL port 4321 LISTEN none");
  failed += 1;
}

console.log(
  `\nG-20r4d Gosaki schedule August upload preflight verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
