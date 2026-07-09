/**
 * G-20r3a — Gosaki schedule August DB INSERT execution closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-august-db-insert-execution-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-august-db-insert-execution-closure.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-august-db-insert-preflight.md";
const PUBLIC_DIST_SCHEDULE_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/schedule";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

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

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("closure doc exists", exists(DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_REL));
assert("HEAD recorded", head.length >= 7, `HEAD=${head}`);

assert(
  "phase is august db insert execution closure",
  /G-20r3a-gosaki-schedule-august-db-insert-execution-closure/i.test(doc),
);
assert("insert executed 17", /insertExecutedCount: 17|insertedCount: 17|INSERT count.*17/i.test(doc));
assert("hold excluded 2", /holdExcludedCount: 2|hold not inserted|008.*018/i.test(doc));
assert("published true 14", /publishedTrueCount: 14|published=true.*14/i.test(doc));
assert("published false 3", /publishedFalseCount: 3|published=false.*3/i.test(doc));
assert("after verification all PASS", /all checks PASS/i.test(doc));
assert("sort_order bump +19", /sort_order.*\+19|sortOrderBumpRows: 60/i.test(doc));
assert("unpublished test rows unchanged", /unpublishedTestRowsUnchanged: 2|unchanged.*2/i.test(doc));
assert("db total rows after 79", /dbTotalRowsAfter: 79|DB total.*79|existing 62 \+ inserted 17/i.test(doc));
assert("published rows after 74", /publishedRowsAfter: 74|published rows after.*74/i.test(doc));
assert("mutation affected rows 77", /mutationAffectedRows: 77|mutation affected rows.*77/i.test(doc));
assert("not conflate 77 as db total", /not.*DB total|77.*mutation/i.test(doc));
assert("existing total before 62", /existingTotalRowsBefore: 62|existing 62/i.test(doc));

assert("hold 008 not inserted", /schedule-2026-08-008/i.test(doc));
assert("hold 018 not inserted", /schedule-2026-08-018/i.test(doc));

assert(
  "approvalId recorded",
  /G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice/i.test(doc),
);
assert("staging project kmjqppxjdnwwrtaeqjta", /kmjqppxjdnwwrtaeqjta/i.test(doc));
assert("rollback not needed", /rollbackNeeded: false/i.test(doc));
assert("g20r3 chain closed", /g20r3BatchInsertChainClosed: true|G-20r3.*closed/i.test(doc));

assert("staging DB august reflected", /stagingDbAugustReflected: true|DB.*reflected/i.test(doc));
assert("local package stale", /localPackageStale: true|package.*stale/i.test(doc));
assert("package regen not executed", /packageRegenExecuted: false/i.test(doc));

assert("next G-20r4", /G-20r4-schedule-public-reflection-plan/i.test(doc));
assert("ready for G-20r4", /readyForG20r4SchedulePublicReflectionPlan: true/i.test(doc));

assert("cursor no SQL", /cursorSqlExecuted: false|Cursor.*no SQL/i.test(doc));
assert("cursor no DB write", /cursorDbWriteExecuted: false|Cursor.*no.*DB write/i.test(doc));
assert("no FTP in doc phase", /ftpUploadExecuted: false/i.test(doc));
assert("no build in doc phase", /buildExecuted: false/i.test(doc));

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
  assert("public-dist schedule dirs exist", scheduleDirs.length > 0);
  assert(
    "public-dist no 2026-08 dir (stale)",
    !scheduleDirs.includes("2026-08"),
    `found: ${scheduleDirs.join(", ")}`,
  );
  assert(
    "public-dist has 2026-07 (pre-aug artifact)",
    scheduleDirs.includes("2026-07"),
  );
}

assert("00-current-state mentions G-20r3a", /G-20r3a|august-db-insert-execution-closure/i.test(currentState));
assert("03-next-actions mentions G-20r3a", /G-20r3a|august-db-insert-execution-closure/i.test(nextActions));
assert("handoff mentions G-20r3a", /G-20r3a|august-db-insert-execution-closure/i.test(handoff));
assert("03-next-actions next G-20r4", /G-20r4-schedule-public-reflection-plan/i.test(nextActions));

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
  `\nG-20r3a Gosaki schedule August DB INSERT execution closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
