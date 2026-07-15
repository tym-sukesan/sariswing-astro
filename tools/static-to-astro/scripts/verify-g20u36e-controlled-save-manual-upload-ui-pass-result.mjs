/**
 * G-20u36e manual upload UI pass result-record verifier.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-manual-upload-ui-pass-result.md";
const PHASE = "G-20u36e-controlled-save-manual-upload-ui-pass-result-record";
const GATE = "gosakiDiscographyControlledSaveManualUploadUiPassCompleted: true";
const SOURCE_COMMIT = "8c9cd9210641d473c72c752f7b20903cb4d501bf";
const SOURCE_COMMIT_SHORT = "8c9cd92";
const TITLE_MARKER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TRACK_7 = "Like a Lover";
const ADMIN_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const PUBLIC_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
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

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "First controlled Save full loop PASS",
  /First controlled Save full loop.*PASS|firstControlledSaveFullLoopPass:\s*true/i.test(
    doc,
  ),
);
assert("DB Save PASS", /DB Save.*PASS|dbSavePass:\s*true/i.test(doc));
assert(
  "permission close PASS",
  /Permission close.*PASS|permissionClosePass:\s*true/i.test(doc),
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
  "manual FTP upload completed by operator",
  /Manual FTP upload.*done|manualFtpUploadCompletedByOperator:\s*true|実施済み/i.test(
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
  "marker title visible",
  doc.includes(TITLE_MARKER) &&
    /markerTitleVisible:\s*true|Marker title visible.*yes/i.test(doc),
);
assert(
  "Like a Lover visible",
  doc.includes(TRACK_7) &&
    /likeALoverVisible:\s*true|Like a Lover.*visible/i.test(doc),
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
  "no FTP automation",
  /FTP automation.*no|ftpAutomationUsed:\s*false|CLI FTP.*not executed/i.test(
    doc,
  ),
);
assert(
  "production unchanged",
  /Production changed.*no|productionChanged:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("sourceCommit recorded", doc.includes(SOURCE_COMMIT));
assert(
  "sourceCommit short recorded",
  doc.includes(SOURCE_COMMIT_SHORT) || doc.includes(SOURCE_COMMIT.slice(0, 7)),
);
assert(
  "re-upload requires package regen note",
  /re-upload|再アップロード/i.test(doc) &&
    /package regeneration|package再生成/i.test(doc) &&
    /sourceCommit.*stale|古くなる/i.test(doc),
);
assert("remote target recorded", doc.includes(REMOTE));
assert(
  "package re-generation not in this phase",
  /Package re-generation.*no|packageRegenerationInThisPhase:\s*false/i.test(
    doc,
  ),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-manual-upload-ui-pass-result",
  ),
);
assert(
  "AI current-state manual upload UI pass",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveManualUploadUiPassCompleted",
    ),
);
assert(
  "AI next-actions slice complete or result",
  nextActions.includes(PHASE) ||
    nextActions.includes("G-20u36e-controlled-save-slice-complete") ||
    nextActions.includes(
      "gosakiDiscographyControlledSaveManualUploadUiPassCompleted",
    ),
);
assert(
  "AI handoff manual upload UI pass",
  handoff.includes(PHASE) ||
    handoff.includes("G-20u36e-controlled-save-slice-complete") ||
    handoff.includes(
      "gosakiDiscographyControlledSaveManualUploadUiPassCompleted",
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
  `\nverify-g20u36e-controlled-save-manual-upload-ui-pass-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
