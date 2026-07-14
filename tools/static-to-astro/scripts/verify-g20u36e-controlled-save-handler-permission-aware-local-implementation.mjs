/**
 * G-20u36e-controlled-save-handler-permission-aware-local-implementation verifier.
 * Local code only — no Edge deploy / Save / operation=save / DB write.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-handler-permission-aware-local-implementation.md";
const HANDLER_REL =
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const INDEX_REL =
  "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const PHASE =
  "G-20u36e-controlled-save-handler-permission-aware-local-implementation";
const GATE =
  "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalImplementationPrepared: true";
const NEXT =
  "G-20u36e-controlled-save-handler-permission-aware-local-verification";
const APPROVAL =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const SLICE =
  "G-20u36e1-discography-002-track-1-title-staging-marker";
const ROW_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const TITLE_BEFORE = "On a Clear Day";
const TITLE_AFTER = "On a Clear Day [CMS Kit staging G-20u36e]";

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
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const names = new Set();
  for (const line of `${diff.stdout}\n${status.stdout}`.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const file = trimmed.replace(/^[AM\?\s]+/, "").trim() || trimmed.split(/\s+/).pop();
    if (file) names.add(file.replace(/^\?\?\s+/, ""));
  }
  // porcelain: " M path" or "?? path"
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
  /Local implementation only|localImplementationOnly:\s*true/i.test(doc),
);
assert(
  "doc Edge deployなし",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false/i.test(doc),
);
assert(
  "doc DB write未実行",
  /DB write executed.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert("doc next local-verification", doc.includes(NEXT));

assert("handler controlled gate operation save", /CONTROLLED_SAVE_OPERATION\s*=\s*"save"/i.test(handler));
assert("handler approvalId exact", handler.includes(APPROVAL));
assert("handler sliceId exact", handler.includes(SLICE));
assert("handler siteSlug exact", /SITE_SLUG\s*=\s*"gosaki-piano"/i.test(handler));
assert("handler discography-002 exact", handler.includes("discography-002"));
assert("handler row id exact", handler.includes(ROW_ID));
assert("handler old title exact", handler.includes(TITLE_BEFORE));
assert("handler new title exact", handler.includes(TITLE_AFTER));
assert("handler track_count=8", /CONTROLLED_SAVE_TRACK_COUNT\s*=\s*8/.test(handler));
assert(
  "handler track_7 Like a Lover",
  handler.includes("Like a Lover") && /CONTROLLED_SAVE_TRACK_7_TITLE/.test(handler),
);
assert(
  "handler user-JWT Authorization",
  /createUserJwtSupabaseClient|Authorization:\s*authorizationHeader/i.test(handler),
);
assert(
  "index forwards Authorization",
  /authorizationHeader/i.test(index) && /headers\.get\(["']authorization["']\)/i.test(index),
);
assert("handler SUPABASE_ANON_KEY", /SUPABASE_ANON_KEY|anonKey/i.test(handler));
assert(
  "handler no service_role client",
  !/SERVICE_ROLE_KEY|createClient\([^)]*service/i.test(handlerExec) &&
    /SUPABASE_SERVICE_ROLE_CONNECTED\s*=\s*false/.test(handler),
);
assert("handler is_admin check", /\.rpc\(\s*["']is_admin["']\s*\)/.test(handler));
assert(
  "handler title only update",
  /\.update\(\s*\{\s*title:\s*CONTROLLED_SAVE_TITLE_AFTER\s*\}\s*\)/.test(handler),
);
assert(
  "handler no updated_at client payload",
  !/\.update\([^)]*updated_at/i.test(handlerExec),
);
assert(
  "handler no insert/delete/rebuild",
  (() => {
    const start = handlerExec.indexOf("handleControlledG20u36eSaveHttp");
    const body = start >= 0 ? handlerExec.slice(start) : "";
    return !/\.insert\s*\(/i.test(body) && !/\.delete\s*\(/i.test(body);
  })(),
);
assert(
  "handler no discography table update",
  !/\.from\(\s*["']discography["']\s*\)\s*\.update/i.test(handlerExec),
);
assert(
  "handler no broad update without gates",
  /slice_id_mismatch|CONTROLLED_SAVE_SLICE_ID/.test(handler) &&
    /CONTROLLED_SAVE_TARGET_ROW_ID/.test(handler),
);
assert(
  "handler no token logging",
  !/console\.(log|info|debug|warn|error)\([^)]*authorization/i.test(handlerExec) &&
    !/console\.(log|info|debug|warn|error)\([^)]*Bearer/i.test(indexExec),
);
assert(
  "handler no user_id/email in response builders",
  !/user_id|user\.email|userId/i.test(
    handler.slice(handler.indexOf("handleControlledG20u36eSaveHttp")),
  ),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-handler-permission-aware-local-implementation",
  ),
);
assert(
  "AI current-state local implementation",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalImplementationPrepared",
    ),
);
assert(
  "AI next-actions local-verification or implementation",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff local implementation",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwareLocalImplementationPrepared",
    ),
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
  `\nverify-g20u36e-controlled-save-handler-permission-aware-local-implementation: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
