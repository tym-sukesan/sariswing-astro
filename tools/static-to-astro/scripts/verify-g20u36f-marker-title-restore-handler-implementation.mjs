/**
 * G-20u36f marker title restore handler implementation verifier.
 * Local code only — no Edge deploy / Save / SQL / package / FTP.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-handler-implementation.md";
const HANDLER_REL =
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const INDEX_REL =
  "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const PHASE = "G-20u36f-discography-marker-title-restore-handler-implementation";
const GATE = "gosakiDiscographyMarkerTitleRestoreHandlerImplemented: true";
const NEXT = "G-20u36f-discography-marker-title-restore-edge-deploy-prep";
const G20U36E_APPROVAL =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const G20U36E_SLICE = "G-20u36e1-discography-002-track-1-title-staging-marker";
const G20U36F_APPROVAL = "G-20u36f-gosaki-discography-marker-title-restore";
const G20U36F_SLICE = "G-20u36f-discography-002-track-1-title-restore";
const ROW_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const RESTORE_BEFORE = "On a Clear Day [CMS Kit staging G-20u36e]";
const RESTORE_AFTER = "On a Clear Day";
const FORWARD_BEFORE = "On a Clear Day";
const FORWARD_AFTER = "On a Clear Day [CMS Kit staging G-20u36e]";

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

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
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

function changedUnder(prefix) {
  const fromStatus = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const files = [];
  for (const line of fromStatus.stdout.split("\n")) {
    if (!line.trim()) continue;
    files.push(line.slice(3));
  }
  const fromDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return [...new Set([...files, ...fromDiff.stdout.split("\n").filter(Boolean)])];
}

assert("implementation doc exists", exists(DOC_REL));
assert("handler.ts exists", exists(HANDLER_REL));
assert("index.ts exists", exists(INDEX_REL));

const doc = read(DOC_REL);
const handler = read(HANDLER_REL);
const index = read(INDEX_REL);
const handlerExec = stripComments(handler);
const indexExec = stripComments(index);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc local implementation only",
  /local implementation only|localImplementationOnly:\s*true/i.test(doc),
);
assert(
  "doc Edge deployなし",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "doc SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "doc DB writeなし",
  /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "doc package生成なし",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "doc FTP/uploadなし",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert("doc allowlist approach", /allowlist|CONTROLLED_SAVE_SLICE_ALLOWLIST/i.test(doc));
assert("doc G-20u36e forward supported", /G-20u36e forward/i.test(doc));
assert("doc G-20u36f restore supported", /G-20u36f restore/i.test(doc));
assert(`doc next ${NEXT}`, doc.includes(NEXT));

assert("handler G-20u36f approvalId", handler.includes(G20U36F_APPROVAL));
assert("handler G-20u36f sliceId", handler.includes(G20U36F_SLICE));
assert("handler restore beforeTitle", handler.includes(RESTORE_BEFORE));
assert("handler restore afterTitle", handler.includes(RESTORE_AFTER));
assert("handler G-20u36e approvalId retained", handler.includes(G20U36E_APPROVAL));
assert("handler G-20u36e sliceId retained", handler.includes(G20U36E_SLICE));
assert("handler forward beforeTitle retained", handler.includes(FORWARD_BEFORE));
assert("handler forward afterTitle retained", handler.includes(FORWARD_AFTER));
assert(
  "handler allowlist constant",
  /CONTROLLED_SAVE_SLICE_ALLOWLIST/.test(handler),
);
assert(
  "handler resolveControlledSaveSlice",
  /resolveControlledSaveSlice/.test(handler),
);
assert(
  "handler controlled_slice_not_allowlisted",
  /controlled_slice_not_allowlisted/.test(handler),
);
assert("handler target row id", handler.includes(ROW_ID));
assert(
  "handler UPDATE title only via slice.afterTitle",
  /\.update\(\s*\{\s*title:\s*slice\.afterTitle\s*\}\s*\)/.test(handlerExec),
);
assert(
  "handler UPDATE WHERE id targetRowId",
  /\.eq\(\s*["']id["']\s*,\s*slice\.targetRowId\s*\)/.test(handlerExec),
);
assert(
  "handler UPDATE WHERE site_slug",
  /\.eq\(\s*["']site_slug["']\s*,\s*slice\.siteSlug\s*\)/.test(handlerExec),
);
assert(
  "handler UPDATE WHERE discography_legacy_id",
  /\.eq\(\s*["']discography_legacy_id["']\s*,\s*slice\.legacyId\s*\)/.test(
    handlerExec,
  ),
);
assert(
  "handler UPDATE WHERE track_number",
  /\.eq\(\s*["']track_number["']\s*,\s*slice\.trackNumber\s*\)/.test(handlerExec),
);
assert(
  "handler UPDATE WHERE title beforeTitle",
  /\.eq\(\s*["']title["']\s*,\s*slice\.beforeTitle\s*\)/.test(handlerExec),
);
assert(
  "handler readBack targetTitle slice.afterTitle",
  /postTrack1\s*!==\s*slice\.afterTitle/.test(handlerExec),
);
assert(
  "handler readBack targetRowCount",
  /targetRowCount\s*!==\s*1|targetRowCount:\s*postSorted/.test(handler),
);
assert(
  "handler no service_role client",
  !/SERVICE_ROLE_KEY|createClient\([^)]*service/i.test(handlerExec) &&
    /SUPABASE_SERVICE_ROLE_CONNECTED\s*=\s*false/.test(handler),
);
assert(
  "handler no updated_at in update payload",
  !/\.update\([^)]*updated_at/i.test(handlerExec),
);
assert(
  "index forwards Authorization",
  /authorizationHeader/i.test(index) &&
    /headers\.get\(["']authorization["']\)/i.test(index),
);
assert(
  "handler dryRun path preserved",
  /simulateDiscographySaveDryRunEndpoint/.test(handler),
);
assert(
  "handler sync save requires async",
  /controlled_save_requires_async/.test(handler),
);

const handlerBefore = spawnSync(
  "git",
  ["show", "HEAD:supabase/functions/gosaki-discography-save-dry-run/handler.ts"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
const priorHandler =
  handlerBefore.status === 0 ? handlerBefore.stdout : "";
const priorServiceRoleCount = (priorHandler.match(/service_role/gi) ?? []).length;
const newServiceRoleCount = (handler.match(/service_role/gi) ?? []).length;
assert(
  "handler no new service_role string additions",
  newServiceRoleCount <= priorServiceRoleCount + 1,
  `before=${priorServiceRoleCount} after=${newServiceRoleCount}`,
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36f-marker-title-restore-handler-implementation",
  ),
);
assert(
  "AI current-state handler implementation",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestoreHandlerImplemented"),
);
assert(
  "AI next-actions edge deploy prep or implementation",
  nextActions.includes(NEXT) ||
    nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyMarkerTitleRestoreHandlerImplemented"),
);
assert(
  "AI handoff handler implementation",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestoreHandlerImplemented"),
);

const fnChanges = changedUnder("supabase/functions");
const allowed = new Set([
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
  "supabase/functions/gosaki-discography-save-dry-run/index.ts",
]);
const unexpected = fnChanges.filter((f) => !allowed.has(f));
assert(
  "supabase/functions only allowed two files changed",
  unexpected.length === 0,
  unexpected.join(", "),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36f-marker-title-restore-handler-implementation: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
