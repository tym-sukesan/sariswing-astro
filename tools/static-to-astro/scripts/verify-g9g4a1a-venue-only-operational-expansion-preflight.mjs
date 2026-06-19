/**
 * G-9g4a1a — Venue-only operational expansion preflight (no Save/Preview/DB/SQL by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1a-venue-only-operational-expansion-preflight";
const NEXT_PHASE = "G-9g4a1b-venue-only-operational-expansion-execution-runbook";
const PRIOR_COMMIT = "49986c1";
const DOC_NAME = "staging-shell-schedule-venue-only-operational-expansion-preflight.md";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const docPath = path.join(TOOL_ROOT, `docs/${DOC_NAME}`);
assert("preflight doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a1a", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert(
  "target row selection strategy",
  docSrc.includes("Target row selection strategy") ||
    docSrc.includes("target row selection strategy"),
);
assert("Option A", docSrc.includes("Option A"));
assert(
  "fallback row",
  docSrc.includes("888c58f2-f152-4563-a3cf-a20d7c2456c1") ||
    docSrc.includes("Option B"),
);
assert(
  "beforeSnapshot template",
  docSrc.includes("beforeSnapshot template") || docSrc.includes("beforeSnapshot"),
);
assert(
  "smoke candidate",
  docSrc.includes("Smoke candidate") || docSrc.includes("smoke candidate"),
);
assert(
  "env stack",
  docSrc.includes("Env stack") || docSrc.includes("env stack"),
);
assert(
  "G-9g4a1 arm only",
  docSrc.includes("G-9g4a1 arm") && docSrc.includes("on"),
);
assert(
  "G-9g3g arm off",
  docSrc.includes("G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED") &&
    docSrc.includes("off"),
);
assert(
  "G-9g3g5 arm off",
  docSrc.includes("G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED") &&
    docSrc.includes("off"),
);
assert(
  "rollback SQL document-only",
  docSrc.includes("Rollback SQL") || docSrc.includes("document-only"),
);
assert(
  "SQL do-not-run marker",
  docSrc.includes("DO NOT RUN") && docSrc.includes("G-9g4a1a preflight"),
);
assert(
  "restore strategy",
  docSrc.includes("Restore strategy") || docSrc.includes("restore strategy"),
);
assert(
  "operator checklist",
  docSrc.includes("Operator execution checklist") ||
    docSrc.includes("operator checklist"),
);
assert("next phase G-9g4a1b", docSrc.includes(NEXT_PHASE));
assert("no Save click marker", docSrc.includes("Save clicked (this phase) | **no**"));
assert(
  "no Preview click marker",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**"),
);
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert(
  "no SQL execution marker",
  docSrc.includes("SQL mutation executed (this phase) | **no**") ||
    docSrc.includes("SQL executed"),
);
assert(
  "no FTP/deploy marker",
  docSrc.includes("FTP") && docSrc.includes("not executed"),
);
assert("prior commit 49986c1", docSrc.includes(PRIOR_COMMIT));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1a", currentStateSrc.includes("G-9g4a1a"));
assert("current state 49986c1", currentStateSrc.includes("49986c1"));
assert("next actions G-9g4a1b", nextActionsSrc.includes("G-9g4a1b"));
assert(
  "handoff G-9g4a1a complete",
  handoffSrc.includes("G-9g4a1a") && handoffSrc.includes("G-9g4a1b"),
);

console.log(`\nG-9g4a1a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
