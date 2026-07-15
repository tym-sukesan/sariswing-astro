/**
 * G-20u36f marker title restore manual upload UI pass result-record verifier.
 * Result record only — no Save / SQL / package regen / FTP re-upload.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-manual-upload-ui-pass-result.md";
const SAVE_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-save-result.md";
const PHASE = "G-20u36f-discography-marker-title-restore-manual-upload-ui-pass-result";
const GATE = "gosakiDiscographyMarkerTitleRestoreManualUploadUiPassCompleted: true";
const NEXT = "G-20u36f-discography-marker-title-restore-slice-complete";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const SOURCE_COMMIT_SHORT = "e3616a3";
const MARKER_TITLE = "On a Clear Day [CMS Kit staging G-20u36e]";
const ORIGINAL_TITLE = "On a Clear Day";
const TRACK_7 = "Like a Lover";
const ADMIN_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const PUBLIC_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const PUBLIC_BASE =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const REMOTE = "/cms-kit-staging/gosaki-piano/";

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

assert("manual upload UI pass result doc exists", exists(DOC_REL));
assert("save result doc exists", exists(SAVE_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "marker title restore full loop PASS",
  /marker title restore full loop.*PASS|markerTitleRestoreFullLoopPass:\s*true/i.test(
    doc,
  ),
);
assert(
  "DB title restored",
  /DB title restored.*PASS|dbTitleRestored:\s*true/i.test(doc),
);
assert(
  "permission closed",
  /Permission closed.*PASS|permissionClosed:\s*true/i.test(doc),
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
  "preflight PASS",
  /Preflight.*PASS|preflightPass:\s*true/i.test(doc),
);
assert(
  "verify manual-upload PASS",
  /verify:manual-upload.*PASS|verifyManualUploadPass:\s*true/i.test(doc),
);
assert(
  "build gosaki staging PASS",
  /build:gosaki:staging.*PASS/i.test(doc),
);
assert(
  "manual FTP upload completed by operator",
  /Manual FTP upload.*done|manualFtpUploadCompletedByOperator:\s*true/i.test(
    doc,
  ),
);
assert(
  "Admin UI PASS",
  /Admin UI.*PASS|adminUiPass:\s*true/i.test(doc) && doc.includes(ADMIN_URL),
);
assert(
  "Public UI PASS",
  /Public UI.*PASS|publicUiPass:\s*true/i.test(doc) &&
    doc.includes(PUBLIC_URL),
);
assert(
  "marker removed from public-dist grep",
  /Marker grep.*absent|marker.*not found|Marker title in STG UI.*absent/i.test(
    doc,
  ),
);
assert(
  "marker removed from STG UI",
  /markerTitleRemovedFromStgUi:\s*true|Marker title.*absent/i.test(doc),
);
assert(
  "On a Clear Day in admin index",
  /On a Clear Day.*admin\/index\.html|admin\/index\.html.*On a Clear Day/i.test(
    doc,
  ),
);
assert(
  "On a Clear Day in discography index",
  /On a Clear Day.*discography\/index\.html|discography\/index\.html.*On a Clear Day/i.test(
    doc,
  ),
);
assert(
  "On a Clear Day restored in STG UI",
  /onAClearDayRestoredInStgUi:\s*true|On a Clear Day in STG UI.*restored/i.test(
    doc,
  ),
);
assert(
  "Like a Lover preserved",
  /likeALoverPreserved:\s*true|Like a Lover preserved/i.test(doc) &&
    doc.includes(TRACK_7),
);
assert("sourceCommit recorded", doc.includes(SOURCE_COMMIT));
assert(
  "sourceCommit short recorded",
  doc.includes(SOURCE_COMMIT_SHORT) || doc.includes(SOURCE_COMMIT.slice(0, 7)),
);
assert(
  "generatedAt recorded",
  doc.includes("2026-07-15T03:32:33.596Z"),
);
assert(
  "fileCount 31",
  /fileCount.*31|packageFileCount:\s*31/i.test(doc),
);
assert(
  "safeForStaticFtp true",
  /safeForStaticFtp.*true/i.test(doc),
);
assert("remote target recorded", doc.includes(REMOTE));
assert("publicBaseUrl recorded", doc.includes(PUBLIC_BASE));
assert(
  "overwrite upload only",
  /overwrite only|overwrite upload/i.test(doc),
);
assert(
  "no FTP automation",
  /FTP automation.*no|ftpAutomationUsed:\s*false|CLI FTP.*not executed/i.test(
    doc,
  ),
);
assert(
  "no further FTP unless package regen",
  /No further FTP|unless the package is regenerated/i.test(doc),
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
  "package re-generation not in this phase",
  /Package re-generation.*no|packageRegenerationInThisPhase:\s*false/i.test(
    doc,
  ),
);
assert(
  "Edge deploy not executed",
  /Edge deploy.*no|edgeDeployExecuted:\s*false/i.test(doc),
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
  "no JWT tokens recorded",
  /JWT.*not displayed|JWT \/ tokens displayed.*no/i.test(doc),
);
assert("marker title string referenced", doc.includes(MARKER_TITLE));
assert("original title string referenced", doc.includes(ORIGINAL_TITLE));
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36f-marker-title-restore-manual-upload-ui-pass-result",
  ),
);
assert(
  "AI current-state manual upload UI pass",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyMarkerTitleRestoreManualUploadUiPassCompleted",
    ),
);
assert(
  "AI next-actions slice complete or result",
  nextActions.includes(NEXT) ||
    nextActions.includes(PHASE) ||
    nextActions.includes(
      "gosakiDiscographyMarkerTitleRestoreManualUploadUiPassCompleted",
    ),
);
assert(
  "AI handoff manual upload UI pass",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes(
      "gosakiDiscographyMarkerTitleRestoreManualUploadUiPassCompleted",
    ),
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
  `\nverify-g20u36f-marker-title-restore-manual-upload-ui-pass-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
