/**
 * G-20u36f marker title restore slice complete verifier.
 * Closure record only — no Save / SQL / package / FTP / Edge.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-slice-complete.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-manual-upload-ui-pass-result.md";
const PHASE = "G-20u36f-discography-marker-title-restore-slice-complete";
const GATE = "gosakiDiscographyMarkerTitleRestoreSliceCompleted: true";
const RESULT_COMMIT = "f4265b9";
const UPLOADED_SOURCE_COMMIT =
  "e3616a3ab0fbda280d75278b0a6275205ae74763";
const UPLOADED_SOURCE_SHORT = "e3616a3";
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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

assert("slice complete doc exists", exists(DOC_REL));
assert("prior manual-upload UI pass doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "result COMPLETE",
  /\*\*COMPLETE\*\*|result:\s*COMPLETE/i.test(doc),
);
assert(
  "restore full loop PASS",
  /marker title restore full loop.*PASS|markerTitleRestoreFullLoopPass:\s*true/i.test(
    doc,
  ),
);
assert("result-record commit f4265b9", doc.includes(RESULT_COMMIT));
assert(
  "regression 23/23 PASS",
  /23\/23 PASS|currentActiveRegression:\s*23\/23 PASS/i.test(doc),
);
assert(
  "pre-restore SELECT PASS",
  /Pre-restore SELECT.*PASS|preRestoreSelectPass:\s*true/i.test(doc),
);
assert(
  "permission open PASS",
  /permission open.*PASS|permissionOpenPass:\s*true/i.test(doc),
);
assert(
  "restore Save PASS",
  /Controlled restore Save.*PASS|restoreSavePass:\s*true/i.test(doc),
);
assert(
  "permission close PASS",
  /Permission close.*PASS|permissionClosePass:\s*true/i.test(doc),
);
assert(
  "post-close SELECT PASS",
  /post-close SELECT.*PASS|postCloseSelectPass:\s*true/i.test(doc),
);
assert(
  "package regeneration PASS",
  /Package regeneration.*PASS|packageRegenerationPass:\s*true/i.test(doc),
);
assert(
  "package freshness PASS",
  /Package freshness.*PASS|packageFreshnessPass:\s*true/i.test(doc),
);
assert(
  "manual FTP completed",
  /Manual FTP.*done|manualFtpUploadCompleted:\s*true|FileZilla/i.test(doc),
);
assert(
  "Admin UI PASS",
  /Admin UI.*PASS|adminUiPass:\s*true/i.test(doc),
);
assert(
  "Public UI PASS",
  /Public UI.*PASS|publicUiPass:\s*true/i.test(doc),
);
assert(
  "marker removed",
  /markerRemovedFromDbPackageStgUi:\s*true|Marker removed.*PASS|marker absent/i.test(
    doc,
  ),
);
assert(
  "original title restored",
  /originalTitleRestored:\s*true|Restored title.*On a Clear Day/i.test(doc) &&
    doc.includes(ORIGINAL_TITLE),
);
assert(
  "Like a Lover preserved",
  /likeALoverPreserved:\s*true|Like a Lover preserved/i.test(doc) &&
    doc.includes(TRACK_7),
);
assert(
  "permission closed",
  /permissionClosed:\s*true|Permission closed.*yes/i.test(doc),
);
assert(
  "no additional Save",
  /Additional Save.*no|additionalSaveExecuted:\s*false/i.test(doc),
);
assert(
  "no SQL",
  /SQL executed.*no|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "no DB write in this phase",
  /DB write.*no|dbWriteInThisPhase:\s*false/i.test(doc),
);
assert(
  "no package generation in this phase",
  /Package generation.*no|packageGenerationInThisPhase:\s*false/i.test(doc),
);
assert(
  "no FTP/upload in this phase",
  /FTP.*no|ftpUploadInThisPhase:\s*false/i.test(doc),
);
assert(
  "production unchanged",
  /Production changed.*no|productionChanged:\s*false|unchanged/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "uploaded sourceCommit e3616a3 recorded",
  doc.includes(UPLOADED_SOURCE_COMMIT) || doc.includes(UPLOADED_SOURCE_SHORT),
);
assert(
  "current HEAD f4265b9 recorded",
  doc.includes(RESULT_COMMIT) &&
    /currentHead:\s*f4265b9|Current HEAD.*f4265b9/i.test(doc),
);
assert(
  "re-upload requires regeneration",
  /re-upload.*package regeneration|reUploadRequiresPackageRegeneration:\s*true|再生成/i.test(
    doc,
  ),
);
assert(
  "no further FTP needed",
  /No further FTP|noFurtherFtpNeeded:\s*true/i.test(doc),
);
assert(
  "do not reupload e3616a3 without regen",
  /Do \*\*not\*\* re-upload the `e3616a3`|without regenerating/i.test(doc),
);
assert("marker title referenced", doc.includes(MARKER_TITLE));
assert(
  "next candidate Gosaki public-readiness QA",
  /Gosaki public-readiness QA/i.test(doc),
);
assert(
  "next candidate Discography Save UI generalization",
  /Discography Save UI generalization/i.test(doc),
);
assert(
  "next candidate Schedule YouTube About Contact Link Home",
  /Schedule.*YouTube.*About.*Contact.*Link.*Home/i.test(doc),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36f-marker-title-restore-slice-complete"),
);
assert(
  "AI current-state slice complete",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestoreSliceCompleted"),
);
assert(
  "AI next-actions slice complete or candidates",
  nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyMarkerTitleRestoreSliceCompleted") ||
    /public-readiness|Discography Save UI|Schedule.*YouTube/i.test(nextActions),
);
assert(
  "AI handoff slice complete",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestoreSliceCompleted") ||
    /public-readiness|Discography Save UI|Schedule.*YouTube/i.test(handoff),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36f-marker-title-restore-slice-complete: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
