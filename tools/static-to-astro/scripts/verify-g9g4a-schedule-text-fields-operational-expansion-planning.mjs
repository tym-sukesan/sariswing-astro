/**
 * G-9g4a — Schedule text fields operational expansion planning (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a-schedule-text-fields-operational-expansion-planning";
const NEXT_PHASE = "G-9g4a1-venue-only-operational-expansion-implementation";
const PRIOR_COMMIT = "aebbf98";
const DOC_NAME = "staging-shell-schedule-text-fields-operational-expansion-planning.md";

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
assert("planning doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert(
  "text field support audit",
  docSrc.includes("Current text field support audit") ||
    docSrc.includes("text field support audit"),
);
assert(
  "venue-only rationale",
  docSrc.includes("Venue-only first slice rationale") ||
    docSrc.includes("venue-only first slice"),
);
assert(
  "G-9g4a1 venue-only plan",
  docSrc.includes("G-9g4a1 venue-only implementation plan") ||
    docSrc.includes("G-9g4a1 venue-only"),
);
assert(
  "target row recommendation",
  docSrc.includes("Target row recommendation") || docSrc.includes("target row"),
);
assert(
  "venue smoke candidate",
  docSrc.includes("Venue smoke candidate") || docSrc.includes("venue smoke"),
);
assert(
  "approval ID / env arm proposal",
  docSrc.includes("Approval ID / env arm proposal") ||
    docSrc.includes("G-9g4a1-schedule-site-slug-venue-only-non-dry-run"),
);
assert(
  "safety gates",
  docSrc.includes("Safety gates") || docSrc.includes("safety gates"),
);
assert(
  "restore strategy",
  docSrc.includes("Restore strategy") || docSrc.includes("restore strategy"),
);
assert(
  "CMS Kit generalization impact",
  docSrc.includes("CMS Kit generalization impact") ||
    docSrc.includes("generalization impact"),
);
assert("next phase recommendation", docSrc.includes(NEXT_PHASE));
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));
assert("prior commit aebbf98", docSrc.includes(PRIOR_COMMIT));
assert(
  "venue approval ID",
  docSrc.includes("G-9g4a1-schedule-site-slug-venue-only-non-dry-run"),
);
assert(
  "venue env arm",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED"),
);
assert("G-9g4a1 slice", docSrc.includes("G-9g4a1"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a", currentStateSrc.includes("G-9g4a"));
assert(
  "current state 9a38c11 or G-9g4a1",
  currentStateSrc.includes("9a38c11") || currentStateSrc.includes("G-9g4a1"),
);
assert(
  "next actions G-9g4a1 or G-9g4a1a",
  nextActionsSrc.includes("G-9g4a1"),
);
assert(
  "handoff G-9g4a1",
  handoffSrc.includes("G-9g4a1"),
);

console.log(`\nG-9g4a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
