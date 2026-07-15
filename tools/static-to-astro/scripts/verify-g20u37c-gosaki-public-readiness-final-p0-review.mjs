/**
 * G-20u37c Gosaki public-readiness final P0 review verifier.
 * Final review result record only — no implementation / Save / SQL / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-final-p0-review.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-qa-planning.md";
const STATIC_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-static-inspection-result.md";
const BROWSER_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-manual-browser-qa-result.md";
const PHASE = "G-20u37c-gosaki-public-readiness-final-p0-review";
const GATE = "gosakiPublicReadinessFinalP0Reviewed: true";
const NEXT = "G-20u38-gosaki-production-package-prep-planning";
const ALT_NEXT = "Contact HubSpot submit E2E";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const REVIEW_HEAD = "03052d0";

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

assert("final P0 review doc exists", exists(DOC_REL));
assert("planning doc exists", exists(PLAN_DOC_REL));
assert("G-20u37a doc exists", exists(STATIC_DOC_REL));
assert("G-20u37b doc exists", exists(BROWSER_DOC_REL));

const doc = read(DOC_REL);
const staticDoc = read(STATIC_DOC_REL);
const browserDoc = read(BROWSER_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
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
  "STAGING_QA_COMPLETE true",
  /STAGING_QA_COMPLETE:\s*true|stagingQaComplete:\s*true/i.test(doc),
);
assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional/i.test(doc),
);
assert(
  "PUBLIC_P0_READY_FOR_PRODUCTION_PACKAGE_PREP true",
  /PUBLIC_P0_READY_FOR_PRODUCTION_PACKAGE_PREP:\s*true|publicP0ReadyForProductionPackagePrep:\s*true/i.test(
    doc,
  ),
);
assert("review HEAD 03052d0", doc.includes(REVIEW_HEAD));
assert("artifact sourceCommit e3616a3", doc.includes(SOURCE_COMMIT));
assert("regression 23/23", /23\/23 PASS/i.test(doc));
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("alternate next contact E2E", doc.includes(ALT_NEXT));
assert(
  "conditional reason production package not done",
  /production package generation.*not yet|Production package generation.*not yet/i.test(
    doc,
  ),
);
assert(
  "conditional reason admin exclude",
  /production package must exclude.*admin|must exclude.*\/admin\//i.test(doc),
);
assert(
  "conditional reason contact E2E",
  /Contact.*HubSpot submit E2E not executed|submit E2E not executed/i.test(doc),
);
assert(
  "admin production policy section",
  /Admin production policy/i.test(doc),
);
assert(
  "admin prod must not include admin",
  /must NOT be included|must exclude.*admin/i.test(doc),
);
assert(
  "contact submit E2E P1 classification",
  /submit E2E.*P1|P1.*submit E2E/i.test(doc),
);
assert(
  "admin mobile P1 not P0",
  /Admin mobile.*P1|P1.*left-align/i.test(doc) &&
    /not P0|not a P0/i.test(doc),
);
assert("P1 carryovers section", /P1 carryovers/i.test(doc));
assert("P2 carryovers section", /P2 carryovers/i.test(doc));
assert(
  "static inspection rollup",
  /Static inspection rollup|G-20u37a/i.test(doc),
);
assert(
  "browser QA rollup",
  /Manual browser QA rollup|G-20u37b/i.test(doc),
);
assert(
  "prior G-20u37a gate",
  staticDoc.includes("gosakiPublicReadinessStaticInspectionCompleted: true"),
);
assert(
  "prior G-20u37b gate",
  browserDoc.includes("gosakiPublicReadinessManualBrowserQaCompleted: true"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u37c-gosaki-public-readiness-final-p0-review",
  ),
);
assert(
  "00-current-state mentions G-20u37c",
  currentState.includes("G-20u37c") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u37c",
  nextActions.includes("G-20u37c") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u37c",
  handoff.includes("G-20u37c") || handoff.includes(PHASE),
);

console.log(
  `\nverify-g20u37c-gosaki-public-readiness-final-p0-review: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
