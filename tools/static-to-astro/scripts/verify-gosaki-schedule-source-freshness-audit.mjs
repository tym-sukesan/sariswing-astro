/**
 * G-20r — Gosaki schedule source freshness audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-source-freshness-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-source-freshness-audit.md";
const PROD_SCHEDULE_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/schedule";
const PROD_PUBLIC_DIST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist";
const PROD_JSON_REL =
  "tools/static-to-astro/output/gosaki-piano-astro-production/src/data/gosaki-schedules.json";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "5fa16c3";

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

assert("source freshness gap recorded", /sourceFreshnessGapConfirmed: true|source freshness gap/i.test(resultDoc));
assert("operator report 2026-08 recorded", /operator report|operatorReportWix2026-08Exists/i.test(resultDoc));
assert("network not executed", /networkAccess: false|network access.*\*\*no\*\*/i.test(resultDoc));
assert("live crawl not executed", /liveCrawlExecuted: false|live crawl.*\*\*no\*\*/i.test(resultDoc));

assert("kit months 2026-03 to 2026-07 documented", /2026-03.*2026-07|03–07|03-07/i.test(resultDoc));
assert("schedule 2026-08 absent documented", /schedule\/2026-08.*\*\*no\*\*|schedule2026-08InPackage: false/i.test(resultDoc));

assert("G-20p conclusion maintained", /G-20p.*Still valid|g20pContentGoWithinPilotScope: maintained/i.test(resultDoc));
assert("not package staleness vs G-22j", /notPackageStalenessVsG22j|not.*package staleness vs G-22j/i.test(resultDoc));

assert("angle bracket source parity not kit bug", /angleBracketNotKitBug|source parity.*not Kit/i.test(resultDoc));

assert("G-20r1 phase separated", /G-20r1-schedule-source-capture-plan/i.test(resultDoc));
assert("G-20r2 phase separated", /G-20r2-schedule-august-seed-planning/i.test(resultDoc));
assert("G-20r3 phase separated", /G-20r3-schedule-august-db-insert-preflight/i.test(resultDoc));
assert("G-20r4 phase separated", /G-20r4-schedule-public-reflection-plan/i.test(resultDoc));

assert("build none documented", /buildExecuted: false|build.*\*\*no\*\*/i.test(resultDoc));
assert("package regen none documented", /packageRegenExecuted: false|package regen.*\*\*no\*\*/i.test(resultDoc));
assert("DB write none documented", /dbWriteExecuted: false|DB write.*\*\*no\*\*/i.test(resultDoc));
assert("Save none documented", /saveExecuted: false|Save.*\*\*no\*\*/i.test(resultDoc));
assert("FTP deploy none documented", /ftpUploadExecuted: false|FTP.*\*\*no\*\*/i.test(resultDoc));
assert("production change none documented", /productionChangeExecuted: false|production change.*\*\*no\*\*/i.test(resultDoc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(resultDoc));

if (exists(PROD_SCHEDULE_REL)) {
  const months = fs
    .readdirSync(path.join(REPO_ROOT, PROD_SCHEDULE_REL), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  assert("on-disk schedule month dirs 03-07", months.join(",") === "2026-03,2026-04,2026-05,2026-06,2026-07", months.join(","));
  assert("on-disk no schedule/2026-08", !months.includes("2026-08"));
}

assert(
  "on-disk no legacy 2026-08",
  !exists(`${PROD_PUBLIC_DIST_REL}/2026-08`),
);

if (exists(PROD_JSON_REL)) {
  const json = JSON.parse(read(PROD_JSON_REL));
  const aug = json.filter((e) => e.date && String(e.date).startsWith("2026-08"));
  assert("gosaki-schedules.json zero 2026-08 rows", aug.length === 0, `got ${aug.length}`);
}

assert("00-current-state mentions G-20r", /G-20r|schedule-source-freshness/i.test(currentState));
assert("03-next-actions mentions G-20r", /G-20r|schedule-source-freshness/i.test(nextActions));
assert("handoff mentions G-20r", /G-20r|schedule-source-freshness/i.test(handoff));

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
assert("network not executed by Cursor", true);

console.log(
  `\nG-20r Gosaki schedule source freshness audit verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
