/**
 * G-20u38c Gosaki production package verification review verifier.
 * Read-only review — no package build / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-verification-review.md";
const PRIOR_DOCS = [
  "tools/static-to-astro/docs/gosaki-production-package-prep-planning.md",
  "tools/static-to-astro/docs/gosaki-production-profile-static-preflight-result.md",
  "tools/static-to-astro/docs/gosaki-production-package-generation-at-head-result.md",
  "tools/static-to-astro/docs/gosaki-production-manual-upload-verifier-drift-review.md",
  "tools/static-to-astro/docs/gosaki-production-package-regeneration-at-current-head-result.md",
];
const MANIFEST_PATH = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano-production/MANIFEST.json",
);
const PHASE = "G-20u38c-gosaki-production-package-verification-review";
const GATE = "gosakiProductionPackageVerificationReviewed: true";
const NEXT =
  "G-20u38d-gosaki-production-ftp-remote-path-confirmation-and-upload-checklist";
const REVIEW_HEAD = "2831629";
const REVIEWED_SOURCE_COMMIT = "1c1fb97";
const TBD_REMOTE = "TBD_G-20i";

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

function headShort() {
  return spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).stdout.trim();
}

assert("verification review doc exists", exists(DOC_REL));
for (const rel of PRIOR_DOCS) {
  assert(`prior doc ${path.basename(rel)}`, exists(rel));
}

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const head = headShort();

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("review HEAD 2831629", doc.includes(REVIEW_HEAD));
assert("reviewed sourceCommit 1c1fb97", doc.includes(REVIEWED_SOURCE_COMMIT));
assert(
  "on-disk package stale",
  /onDiskPackageStale:\s*true|stale/i.test(doc) && doc.includes(REVIEWED_SOURCE_COMMIT),
);
assert(
  "PRODUCTION_PACKAGE_VERIFIED_LOCALLY true",
  /PRODUCTION_PACKAGE_VERIFIED_LOCALLY:\s*true|productionPackageVerifiedLocally:\s*true/i.test(
    doc,
  ),
);
assert(
  "PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD false",
  /PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD:\s*false|productionPackageVerifiedForUpload:\s*false/i.test(
    doc,
  ),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false|productionUploadReady:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional/i.test(doc),
);
assert(
  "no package generation",
  /Package regeneration.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no build execution",
  /Build execution.*\*\*no\*\*|buildExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("local verification summary", /Local verification summary/i.test(doc));
assert("final upload package conditions", /Final upload package conditions/i.test(doc));
assert("STOP conditions", /STOP conditions/i.test(doc));
assert("remote path operator confirmation", /operator confirmation required|operatorConfirmationRequired/i.test(doc));
assert("TBD remote path", doc.includes(TBD_REMOTE));
assert("guessed remote path must not", /Do not guess|must not be used|must not guess/i.test(doc));
assert("public-dist contents only", /contents of `public-dist\/`/i.test(doc));
assert("FileZilla manual only", /FileZilla manual/i.test(doc));
assert("G-20u38b2 build exit 0 documented", /exit \*\*0\*\*|74\/74/i.test(doc));
assert("G-20i3 drift resolved referenced", /G20I3.*resolved|drift.*resolved/i.test(doc));
assert("current-active-regression 23/23", /23\/23/i.test(doc));
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("G-20u38d next phase", doc.includes("G-20u38d"));
assert("G-20u38e regen phase", doc.includes("G-20u38e"));
assert("G-20u38f manual FTP phase", doc.includes("G-20u38f"));
assert("G-20u38g result record phase", doc.includes("G-20u38g"));

if (fs.existsSync(MANIFEST_PATH)) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  assert(
    "on-disk manifest sourceCommit 1c1fb97",
    manifest.sourceCommit.startsWith(REVIEWED_SOURCE_COMMIT),
    manifest.sourceCommit,
  );
  if (manifest.sourceCommit.startsWith(REVIEWED_SOURCE_COMMIT) && head !== REVIEWED_SOURCE_COMMIT) {
    console.log(
      `NOTE on-disk package stale — sourceCommit ${manifest.sourceCommit.slice(0, 7)} vs HEAD ${head} — expected`,
    );
    passed += 1;
  } else if (manifest.sourceCommit.startsWith(head)) {
    assert("on-disk manifest matches current HEAD", true);
  }
  assert("manifest intendedRemotePath TBD", manifest.intendedRemotePath === TBD_REMOTE);
} else {
  console.log("NOTE production MANIFEST missing — stale check skipped");
}

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u38c-gosaki-production-package-verification-review",
  ),
);
assert(
  "00-current-state mentions G-20u38c",
  currentState.includes("G-20u38c") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u38c",
  nextActions.includes("G-20u38c") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u38c",
  handoff.includes("G-20u38c") || handoff.includes(PHASE),
);

console.log(
  `\nverify-g20u38c-gosaki-production-package-verification-review: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
