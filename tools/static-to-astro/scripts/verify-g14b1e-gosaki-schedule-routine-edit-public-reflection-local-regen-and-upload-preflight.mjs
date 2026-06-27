/**
 * G-14b1e — Gosaki routine edit public reflection local regen + upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-save-execution-result.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const GITIGNORE_REL = "tools/static-to-astro/.gitignore";

const APRIL_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-04/index.html";
const MARCH_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-03/index.html";
const JULY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule/2026-07/index.html";
const SCHEDULES_JSON_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const ASTRO_CSS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.YcHrHZH4.css";
const ASTRO_JS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const LEGACY_ID = "schedule-2026-04-005";
const PRICE_AFTER = "3,300円（税込）";
const PRICE_BEFORE = "3,300円(tax in)";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/schedule/2026-04/index.html";
const STAGING_APRIL_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-04/";

const AUDIT_MARKERS = [
  "[CMS Kit staging]",
  "[G-14b1 routine PoC]",
  "[CMS Kit staging] G-9g2 title PoC",
  "[G-9g3b venue+description PoC]",
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

function extractTrioCard(html) {
  const match = html.match(
    /2026\.04\.12 \(Sun\)[\s\S]*?<\/article>/,
  );
  return match ? match[0] : "";
}

const doc = read(DOC_REL);

assert("G-14b1e preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-14b1e",
  doc.includes(
    "G-14b1e-gosaki-schedule-routine-edit-public-reflection-local-regen-and-upload-preflight",
  ),
);
assert("doc local regen complete gate", doc.includes("gosakiScheduleRoutineEditPublicReflectionLocalRegenComplete: true"));
assert("doc upload preflight complete gate", doc.includes("gosakiScheduleRoutineEditPublicReflectionUploadPreflightComplete: true"));
assert("doc readyForUploadExecution", doc.includes("readyForG14b1ePublicReflectionUploadExecution: true"));
assert("doc packageRegenExecuted true", doc.includes("packageRegenExecuted: true"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc minimal upload scope", doc.includes("minimalUploadScopeConfirmed: true"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc post upload http not executed", doc.includes("postUploadHttpVerifyExecuted: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy_id", doc.includes(LEGACY_ID));
assert("doc price after", doc.includes(PRICE_AFTER));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc file count 27", doc.includes("**27**"));
assert("doc CSS hash", doc.includes("index.YcHrHZH4.css"));
assert("doc JS hash", doc.includes("index.astro_astro_type_script_index_0_lang.CTyGy8yS.js"));
assert("doc minimal 1 file upload", doc.includes("schedule/2026-04/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc old price absent", doc.includes(PRICE_BEFORE) && doc.includes("absent"));
assert("doc audit markers absent", doc.includes("[CMS Kit staging]") && doc.includes("absent"));
assert("doc live stale", doc.includes("stale"));
assert("doc http verify not executed", doc.includes("Post-upload HTTP verify") && doc.includes("not executed"));
assert("doc gitignore note", doc.includes("gitignored"));
assert("doc event A not touched", doc.includes("eventATouched: false"));
assert("doc event B not touched", doc.includes("eventBTouched: false"));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc july not reuploaded", doc.includes("julyReuploadTriggered: false"));

assert("G-14b1d save result doc exists", exists(SAVE_RESULT_REL));
assert("G-14c playbook exists", exists(G14C_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));
assert("ftp safety doc exists", exists(FTP_SAFETY_REL));
assert("output gitignored", read(GITIGNORE_REL).includes("output/*"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert("April HTML exists", exists(APRIL_HTML_REL));
assert("March HTML exists", exists(MARCH_HTML_REL));
assert("July HTML exists", exists(JULY_HTML_REL));
assert("schedules JSON exists", exists(SCHEDULES_JSON_REL));
assert("astro CSS exists", exists(ASTRO_CSS_REL));
assert("astro JS exists", exists(ASTRO_JS_REL));

const aprilHtml = read(APRIL_HTML_REL);
const trioCard = extractTrioCard(aprilHtml);

assert("April HTML scheduleDataSource supabase", aprilHtml.includes("scheduleDataSource=supabase"));
assert("April HTML new price", aprilHtml.includes(`料金：${PRICE_AFTER}`));
assert("Trio card has new price", trioCard.includes(`料金：${PRICE_AFTER}`));
assert("Trio card old price absent", !trioCard.includes(PRICE_BEFORE));
assert("April HTML Trio date", trioCard.includes("2026.04.12 (Sun)"));
assert("April HTML Trio title", trioCard.includes("&lt;Trio&gt;"));
assert("April HTML Trio venue", trioCard.includes("吉祥寺 Strings"));

for (const marker of AUDIT_MARKERS) {
  assert(`April HTML no audit marker: ${marker}`, !aprilHtml.includes(marker));
}

const schedulesJson = read(SCHEDULES_JSON_REL);
const rowMatch = schedulesJson.match(
  /"legacy_id": "schedule-2026-04-005"[\s\S]*?"price": "[^"]+"/,
);
assert("JSON row schedule-2026-04-005", Boolean(rowMatch));
if (rowMatch) {
  assert("JSON price after Save", rowMatch[0].includes(PRICE_AFTER));
  assert("JSON price not old", !rowMatch[0].includes(PRICE_BEFORE));
}

const fileCount = spawnSync(
  "find",
  [
    path.join(REPO_ROOT, "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist"),
    "-type",
    "f",
  ],
  { encoding: "utf8" },
);
const count = fileCount.stdout.trim().split("\n").filter(Boolean).length;
assert("public-dist file count 27", count === 27, String(count));

try {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", STAGING_APRIL_URL], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status === 0) {
    const parts = r.stdout.trimEnd().split("\n");
    const code = parts.pop();
    const body = parts.join("\n");
    assert("live April HTTP 200", code === "200", code);
    const liveTrio = extractTrioCard(body);
    assert("live April still stale old price", liveTrio.includes(PRICE_BEFORE));
    assert("live April not yet new price on Trio", !liveTrio.includes(`料金：${PRICE_AFTER}`));
  } else {
    console.log("SKIP live HTTP — curl failed");
  }
} catch {
  console.log("SKIP live HTTP");
}

console.log(`\nG-14b1e preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
