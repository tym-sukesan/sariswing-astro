/**
 * G-20u36f marker title restore Save + permission close result-record verifier.
 * Result record only — no Save / SQL / package / FTP / Edge deploy.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-save-result.md";
const EDGE_DEPLOY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-edge-deploy-result.md";
const PHASE = "G-20u36f-discography-marker-title-restore-save-result-record";
const GATE = "gosakiDiscographyMarkerTitleRestoreSaveCompleted: true";
const NEXT = "G-20u36f-discography-marker-title-restore-static-package-regeneration-prep";
const FUNCTION = "gosaki-discography-save-dry-run";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const G20U36F_APPROVAL = "G-20u36f-gosaki-discography-marker-title-restore";
const G20U36F_SLICE = "G-20u36f-discography-002-track-1-title-restore";
const TARGET_ROW_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const MARKER_TITLE = "On a Clear Day [CMS Kit staging G-20u36e]";
const ORIGINAL_TITLE = "On a Clear Day";
const TRACK_7 = "Like a Lover";
const POLICY_NAME = "discography_tracks_g20u36f_marker_title_restore_restrictive";

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

assert("save result doc exists", exists(DOC_REL));
assert("edge deploy result doc exists", exists(EDGE_DEPLOY_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "Save PASS",
  /Restore controlled Save.*\*\*PASS\*\*|restoreSavePass:\s*true/i.test(doc),
);
assert(
  "Save ok true",
  /ok.*\*\*true\*\*|ok\s*\|\s*`true`/i.test(doc),
);
assert(
  "Save operation save",
  /operation.*\*\*save\*\*|operation\s*\|\s*`save`/i.test(doc),
);
assert(
  "Save controlledSave true",
  /controlledSave.*\*\*true\*\*|controlledSave\s*\|\s*`true`/i.test(doc),
);
assert("Save endpoint", doc.includes(FUNCTION));
assert("Save siteSlug gosaki-piano", doc.includes("gosaki-piano"));
assert("Save legacyId discography-002", doc.includes("discography-002"));
assert("Save approvalId", doc.includes(G20U36F_APPROVAL));
assert("Save sliceId", doc.includes(G20U36F_SLICE));
assert("Save trackNumber 1", /trackNumber.*`1`|track_number.*`1`/i.test(doc));
assert("Save targetRowId", doc.includes(TARGET_ROW_ID));
assert("Save beforeTitle marker", doc.includes(MARKER_TITLE));
assert("Save afterTitle original", doc.includes(ORIGINAL_TITLE));
assert(
  "Save updatedRows 1",
  /updatedRows.*`1`|updatedRows.*\*\*1\*\*/i.test(doc),
);
assert("Save errors empty", /errors.*`\[\]`|errorsEmpty/i.test(doc));
assert(
  "Save didWrite true",
  /didWrite.*`true`|didWrite:\s*true/i.test(doc),
);
assert(
  "Save dbWrite true",
  /dbWrite.*`true`|dbWrite:\s*true/i.test(doc),
);
assert(
  "Save status 200",
  /status.*`200`|status:\s*200/i.test(doc),
);
assert(
  "readBack trackCount 8",
  /trackCount.*`8`|track_count.*\*\*8\*\*/i.test(doc),
);
assert("readBack track_7_title", doc.includes(TRACK_7));
assert(
  "readBack targetTitle original",
  /targetTitle.*On a Clear Day/i.test(doc),
);
assert(
  "readBack noAddedRemoved true",
  /noAddedRemoved.*`true`|no added\/removed tracks/i.test(doc),
);
assert(
  "permission close PASS",
  /Permission close.*\*\*PASS\*\*|permissionClosePass:\s*true/i.test(doc),
);
assert(
  "permission closed",
  /Permission closed.*\*\*yes\*\*|permissionClosed:\s*true|Permission state.*\*\*closed\*\*/i.test(
    doc,
  ),
);
assert("post-close phase", doc.includes("G-20u36f-discography-marker-title-restore-post-close"));
assert(
  "post-close target_title original",
  /target_title.*On a Clear Day/i.test(doc),
);
assert(
  "post-close target_title_is_original true",
  /target_title_is_original.*\*\*true\*\*/i.test(doc),
);
assert(
  "post-close marker_title_count_for_target 0",
  /marker_title_count_for_target.*\*\*0\*\*/i.test(doc),
);
assert(
  "post-close g20u36f_restrictive_policy_count 0",
  /g20u36f_restrictive_policy_count.*\*\*0\*\*/i.test(doc),
);
assert(
  "post-close admin_all_policy_count 2",
  /admin_all_policy_count.*\*\*2\*\*/i.test(doc),
);
assert(
  "post-close rls enabled",
  /rls_enabled_discography_tracks.*\*\*true\*\*/i.test(doc),
);
assert(
  "post-close data_mutation false",
  /data_mutation.*\*\*false\*\*/i.test(doc),
);
assert(
  "post-close operation_save_involved false",
  /operation_save_involved.*\*\*false\*\*/i.test(doc),
);
assert(
  "post-close captured_at",
  doc.includes("2026-07-15T02:06:25.045055+00:00"),
);
assert("post-close staging ref", doc.includes(STAGING));
assert("post-close production STOP ref", doc.includes(PRODUCTION));
assert(
  "DB restored to original title",
  /DB title restored.*\*\*yes\*\*|dbTitleRestoredToOriginal:\s*true/i.test(doc),
);
assert(
  "package not generated",
  /Package regenerated.*\*\*no\*\*|packageGenerated:\s*false/i.test(doc),
);
assert(
  "STG UI may still show marker",
  /may still show marker|build-time JSON snapshot lag/i.test(doc),
);
assert(
  "package regen is next",
  /Package regen is next|package regen at clean HEAD/i.test(doc),
);
assert(
  "manual FTP after freshness PASS",
  /manual FTP.*freshness.*PASS|manualFtpAfter/i.test(doc),
);
assert(
  "additional Save not allowed",
  /Additional Save.*\*\*not allowed\*\*|additionalSaveNotAllowed/i.test(doc),
);
assert(
  "this phase no Save execution",
  /This phase Cursor Save.*\*\*not executed\*\*|Additional Save.*\*\*no\*\*/i.test(
    doc,
  ),
);
assert(
  "this phase no SQL execution",
  /Additional SQL.*\*\*no\*\*|additionalSqlNotExecuted/i.test(doc),
);
assert(
  "Edge deploy not executed",
  /Edge deploy.*\*\*no\*\*|edgeDeployNotExecuted/i.test(doc),
);
assert(
  "FTP/uploadなし",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|unchanged/i.test(
    doc,
  ),
);
assert(
  "no JWT tokens recorded",
  /JWT.*not recorded|JWT \/ tokens displayed.*\*\*no\*\*/i.test(doc),
);
assert("doc policy name", doc.includes(POLICY_NAME));
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36f-marker-title-restore-save-result"),
);
assert(
  "AI current-state save result",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestoreSaveCompleted"),
);
assert(
  "AI next-actions package regen or save result",
  nextActions.includes(NEXT) ||
    nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyMarkerTitleRestoreSaveCompleted"),
);
assert(
  "AI handoff save result",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestoreSaveCompleted"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36f-marker-title-restore-save-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
