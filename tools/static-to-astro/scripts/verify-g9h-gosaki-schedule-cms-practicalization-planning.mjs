/**
 * G-9h — Gosaki schedule CMS practicalization planning (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9h-gosaki-schedule-cms-practicalization-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9h-gosaki-schedule-cms-practicalization-planning";
const DOC_NAME = "gosaki-schedule-cms-practicalization-planning.md";
const NEXT_PHASE = "G-9h1-gosaki-client-preview-feedback-closure";

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

const docPath = path.join(TOOL_ROOT, `docs/${DOC_NAME}`);
assert("planning doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9h", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("G-9g4a2 framework reference", docSrc.includes("G-9g4a2"));
assert("G-9d public read reference", docSrc.includes("G-9d"));
assert("G-9f staging shell read reference", docSrc.includes("G-9f"));
assert(
  "readyForAnyDbWrite false",
  docSrc.includes("readyForAnyDbWrite: false"),
);
assert(
  "readyForG9g4a2FrameworkSmokeNonDryRunSave false",
  docSrc.includes("readyForG9g4a2FrameworkSmokeNonDryRunSave: false"),
);
assert(
  "readyForProductionCutover false",
  docSrc.includes("readyForProductionCutover: false"),
);
assert(
  "readyForFtpAutoApply false",
  docSrc.includes("readyForFtpAutoApply: false"),
);
assert(
  "client preview feedback candidate",
  docSrc.includes("Client preview feedback"),
);
assert(
  "public schedule read UX candidate",
  docSrc.includes("Public schedule read"),
);
assert(
  "schedule CMS practicalization candidate",
  docSrc.includes("Schedule CMS practicalization"),
);
assert("YouTube embed candidate", docSrc.includes("YouTube embed"));
assert(
  "start_time price policy",
  docSrc.includes("start_time") && docSrc.includes("price"),
);
assert("G-9h1 recommended", docSrc.includes("G-9h1-gosaki-client-preview-feedback-closure"));
assert("G-9h2 recommended", docSrc.includes("G-9h2-gosaki-public-schedule-read-verification-and-reupload-planning"));
assert("G-9h3 recommended", docSrc.includes("G-9h3-gosaki-schedule-cms-practicalization-phase-boundary"));
assert("G-9i YouTube planning", docSrc.includes("G-9i-gosaki-youtube-embed-planning"));
assert(
  "next phase G-9h1 client feedback",
  docSrc.includes(NEXT_PHASE),
);
assert(
  "NOT next start_time-only manual",
  docSrc.includes("start_time-only manual") ||
    docSrc.includes("start_time-only manual non-dry-run"),
);
assert("Phase 1 boundary", docSrc.includes("Phase 1"));
assert("Phase 2 boundary", docSrc.includes("Phase 2"));
assert("service_role prohibited", docSrc.includes("service_role"));
assert("FTP auto-apply prohibited", docSrc.includes("FTP auto-apply"));
assert("production cutover deferred", docSrc.includes("Production cutover"));
assert("/admin not touched", docSrc.includes("/admin"));
assert("schedule_months write prohibited", docSrc.includes("schedule_months"));
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no Preview click marker", docSrc.includes("Preview clicked (Cursor/AI) | **no**"));
assert("no Save click marker", docSrc.includes("Save clicked (this phase) | **no**"));
assert(
  "manual round-trip reduction policy",
  docSrc.includes("manual round-trip") || docSrc.includes("per-field manual"),
);
assert(
  "G-9a reference",
  docSrc.includes("gosaki-cms-scope-and-schedule-youtube-planning"),
);
assert(
  "G-9d3 reference",
  docSrc.includes("gosaki-preview-review-and-next-implementation-planning"),
);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
