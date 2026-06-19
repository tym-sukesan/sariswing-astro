/**
 * G-9g3h3 — CMS Kit Schedule editor generalization notes (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h3-cms-kit-generalization-notes";
const NEXT_PHASE = "G-9g4-schedule-editor-usability-and-field-expansion-planning";
const PRIOR_COMMIT = "7a4dc0d";
const DOC_NAME = "cms-kit-schedule-editor-generalization-notes.md";

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
assert("generalization doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g3h3", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("Gosaki proven items", docSrc.includes("What was proven in Gosaki"));
assert("site_slug selection", docSrc.includes("site_slug"));
assert("optimistic lock", docSrc.includes("optimistic lock") || docSrc.includes("expectedBeforeUpdatedAt"));
assert("re-click prevention", docSrc.includes("re-click prevention") || docSrc.includes("Re-click prevention"));
assert("restore exception registry", docSrc.includes("restore exception registry") || docSrc.includes("Restore exception lifecycle registry"));

assert(
  "generalized safety architecture",
  docSrc.includes("Generalized safety architecture") || docSrc.includes("generalized safety architecture"),
);
assert("staging-only host gate", docSrc.includes("host gate") || docSrc.includes("Staging-only host gate"));
assert("service_role forbidden", docSrc.includes("service_role") && docSrc.includes("Forbidden"));

assert(
  "reusable pipeline model",
  docSrc.includes("Reusable pipeline model") || docSrc.includes("pipeline model"),
);
assert("URL / source site", docSrc.includes("URL / source site"));
assert("dry-run Preview", docSrc.includes("dry-run Preview"));

assert(
  "per-site time reduction plan",
  docSrc.includes("Per-site time reduction") || docSrc.includes("time reduction plan"),
);
assert("already reusable", docSrc.includes("Already reusable") || docSrc.includes("already reusable"));
assert("must remain manual approval", docSrc.includes("Must remain manual approval") || docSrc.includes("manual approval"));

assert("kit defaults", docSrc.includes("Kit defaults") || docSrc.includes("kit defaults"));
assert("PUBLIC_ADMIN_WRITE_DRY_RUN", docSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"));

assert(
  "manual approval boundary",
  docSrc.includes("Must remain manual approval") || docSrc.includes("operator manual"),
);
assert(
  "never automate DB deploy",
  docSrc.includes("Should never be automated") &&
    (docSrc.includes("FTP") || docSrc.includes("deploy")) &&
    docSrc.includes("service_role"),
);

assert("remaining gaps", docSrc.includes("Remaining gaps") || docSrc.includes("remaining gaps"));
assert("next phase recommendation", docSrc.includes(NEXT_PHASE));

assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));

assert("prior commit 7a4dc0d", docSrc.includes(PRIOR_COMMIT));
assert("markerRemainsInStagingDb false", docSrc.includes("markerRemainsInStagingDb: false"));
assert("activeRestoreExceptionsCount 0", docSrc.includes("activeRestoreExceptionsCount: 0"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g3h3", currentStateSrc.includes("G-9g3h3"));
assert("current state 7a4dc0d", currentStateSrc.includes("7a4dc0d"));
assert(
  "next actions G-9g4 or generalization",
  nextActionsSrc.includes("G-9g4") || nextActionsSrc.includes("G-9g3h3"),
);
assert(
  "handoff generalization or G-9g4",
  handoffSrc.includes("G-9g3h3") || handoffSrc.includes("generalization") || handoffSrc.includes("G-9g4"),
);

console.log(`\nG-9g3h3 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
