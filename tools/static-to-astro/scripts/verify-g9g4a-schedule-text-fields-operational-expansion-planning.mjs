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

assert("phase G-9g4a or G-9g4a2", docSrc.includes(PHASE) || docSrc.includes("G-9g4a2-text-fields-operational-expansion-planning"));
assert("status complete", docSrc.includes("**complete**"));
assert(
  "text field support audit or G-9g4a1 round-trip",
  docSrc.includes("Current text field support audit") ||
    docSrc.includes("text field support audit") ||
    docSrc.includes("G-9g4a1 round-trip completion summary"),
);
assert(
  "venue-only rationale or open_time slice",
  docSrc.includes("Venue-only first slice rationale") ||
    docSrc.includes("venue-only first slice") ||
    docSrc.includes("open_time` only") ||
    docSrc.includes("open_time only"),
);
assert(
  "G-9g4a1 venue-only plan or G-9g4a2a plan",
  docSrc.includes("G-9g4a1 venue-only implementation plan") ||
    docSrc.includes("G-9g4a1 venue-only") ||
    docSrc.includes("G-9g4a2a-open-time-only"),
);
assert(
  "target row recommendation",
  docSrc.includes("Target row recommendation") ||
    docSrc.includes("target row") ||
    docSrc.includes("Suggested target row"),
);
assert(
  "smoke candidate",
  docSrc.includes("Venue smoke candidate") ||
    docSrc.includes("venue smoke") ||
    docSrc.includes("open_time smoke"),
);
assert(
  "approval ID / env arm proposal",
  docSrc.includes("Approval ID / env arm proposal") ||
    docSrc.includes("G-9g4a1-schedule-site-slug-venue-only-non-dry-run") ||
    docSrc.includes("G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run"),
);
assert(
  "safety gates",
  docSrc.includes("Safety gates") ||
    docSrc.includes("safety gates") ||
    docSrc.includes("Safety flags"),
);
assert(
  "restore strategy",
  docSrc.includes("Restore strategy") ||
    docSrc.includes("restore strategy") ||
    docSrc.includes("Restore required policy"),
);
assert(
  "CMS Kit generalization impact or reuse from G-9g4a1",
  docSrc.includes("CMS Kit generalization impact") ||
    docSrc.includes("generalization impact") ||
    docSrc.includes("Reuse from G-9g4a1"),
);
assert(
  "next phase recommendation",
  docSrc.includes(NEXT_PHASE) || docSrc.includes("G-9g4a2a-open-time-only-operational-expansion-implementation"),
);
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));
assert("prior commit aebbf98", docSrc.includes(PRIOR_COMMIT));
assert(
  "venue approval ID or G-9g4a2a approval ID",
  docSrc.includes("G-9g4a1-schedule-site-slug-venue-only-non-dry-run") ||
    docSrc.includes("G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run"),
);
assert(
  "venue env arm or G-9g4a2a env arm proposal",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED") ||
    docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED"),
);
assert("G-9g4a1 or G-9g4a2 slice", docSrc.includes("G-9g4a1") || docSrc.includes("G-9g4a2"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a", currentStateSrc.includes("G-9g4a"));
assert(
  "current state 9a38c11 or G-9g4a1",
  currentStateSrc.includes("9a38c11") || currentStateSrc.includes("G-9g4a1"),
);
assert(
  "next actions G-9g4a1 or G-9g4a2a",
  nextActionsSrc.includes("G-9g4a"),
);
assert(
  "handoff G-9g4a1 or G-9g4a2",
  handoffSrc.includes("G-9g4a1") || handoffSrc.includes("G-9g4a2"),
);

console.log(`\nG-9g4a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
