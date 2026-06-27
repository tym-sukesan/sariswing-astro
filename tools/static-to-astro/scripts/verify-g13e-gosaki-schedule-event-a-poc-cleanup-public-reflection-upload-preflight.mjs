/**
 * G-13e — Gosaki Event A public reflection upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md";
const LOCAL_REGEN_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-local-regen.md";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const MARCH_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html";
const STAGING_MONTH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/schedule/2026-03/index.html";

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

function curl(url) {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { ok: false, body: "", code: "0" };
  const parts = r.stdout.trimEnd().split("\n");
  const code = parts.pop();
  return { ok: true, body: parts.join("\n"), code };
}

function extractEventACard(html) {
  const m = html.match(/2026\.03\.15 \(Sun\)[\s\S]*?<\/article>/);
  return m ? m[0] : "";
}

const doc = read(DOC_REL);

assert("upload preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-13e upload preflight",
  doc.includes("G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight"),
);
assert("doc minimal 1 file upload", doc.includes("1 file") || doc.includes("**1**"));
assert("doc local march path", doc.includes("schedule/2026-03/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc staging URL", doc.includes(STAGING_MONTH_URL));
assert("doc FileZilla or Lolipop", doc.includes("FileZilla") || doc.includes("Lolipop"));
assert("doc mirror delete forbidden", doc.includes("mirror --delete") || doc.includes("mirror-delete"));
assert("doc ftp apply suspended", doc.includes("deploy-public-dist-ftp") || doc.includes("readyForAnyFutureFtpApply"));
assert("doc blocked root", doc.includes("blocked") && doc.includes('root `/`'));
assert("doc admin out of scope", doc.includes("admin/") && doc.includes("Out of scope"));
assert("doc astro not needed", doc.includes("YcHrHZH4") || doc.includes("_astro"));
assert("doc approval phrase", doc.includes("承認します。この手動アップロードを1回だけ実行してください。"));
assert("doc HTTP verify section", doc.includes("Post-upload HTTP"));
assert("doc stop conditions", doc.includes("Stop immediately") || doc.includes("**Stop**"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc upload execution next", doc.includes("public-reflection-upload-execution"));
assert("doc PoC markers", doc.includes("G-9k6") && doc.includes("G-9k4"));
assert("doc 15:00 expected", doc.includes("15:00") && doc.includes("15:30"));

assert("local regen doc exists", exists(LOCAL_REGEN_REL));
assert("ftp safety doc exists", exists(FTP_SAFETY_REL));

if (exists(MARCH_HTML_REL)) {
  const localHtml = read(MARCH_HTML_REL);
  const card = extractEventACard(localHtml);
  assert("local march html exists", true);
  assert("local no G-9k6", !localHtml.includes("G-9k6"));
  assert("local Event A 15:00", card.includes("15:00"));
  assert("local scheduleDataSource supabase", localHtml.includes("scheduleDataSource=supabase"));
} else {
  console.log("SKIP local march html checks (package not on this machine)");
}

const live = curl(STAGING_MONTH_URL);
if (live.ok && live.code === "200") {
  const liveCard = extractEventACard(live.body);
  assert("live month HTTP 200", true);
  assert("live pre-upload G-9k6 present (gap)", live.body.includes("G-9k6"));
  assert("live pre-upload wrong times on Event A", liveCard.includes("18:00 / 開演 19:00"));
} else {
  console.log("SKIP live HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13e upload preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
