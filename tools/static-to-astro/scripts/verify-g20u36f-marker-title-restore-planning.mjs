/**
 * G-20u36f marker title restore planning verifier.
 * Planning only — no Save / SQL / package / FTP / handler changes.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-planning.md";
const PHASE = "G-20u36f-discography-marker-title-restore-planning";
const GATE = "gosakiDiscographyMarkerTitleRestorePlanned: true";
const NEXT = "G-20u36f-discography-marker-title-restore-handler-implementation";
const TARGET_ROW_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const TITLE_MARKER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TITLE_ORIGINAL = "On a Clear Day";
const TRACK_7 = "Like a Lover";
const APPROVAL_ID = "G-20u36f-gosaki-discography-marker-title-restore";
const SLICE_ID = "G-20u36f-discography-002-track-1-title-restore";
const POLICY_NAME =
  "discography_tracks_g20u36f_marker_title_restore_restrictive";
const PREFLIGHT_COLUMN = "g20u36f_marker_title_restore_preflight_snapshot";
const HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";

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

assert("restore planning doc exists", exists(DOC_REL));
assert("handler.ts exists (read-only reference)", exists(HANDLER_REL));

const doc = read(DOC_REL);
const handler = read(HANDLER_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "planning only",
  /planning only|planningOnly:\s*true/i.test(doc),
);
assert(
  "no SQL executed",
  /SQL executed.*no|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "no Save executed",
  /Save executed.*no|saveExecuted:\s*false/i.test(doc),
);
assert(
  "no DB write",
  /DB write.*no|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "no Edge deploy",
  /Edge deploy.*no|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "no package generation",
  /Package generation.*no|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP/upload",
  /FTP.*no|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production unchanged",
  /Production changed.*no|productionChanged:\s*false/i.test(doc),
);
assert(
  "handler reverse incompatible as-is",
  /NOT compatible|handlerReverseCompatibleAsIs:\s*false|forward-only/i.test(doc),
);
assert(
  "handler minimal change required",
  /Minimal change|handlerMinimalChangeRequired:\s*true/i.test(doc),
);
assert(
  "handler not changed this phase",
  /Handler changed.*no|handlerChanged:\s*false/i.test(doc),
);
assert("restore beforeTitle marker", doc.includes(TITLE_MARKER));
assert("restore afterTitle original", doc.includes(TITLE_ORIGINAL));
assert("target row id", doc.includes(TARGET_ROW_ID));
assert("track_count 8", /track_count.*8|expected_track_count.*8/i.test(doc));
assert("track_7 Like a Lover", doc.includes(TRACK_7));
assert("preflight snapshot column", doc.includes(PREFLIGHT_COLUMN));
assert(
  "preflight data_mutation false",
  doc.includes("data_mutation") && /data_mutation.*false/i.test(doc),
);
assert(
  "preflight operation_save_involved false",
  doc.includes("operation_save_involved") &&
    /operation_save_involved.*false/i.test(doc),
);
assert("permission open policy name", doc.includes(POLICY_NAME));
assert(
  "permission open GRANT UPDATE title",
  /GRANT UPDATE \(title\).*discography_tracks.*authenticated/is.test(doc),
);
assert(
  "permission open USING marker",
  /USING[\s\S]*On a Clear Day \[CMS Kit staging G-20u36e\]/i.test(doc),
);
assert(
  "permission open WITH CHECK original",
  /WITH CHECK[\s\S]*title = 'On a Clear Day'/i.test(doc),
);
assert("controlled Save approvalId", doc.includes(APPROVAL_ID));
assert("controlled Save sliceId", doc.includes(SLICE_ID));
assert(
  "controlled Save curl draft",
  doc.includes("curl") &&
    doc.includes("operation") &&
    doc.includes("beforeTitle") &&
    doc.includes("afterTitle"),
);
assert(
  "permission close REVOKE",
  /REVOKE UPDATE \(title\).*discography_tracks.*authenticated/is.test(doc),
);
assert(
  "permission close DROP policy",
  /DROP POLICY.*discography_tracks_g20u36f_marker_title_restore_restrictive/i.test(
    doc,
  ),
);
assert(
  "expected full loop steps",
  /pre-restore SELECT|permission open|controlled Save|permission close|package regen|manual FTP|UI verify/i.test(
    doc,
  ),
);
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "handler has G-20u36e forward constants (read-only confirm)",
  handler.includes("CONTROLLED_SAVE_TITLE_BEFORE") &&
    handler.includes("CONTROLLED_SAVE_TITLE_AFTER") &&
    handler.includes("G-20u36e1-discography-002-track-1-title-staging-marker"),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36f-marker-title-restore-planning"),
);
assert(
  "AI current-state G-20u36f planning",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestorePlanned"),
);
assert(
  "AI next-actions handler implementation or planning",
  nextActions.includes(NEXT) ||
    nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyMarkerTitleRestorePlanned"),
);
assert(
  "AI handoff G-20u36f planning",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestorePlanned"),
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
  `\nverify-g20u36f-marker-title-restore-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
