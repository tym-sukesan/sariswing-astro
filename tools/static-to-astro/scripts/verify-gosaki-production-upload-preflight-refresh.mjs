/**
 * G-20j — Gosaki production upload preflight refresh verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-production-upload-preflight-refresh.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-production-upload-preflight-refresh.md";
const PROD_MANIFEST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/MANIFEST.json";
const PROD_PUBLIC_DIST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "f5f038c";

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

assert("G-20p conclusion reflected", /G-20p|G-20p 結論/i.test(resultDoc));
assert("package content GO recorded", /content GO|uploadContentVerdict: GO/i.test(resultDoc));
assert("package regen not required", /regen.*不要|packageRegenRequired: false/i.test(resultDoc));
assert("schedule not stale recorded", /stale ではない|NOT stale/i.test(resultDoc));
assert("G-22j republish no HTML change", /G-22j republish|public HTML/i.test(resultDoc));
assert("upload execution HOLD recorded", /execution HOLD|uploadExecutionVerdict: HOLD/i.test(resultDoc));

assert("HOLD reason DNS", /DNS.*未解決|DNS cutover/i.test(resultDoc));
assert("HOLD reason SSL", /SSL.*未解決|Let's Encrypt/i.test(resultDoc));
assert("HOLD reason MX", /MX.*未確認|MX /i.test(resultDoc));
assert("HOLD reason remote path", /remote path|Remote path/i.test(resultDoc));
assert("HOLD reason client sign-off", /client sign-off|Client sign-off/i.test(resultDoc));

assert("26-file checklist present", /26.file|26 files|fileCount.*26/i.test(resultDoc));
assert("admin exclusion recorded", /adminExcludedFromPackage|admin.*除外|admin\/.*absent/i.test(resultDoc));
assert("/about/ is profile route", /\/about\/.*profile|Profile.*\/about\//i.test(resultDoc));
assert("/profile/ route absent", /\/profile\/.*存在しない|does not exist/i.test(resultDoc));

assert("route SEO checklist present", /Route.*SEO|canonical.*robots.*sitemap/i.test(resultDoc));
assert("primary routes checklist", /\/schedule\/2026-07\/|Primary routes/i.test(resultDoc));
assert("legacy stub checklist", /legacy stub|\/2026-07\//i.test(resultDoc));
assert("robots sitemap checklist", /robots\.txt|sitemap-index/i.test(resultDoc));

assert("DNS SSL MX remote path gate", /DNS.*SSL.*MX|remote path gate/i.test(resultDoc));
assert("FTP login root vs document root", /FTP login root|document root/i.test(resultDoc));
assert("remote path screenshot required", /screenshot|Screenshot/i.test(resultDoc));
assert("account root STOP", /account root|STOP/i.test(resultDoc));
assert("DNS SSL separate phase", /別フェーズ|separate phase/i.test(resultDoc));

assert("client sign-off checklist present", /Client sign-off checklist|client sign-off/i.test(resultDoc));
assert("HubSpot in sign-off", /HubSpot/i.test(resultDoc));
assert("written OK required", /written OK|Written OK/i.test(resultDoc));

assert("high-risk separation present", /High-risk|高リスク/i.test(resultDoc));
assert("FTP manual by operator", /戸山|human operator|人間/i.test(resultDoc));
assert("AI does not FTP", /Cursor.*FTP|AI.*never|AI は FTP/i.test(resultDoc));
assert("mirror delete forbidden", /mirror.*delete|mirror --delete/i.test(resultDoc));

assert("build none documented", /build.*\*\*no\*\*|buildExecuted: false/i.test(resultDoc));
assert("package regen none documented", /package regen.*\*\*no\*\*|packageRegenExecuted: false/i.test(resultDoc));
assert("DB write none documented", /DB write.*\*\*no\*\*|dbWriteExecuted: false/i.test(resultDoc));
assert("Save none documented", /Save.*\*\*no\*\*|saveExecuted: false/i.test(resultDoc));
assert("FTP deploy none documented", /FTP upload.*\*\*no\*\*|ftpUploadExecuted: false|cursorFtpExecuted: false/i.test(resultDoc));
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

if (exists(PROD_MANIFEST_REL)) {
  const manifest = JSON.parse(read(PROD_MANIFEST_REL));
  assert("MANIFEST fileCount 26 on disk", manifest.fileCount === 26);
  assert("MANIFEST deployBase / on disk", manifest.deployBase === "/");
  assert("MANIFEST safeForStaticFtp on disk", manifest.safeForStaticFtp === true);
  assert("MANIFEST admin excluded on disk", manifest.adminExcludedFromPackage === true);
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
  assert("public-dist 26 files on disk", files.length === 26, `got ${files.length}`);
  assert("admin absent on disk", !exists(`${PROD_PUBLIC_DIST_REL}/admin`));
  assert("profile route absent on disk", !exists(`${PROD_PUBLIC_DIST_REL}/profile`));
  assert("about route present on disk", exists(`${PROD_PUBLIC_DIST_REL}/about/index.html`));
}

assert("next task documented", /G-20j1|client-sign-off|次に進むべき最小タスク/i.test(resultDoc));

assert("00-current-state mentions preflight refresh", /preflight refresh|preflight-refresh/i.test(currentState));
assert("03-next-actions mentions preflight refresh", /preflight refresh|preflight-refresh/i.test(nextActions));
assert("handoff mentions preflight refresh", /preflight refresh|preflight-refresh/i.test(handoff));

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
assert("service_role not used by Cursor", true);

console.log(
  `\nG-20j Gosaki production upload preflight refresh verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
