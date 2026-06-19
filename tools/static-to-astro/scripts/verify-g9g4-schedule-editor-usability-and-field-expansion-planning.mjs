/**
 * G-9g4 — Schedule editor usability and field expansion planning (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4-schedule-editor-usability-and-field-expansion-planning";
const NEXT_PHASE = "G-9g4a-schedule-text-fields-operational-expansion-planning";
const PRIOR_COMMIT = "507f4b1";
const DOC_NAME = "staging-shell-schedule-editor-usability-and-field-expansion-planning.md";

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

assert("phase G-9g4", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert(
  "current proven scope",
  docSrc.includes("Current proven scope") || docSrc.includes("current proven scope"),
);
assert("field inventory", docSrc.includes("Field inventory") || docSrc.includes("field inventory"));
assert(
  "field risk matrix",
  docSrc.includes("Field risk matrix") || docSrc.includes("field risk matrix"),
);
assert(
  "recommended expansion order",
  docSrc.includes("Recommended field expansion order") ||
    docSrc.includes("recommended expansion order"),
);
assert(
  "UI/UX planning",
  docSrc.includes("UI/UX planning") || docSrc.includes("UI/UX"),
);
assert(
  "safety requirements",
  docSrc.includes("Safety requirements") || docSrc.includes("safety requirements"),
);
assert(
  "CMS Kit generalization impact",
  docSrc.includes("CMS Kit generalization impact") ||
    docSrc.includes("generalization impact"),
);
assert("next phase recommendation", docSrc.includes(NEXT_PHASE));
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));
assert("prior commit 507f4b1", docSrc.includes(PRIOR_COMMIT));
assert("description operational proven", docSrc.includes("description"));
assert("G-9g4a in expansion order", docSrc.includes("G-9g4a"));
assert("G-9g4b date", docSrc.includes("G-9g4b"));
assert("never editable id", docSrc.includes("never") && docSrc.includes("legacy_id"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4", currentStateSrc.includes("G-9g4"));
assert("current state aebbf98", currentStateSrc.includes("aebbf98"));
assert(
  "next actions G-9g4a or G-9g4a1",
  nextActionsSrc.includes("G-9g4a") || nextActionsSrc.includes("G-9g4a1"),
);
assert(
  "handoff G-9g4 or G-9g4a",
  handoffSrc.includes("G-9g4") || handoffSrc.includes("field expansion"),
);

console.log(`\nG-9g4 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
