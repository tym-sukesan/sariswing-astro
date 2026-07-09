/**
 * G-20r4a — Gosaki schedule August generation path enablement verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-august-generation-path-enablement.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-august-generation-path-enablement.md";
const G20R4_REL = "tools/static-to-astro/docs/gosaki-schedule-public-reflection-plan.md";
const SCHEDULE_READ = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";
const ASTRO_GEN = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const DATA_PAGES = "tools/static-to-astro/scripts/lib/gosaki-schedule-data-pages.mjs";

const BASE_COMMIT = "cdbf1cc";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

const doc = read(DOC_REL);
const scheduleRead = read(SCHEDULE_READ);
const astroGen = read(ASTRO_GEN);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("HEAD is cdbf1cc", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is cdbf1cc", origin === BASE_COMMIT, `origin=${origin}`);

assert("enablement doc exists", exists(DOC_REL));
assert("G-20r4 plan doc exists", exists(G20R4_REL));
assert("schedule read module exists", exists(SCHEDULE_READ));
assert("astro generator exists", exists(ASTRO_GEN));
assert("gosaki schedule data pages exists", exists(DATA_PAGES));

assert(
  "phase is august generation path enablement",
  /G-20r4a-schedule-august-generation-path-enablement/i.test(doc),
);
assert("gate complete", /gosakiScheduleAugustGenerationPathEnablementComplete: true/i.test(doc));
assert("ready for G-20r4b", /readyForG20r4bLocalRegenDryRun: true/i.test(doc));
assert("expected months count 6", /expectedMonthsCount: 6|6 months/i.test(doc));

assert("expectedMonths includes 2026-08 in code", scheduleRead.includes('"2026-08"'));
assert(
  "expectedMonths array has six entries",
  /expectedMonths:\s*\[[\s\S]*"2026-08"[\s\S]*\]/m.test(scheduleRead),
);
assert(
  "expectedMonths ends with 2026-08",
  /"2026-07",\s*"2026-08"/.test(scheduleRead) ||
    /"2026-07", "2026-08"/.test(scheduleRead),
);

assert(
  "data-driven legacy stub from bundle.months",
  /useGosakiScheduleData[\s\S]*gosakiScheduleBundle\.months/.test(astroGen),
);
assert(
  "legacy stub uses generateScheduleLegacyMonthStubPage",
  astroGen.includes("generateScheduleLegacyMonthStubPage"),
);
assert(
  "legacy path year-month template",
  astroGen.includes("${year}-${month}/index.astro"),
);

assert("hub route documented", /\/schedule\//i.test(doc));
assert("canonical month 2026-08", /\/schedule\/2026-08\//i.test(doc));
assert("legacy 2026-08 stub", /\/2026-08\//i.test(doc));
assert("sitemap policy documented", /sitemap/i.test(doc));
assert("14 published august rows expected", /14.*August|August.*14/i.test(doc));

assert("package regen not executed", /packageRegenExecuted: false/i.test(doc));
assert("build not executed", /buildExecuted: false/i.test(doc));
assert("no ftp in phase", /ftpUploadExecuted: false/i.test(doc));

assert("00-current-state mentions G-20r4a", /G-20r4a|generation-path-enablement/i.test(currentState));
assert("03-next-actions mentions G-20r4a", /G-20r4a|generation-path-enablement/i.test(nextActions));
assert("handoff mentions G-20r4a", /G-20r4a|generation-path-enablement/i.test(handoff));
assert("03-next-actions next G-20r4b", /G-20r4b/i.test(nextActions));

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
  `\nG-20r4a Gosaki schedule August generation path enablement verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
