/**
 * G-20u37b Gosaki public-readiness manual browser QA result verifier.
 * Result record only — no implementation / Save / SQL / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-manual-browser-qa-result.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-static-inspection-result.md";
const PHASE = "G-20u37b-gosaki-public-readiness-manual-browser-qa-result";
const GATE = "gosakiPublicReadinessManualBrowserQaCompleted: true";
const NEXT = "G-20u37c-gosaki-public-readiness-final-p0-review";
const ALT_NEXT = "Admin mobile layout polish";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const RESULT_HEAD = "d1b9c08";
const MARKER_TITLE = "On a Clear Day [CMS Kit staging G-20u36e]";
const ORIGINAL_TITLE = "On a Clear Day";
const TRACK_7 = "Like a Lover";

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

assert("result doc exists", exists(DOC_REL));
assert("prior G-20u37a doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "manual browser QA completed",
  /manualBrowserQaCompleted:\s*true|Manual browser QA executed.*yes/i.test(doc),
);
assert(
  "no implementation",
  /Implementation.*\*\*no\*\*|implementationExecuted:\s*false/i.test(doc),
);
assert(
  "no Save",
  /Save.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "no SQL",
  /SQL.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "no DB write",
  /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "no Edge deploy",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "no package generation",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production unchanged",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert(
  "P0_BLOCKERS false",
  /P0_BLOCKERS:\s*false|p0Blockers:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY conditional or not final",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional|publicReadyFinal:\s*false/i.test(
    doc,
  ),
);
assert(
  "STAGING_QA_READY YES",
  /STAGING_QA_READY:\s*YES|stagingQaReady:\s*true/i.test(doc),
);
assert(
  "STAGING_BROWSER_QA_READY YES",
  /STAGING_BROWSER_QA_READY:\s*YES|stagingBrowserQaReady:\s*true/i.test(doc),
);
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("alternate next admin mobile polish", doc.includes(ALT_NEXT));
assert("artifact sourceCommit e3616a3", doc.includes(SOURCE_COMMIT));
assert("result record HEAD d1b9c08", doc.includes(RESULT_HEAD));
assert("P0 findings section", /P0 findings/i.test(doc));
assert("P1 findings section", /P1 findings/i.test(doc));
assert("P2 findings section", /P2 findings/i.test(doc));
assert(
  "overall pass summary",
  /諸々問題なさそう|no major P0/i.test(doc),
);
assert(
  "admin mobile P1 left alignment",
  /left-aligned|左寄り/i.test(doc) && /P1/i.test(doc),
);
assert(
  "admin Save disabled",
  /Save.*disabled|Save disabled/i.test(doc),
);
assert(
  "dry-run only",
  /dry-run only|Dry-run only/i.test(doc),
);
assert(
  "discography On a Clear Day",
  doc.includes(ORIGINAL_TITLE) && !doc.includes(`present: ${MARKER_TITLE}`),
);
assert(
  "discography marker absent",
  /marker.*absent|Marker string.*absent/i.test(doc),
);
assert(
  "Like a Lover present",
  doc.includes(TRACK_7),
);
assert(
  "contact HubSpot visual pass",
  /HubSpot|Contact.*PASS/i.test(doc),
);
assert(
  "contact submit E2E not executed",
  /Submit E2E.*not executed|submit E2E not executed/i.test(doc),
);
assert(
  "public pages pass",
  /Home.*PASS|Public pages.*PASS/i.test(doc),
);
assert(
  "prior G-20u37a gate",
  priorDoc.includes("gosakiPublicReadinessStaticInspectionCompleted: true"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u37b-gosaki-public-readiness-manual-browser-qa-result",
  ),
);
assert(
  "00-current-state mentions G-20u37b",
  currentState.includes("G-20u37b") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u37b",
  nextActions.includes("G-20u37b") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u37b",
  handoff.includes("G-20u37b") || handoff.includes(PHASE),
);

console.log(
  `\nverify-g20u37b-gosaki-public-readiness-manual-browser-qa-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
