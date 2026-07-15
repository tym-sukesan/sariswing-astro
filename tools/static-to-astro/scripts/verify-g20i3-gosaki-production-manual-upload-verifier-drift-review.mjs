/**
 * G-20i3 Gosaki production manual-upload verifier drift review verifier.
 * Documents drift fix — no package build / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-manual-upload-verifier-drift-review.md";
const G20U38B_DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-generation-at-head-result.md";
const G20I3_SCRIPT = "tools/static-to-astro/scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs";
const PHASE = "G-20i3-gosaki-production-manual-upload-verifier-drift-review";
const GATE = "gosakiProductionManualUploadVerifierDriftReviewed: true";
const NEXT = "G-20u38b2-gosaki-production-package-regeneration-at-current-head";
const REVIEW_HEAD = "de960b7";
const PACKAGE_HEAD = "4259c8c";

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

assert("drift review doc exists", exists(DOC_REL));
assert("G-20u38b result doc exists", exists(G20U38B_DOC_REL));
assert("G-20i3 verifier script exists", exists(G20I3_SCRIPT));

const doc = read(DOC_REL);
const g20u38bDoc = read(G20U38B_DOC_REL);
const g20i3Script = read(G20I3_SCRIPT);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "G20I3_VERIFIER_DRIFT_RESOLVED true",
  /G20I3_VERIFIER_DRIFT_RESOLVED:\s*true|g20i3VerifierDriftResolved:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false|productionUploadReady:\s*false/i.test(doc),
);
assert(
  "package still stale",
  /stale|4259c8c/i.test(doc) && /de960b7|current HEAD/i.test(doc),
);
assert(
  "no package regeneration",
  /Package regeneration.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert("drift cause section", /Drift cause/i.test(doc));
assert("changed files section", /Changed files/i.test(doc));
assert("P0 checks preserved", /P0 checks preserved/i.test(doc));
assert("orphan asset P2", /orphan|P2/i.test(doc));
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("review HEAD de960b7", doc.includes(REVIEW_HEAD));
assert("package generation HEAD 4259c8c", doc.includes(PACKAGE_HEAD));

assert(
  "G-20i3 no hardcoded fileCount 28 only",
  g20i3Script.includes("MIN_PRODUCTION_PUBLIC_DIST_FILE_COUNT") &&
    !/EXPECTED_PUBLIC_DIST_COUNT\s*=\s*28/.test(g20i3Script),
);
assert(
  "G-20i3 manifest fileCount matches public-dist",
  g20i3Script.includes("manifest fileCount matches public-dist"),
);
assert(
  "G-20i3 manifest admin flags flexible",
  g20i3Script.includes("adminExcludedFromPackage") &&
    g20i3Script.includes("includeReadOnlyAdmin false if present"),
);

assert(
  "G-20u38b drift resolved cross-ref",
  g20u38bDoc.includes("g20i3VerifierDriftResolved: true") ||
    g20u38bDoc.includes("G20I3_VERIFIER_DRIFT_RESOLVED"),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20i3-gosaki-production-manual-upload-verifier-drift-review",
  ),
);
assert(
  "00-current-state mentions G-20i3 drift review",
  currentState.includes("G-20i3") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions drift review",
  nextActions.includes("G-20i3") || nextActions.includes("drift"),
);
assert(
  "handoff mentions drift review",
  handoff.includes("G-20i3") || handoff.includes("drift"),
);

console.log(
  `\nverify-g20i3-gosaki-production-manual-upload-verifier-drift-review: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
