/**
 * G-20r4 — Gosaki schedule August public reflection plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-public-reflection-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-public-reflection-plan.md";
const G20R3A_REL =
  "tools/static-to-astro/docs/gosaki-schedule-august-db-insert-execution-closure.md";
const G14C_REL = "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const SCHEDULE_READ = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";
const BUILD_STAGING = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const BUILD_PROD = "tools/static-to-astro/scripts/build-gosaki-production-package.mjs";
const PUBLIC_DIST_SCHEDULE_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/schedule";
const JSON_REL =
  "tools/static-to-astro/output/gosaki-piano-astro-production/src/data/gosaki-schedules.json";

const BASE_COMMIT = "cdbf1cc"; // historical phase base — not a current gate
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_PACKAGE_SCHEDULE_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/schedule";

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

function noteHeadPin(label, actual, expected) {
  console.log(`NOTE ${label}: current=${actual}, historical phase base=${expected} (non-blocking)`);
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
const scheduleRead = read(SCHEDULE_READ);

noteHeadPin("HEAD", head, BASE_COMMIT);
noteHeadPin("origin/main", origin, BASE_COMMIT);

assert("plan doc exists", exists(DOC_REL));
assert("G-20r3a closure doc exists", exists(G20R3A_REL));
assert("G-14c standard exists", exists(G14C_REL));
assert("schedule read module exists", exists(SCHEDULE_READ));
assert("staging build script exists", exists(BUILD_STAGING));
assert("production build script exists", exists(BUILD_PROD));

assert(
  "phase is public reflection plan",
  /G-20r4-schedule-public-reflection-plan/i.test(doc),
);
assert("plan gate complete", /gosakiScheduleAugustPublicReflectionPlanComplete: true/i.test(doc));

assert("db total 79", /dbTotalRowsAfter: 79|DB total.*79/i.test(doc));
assert("published 74", /publishedRowsAfter: 74|published.*74/i.test(doc));
assert("mutation 77 not db total", /mutationAffectedRows: 77|mutation affected.*77/i.test(doc));
assert("august rows 17", /augustRowsAfter: 17|August rows.*17/i.test(doc));
assert("august published 14/3", /augustPublishedTrue: 14|published true 14/i.test(doc));

assert("hold 008 not inserted", /schedule-2026-08-008|hold.*008/i.test(doc));
assert("hold 018 not inserted", /schedule-2026-08-018|hold.*018/i.test(doc));
assert("published false 007 excluded", /schedule-2026-08-007/i.test(doc));
assert("published false 009 excluded", /schedule-2026-08-009/i.test(doc));
assert("published false 013 excluded", /schedule-2026-08-013/i.test(doc));

assert("local package stale (historical plan doc)", /localPackageStale: true|stale/i.test(doc));
assert(
  "G-20t2 supersedes expectedMonths gate (doc or code)",
  /G-20t2|month-discovery-generalization/i.test(doc) ||
    (scheduleRead.includes("resolveScheduleMonthsForBuild") &&
      scheduleRead.includes("optionalMonthOverride")),
);
assert("sql re-execution forbidden", /g20r3SqlReExecution: forbidden|SQL re-execution.*forbidden/i.test(doc));
assert("staging project ref", doc.includes(STAGING_REF));

assert("expectedMonths blocker documented (historical G-20r4a)", /expectedMonths|G-20r4a/i.test(doc));
assert("ready for G-20r4a", /readyForG20r4aExpectedMonthsCodeGate: true/i.test(doc));
assert(
  "G-20t2 auto-discovery supersedes expectedMonths gate",
  scheduleRead.includes("resolveScheduleMonthsForBuild") &&
    scheduleRead.includes("optionalMonthOverride"),
);

assert("gosaki-schedules.json path documented", /gosaki-schedules\.json/i.test(doc));
assert("expected json 74 rows", /74.*published|Total rows.*74/i.test(doc));
assert("expected august json 14", /August rows.*14|14.*August/i.test(doc));

assert("route schedule hub", /\/schedule\//i.test(doc));
assert("route schedule 2026-08", /\/schedule\/2026-08\//i.test(doc));
assert("route legacy 2026-08", /\/2026-08\//i.test(doc));
assert("sitemap checklist", /sitemap/i.test(doc));

assert("build staging script referenced", /build-gosaki-staging-admin-package/i.test(doc));
assert("phase chain G-20r4b", /G-20r4b/i.test(doc));

assert("ftp manual only", /ftpUploadOperatorManualOnly: true|operator.*manual only/i.test(doc));
assert("cursor ftp never", /cursorFtpExecuted: false|Cursor.*FTP.*never|AI \/ Cursor.*FTP/i.test(doc));
assert("no ai approval phrase", !/承認します。この手動アップロード/i.test(doc));
assert("manual upload checklist", /manual upload checklist|Operator manual upload checklist/i.test(doc));
assert("checklist target package", /Target package/i.test(doc));
assert("checklist remote path", /Remote path/i.test(doc));
assert("checklist upload scope", /Upload scope/i.test(doc));
assert("checklist no delete mirror", /No delete|no mirror|mirror --delete/i.test(doc));
assert("checklist success failure criteria", /Success criteria|Failure criteria/i.test(doc));
assert("filezilla lolipop only", /FileZilla|Lolipop GUI/i.test(doc));
assert("cli ftp forbidden", /Command-line FTP.*forbidden|command-line FTP/i.test(doc));
assert("no ftp auto apply", /readyForAnyFutureFtpApply: false/i.test(doc));
assert("package regen not executed", /packageRegenExecuted: false/i.test(doc));
assert("build not executed", /buildExecuted: false/i.test(doc));
assert("ftp not executed", /ftpUploadExecuted: false/i.test(doc));

const deniedOk = new RegExp(
  `Never.*${FORBIDDEN_PROD_REF}|forbiddenProject.*${FORBIDDEN_PROD_REF}`,
  "i",
);
assert("forbidden prod ref not active target", deniedOk.test(doc));

if (exists(PUBLIC_DIST_SCHEDULE_REL)) {
  const scheduleDirs = fs
    .readdirSync(path.join(REPO_ROOT, PUBLIC_DIST_SCHEDULE_REL), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  console.log(
    `NOTE on-disk production schedule months (historical stale snapshot): ${scheduleDirs.join(",") || "(none)"}`,
  );
} else {
  console.log("NOTE on-disk production schedule dir missing (historical stale check skipped)");
}

if (exists(JSON_REL)) {
  const json = JSON.parse(read(JSON_REL));
  const aug = json.filter((r) => String(r.month ?? "").startsWith("2026-08"));
  console.log(
    `NOTE on-disk production gosaki-schedules.json 2026-08 rows (historical): ${aug.length}`,
  );
} else {
  console.log("NOTE on-disk production gosaki-schedules.json missing (historical stale check skipped)");
}

if (exists(STAGING_PACKAGE_SCHEDULE_REL)) {
  const stagingMonths = fs
    .readdirSync(path.join(REPO_ROOT, STAGING_PACKAGE_SCHEDULE_REL), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  assert(
    "staging package includes 2026-08 (post G-20r4b/G-20t2)",
    stagingMonths.includes("2026-08"),
    stagingMonths.join(","),
  );
} else {
  console.log("SKIP staging package 2026-08 check (run build-gosaki-staging-admin-package.mjs)");
}

assert("00-current-state mentions G-20r4", /G-20r4|public-reflection-plan/i.test(currentState));
assert("03-next-actions mentions G-20r4", /G-20r4|public-reflection-plan/i.test(nextActions));
assert("handoff mentions G-20r4", /G-20r4|public-reflection-plan/i.test(handoff));
assert("03-next-actions next G-20r4b or G-20r4a", /G-20r4b|G-20r4a/i.test(nextActions));

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
  `\nG-20r4 Gosaki schedule August public reflection plan verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
