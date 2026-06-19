/**
 * G-9g4a2 — Single-text-field operational commonization planning (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2-framework-single-text-field-operational-commonization-planning";
const NEXT_PHASE = "G-9g4a2-framework-single-text-field-operational-commonization-implementation";
const DOC_NAME = "staging-shell-schedule-single-text-field-operational-commonization-planning.md";
const PRIOR_COMMIT = "849ac6f";
const G9G4A2A_CLOSURE_COMMIT = "105c6b1";

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

assert("phase G-9g4a2 framework planning exists", docSrc.includes(PHASE));
assert("status complete exists", docSrc.includes("**complete**"));
assert(
  "G-9g4a1 venue round-trip referenced",
  docSrc.includes("G-9g4a1") && docSrc.includes("venue-only round-trip"),
);
assert(
  "G-9g4a2a open_time round-trip referenced",
  docSrc.includes("G-9g4a2a") && docSrc.includes("open_time-only round-trip"),
);
assert(
  "problem per-field repetition exists",
  docSrc.includes("per-field") || docSrc.includes("copy-paste"),
);
assert(
  "decision config-driven framework exists",
  docSrc.includes("config-driven") && docSrc.includes("framework"),
);
assert(
  "target fields open_time start_time price",
  docSrc.includes("open_time") &&
    docSrc.includes("start_time") &&
    docSrc.includes("price"),
);
assert(
  "description excluded",
  docSrc.includes("description") &&
    (docSrc.includes("operational") || docSrc.includes("G-9g3g4")),
);
assert(
  "title excluded",
  docSrc.includes("title") && docSrc.includes("out of scope"),
);
assert(
  "config schema SingleTextFieldOperationalField exists",
  docSrc.includes("SingleTextFieldOperationalField"),
);
assert(
  "guard strategy exists",
  docSrc.includes("Guard strategy") || docSrc.includes("assertSingleTextField"),
);
assert(
  "UI strategy exists",
  docSrc.includes("UI strategy"),
);
assert(
  "Save strategy exists",
  docSrc.includes("Save strategy"),
);
assert(
  "verifier strategy exists",
  docSrc.includes("Verifier strategy"),
);
assert(
  "manual test reduction policy exists",
  docSrc.includes("Manual test reduction policy"),
);
assert(
  "do not repeat start_time price round-trip",
  docSrc.includes("start_time") &&
    docSrc.includes("price") &&
    (docSrc.includes("do not repeat") || docSrc.includes("Do **not** repeat")),
);
assert(
  "restore policy exists",
  docSrc.includes("Restore policy"),
);
assert(
  "optimistic lock policy exists",
  docSrc.includes("Optimistic lock policy") || docSrc.includes("expectedBeforeUpdatedAt"),
);
assert(
  "re-click prevention policy exists",
  docSrc.includes("Re-click prevention policy") || docSrc.includes("re-click"),
);
assert(
  "mutual exclusion policy exists",
  docSrc.includes("Mutual exclusion policy"),
);
assert(
  "gosaki minimal commonization exists",
  docSrc.includes("gosaki") &&
    (docSrc.includes("minimal") || docSrc.includes("do not over-abstract")),
);
assert(
  "routine dev safety exists",
  docSrc.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    docSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"),
);
assert(
  "no UI operation marker exists",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**") &&
    docSrc.includes("Row picker clicked (Cursor/AI) | **no**"),
);
assert(
  "no DB write marker exists",
  docSrc.includes("DB write executed (this phase) | **no**"),
);
assert(
  "no SQL execution marker exists",
  docSrc.includes("SQL mutation executed (this phase) | **no**"),
);
assert(
  "no FTP/deploy marker exists",
  docSrc.includes("FTP / workflow_dispatch / deploy") &&
    docSrc.includes("not executed"),
);
assert("prior commit 849ac6f referenced", docSrc.includes(PRIOR_COMMIT));
assert(
  "G-9g4a2a closure commit 105c6b1 referenced",
  docSrc.includes(G9G4A2A_CLOSURE_COMMIT),
);
assert("next phase implementation recommendation exists", docSrc.includes(NEXT_PHASE));
assert(
  "not start_time-only manual execution",
  docSrc.includes("start_time`-only manual execution") ||
    docSrc.includes("start_time-only manual execution"),
);
assert(
  "markerRemainsInStagingDb false",
  docSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "activeRestoreExceptionsCount 0",
  docSrc.includes("activeRestoreExceptionsCount: 0"),
);
assert(
  "readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation",
  docSrc.includes("readyForG9g4a2FrameworkSingleTextFieldOperationalCommonizationImplementation: true"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert(
  "current state G-9g4a2 framework planning complete",
  currentStateSrc.includes("G-9g4a2-framework-single-text-field-operational-commonization-planning") &&
    (currentStateSrc.includes("planning complete") ||
      currentStateSrc.includes("planning **complete**")),
);
assert(
  "current state next implementation phase",
  currentStateSrc.includes(NEXT_PHASE) ||
    currentStateSrc.includes("commonization-implementation"),
);
assert(
  "next actions implementation ready",
  nextActionsSrc.includes(NEXT_PHASE) || nextActionsSrc.includes("implementation"),
);
assert(
  "handoff manual round-trip reduction policy",
  handoffSrc.includes("start_time") &&
    handoffSrc.includes("price") &&
    (handoffSrc.includes("do not repeat") || handoffSrc.includes("Do **not** repeat")),
);
assert(
  "handoff not start_time-only manual execution",
  handoffSrc.includes("start_time") && handoffSrc.includes("manual execution"),
);

console.log(`\nG-9g4a2 framework planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
