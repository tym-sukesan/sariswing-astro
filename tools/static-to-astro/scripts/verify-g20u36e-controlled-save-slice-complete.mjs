/**
 * G-20u36e controlled Save slice complete verifier.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-slice-complete.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-manual-upload-ui-pass-result.md";
const PHASE = "G-20u36e-controlled-save-slice-complete";
const GATE = "gosakiDiscographyControlledSaveSliceCompleted: true";
const RESULT_COMMIT = "bf6c863";
const UPLOADED_SOURCE_COMMIT =
  "8c9cd9210641d473c72c752f7b20903cb4d501bf";
const UPLOADED_SOURCE_SHORT = "8c9cd92";
const TITLE_MARKER = "On a Clear Day [CMS Kit staging G-20u36e]";
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
  "full loop PASS",
  /First controlled Save full loop.*PASS|firstControlledSaveFullLoopPass:\s*true/i.test(
    doc,
  ),
);
assert("result-record commit bf6c863", doc.includes(RESULT_COMMIT));
assert(
  "regression 23/23 PASS",
  /23\/23 PASS|currentActiveRegression:\s*23\/23 PASS/i.test(doc),
);
assert("DB Save PASS", /DB Save.*PASS|dbSavePass:\s*true/i.test(doc));
assert(
  "permission close PASS",
  /Permission close.*PASS|permissionClosePass:\s*true/i.test(doc),
);
assert(
  "post-close SELECT PASS",
  /Post-close SELECT.*PASS|postCloseSelectPass:\s*true/i.test(doc),
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
  "marker title visible",
  doc.includes(TITLE_MARKER) &&
    /markerTitleVisible:\s*true|marker title/i.test(doc),
);
assert(
  "Like a Lover visible",
  doc.includes(TRACK_7) &&
    /likeALoverVisible:\s*true|Like a Lover/i.test(doc),
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
  /Production changed.*no|productionChanged:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "uploaded sourceCommit 8c9cd92 recorded",
  doc.includes(UPLOADED_SOURCE_COMMIT) || doc.includes(UPLOADED_SOURCE_SHORT),
);
assert(
  "current HEAD bf6c863 recorded",
  doc.includes(RESULT_COMMIT) &&
    /currentHead:\s*bf6c863|Current HEAD.*bf6c863/i.test(doc),
);
assert(
  "re-upload requires regeneration",
  /re-upload.*package regeneration|reUploadRequiresPackageRegeneration:\s*true|再生成必須/i.test(
    doc,
  ),
);
assert(
  "marker title restore before public noted",
  /restore.*On a Clear Day|markerTitleRestoreRequiredBeforeGosakiPublic:\s*true|Gosaki public/i.test(
    doc,
  ) && doc.includes(ORIGINAL_TITLE),
);
assert(
  "next candidate marker title restore",
  /Marker title restore|marker title restore slice/i.test(doc),
);
assert(
  "next candidate Discography Save UI generalization",
  /Discography Save UI generalization/i.test(doc),
);
assert(
  "next candidate Gosaki public-readiness QA",
  /Gosaki public-readiness QA/i.test(doc),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-slice-complete"),
);
assert(
  "AI current-state slice complete",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveSliceCompleted"),
);
assert(
  "AI next-actions slice complete or candidates",
  nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyControlledSaveSliceCompleted") ||
    /marker title restore|Discography Save UI|public-readiness/i.test(
      nextActions,
    ),
);
assert(
  "AI handoff slice complete",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveSliceCompleted") ||
    /marker title restore|Discography Save UI|public-readiness/i.test(handoff),
);
assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36e-controlled-save-slice-complete: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
