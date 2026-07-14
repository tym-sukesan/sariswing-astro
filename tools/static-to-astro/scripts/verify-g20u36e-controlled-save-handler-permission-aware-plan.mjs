/**
 * G-20u36e-controlled-save-handler-permission-aware-planning verifier.
 * Planning only — no Edge implement / Save / Rollback / SQL.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-handler-permission-aware-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-handler-permission-aware-plan.md";
const ROLLBACK_PREP_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-rollback-name-adjustment-prep.md";
const PHASE = "G-20u36e-controlled-save-handler-permission-aware-planning";
const GATE =
  "gosakiDiscographyControlledSaveHandlerPermissionAwarePlanPrepared: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-handler-permission-aware-implementation-prep";
const APPROVAL_ID =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const SLICE_ID =
  "G-20u36e1-discography-002-track-1-title-staging-marker";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";
const OBSERVED_POLICY =
  "discography_tracks_g20u36e_controlled_save_title_update_restric";

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

assert("plan doc exists", exists(DOC_REL));
assert("rollback name adjustment prep exists", exists(ROLLBACK_PREP_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc planning only",
  /Planning only|planningOnly:\s*true/i.test(doc),
);
assert(
  "doc Edge実装なし",
  /Edge implementation.*\*\*no\*\*|edgeImplementationExecuted:\s*false|Edge実装なし/i.test(
    doc,
  ),
);
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "doc SQL実行なし",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false|SQL実行なし|SQL.*未実行/i.test(
    doc,
  ),
);
assert("doc DB writeなし", /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc));
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false|No service_role/i.test(doc),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert(
  "doc existing handler read-only調査",
  /Existing handler read-only survey|read-only survey/i.test(doc) &&
    doc.includes("gosaki-discography-save-dry-run"),
);
assert(
  "doc user-JWT Supabase client方針",
  /user-JWT|user JWT|incoming Authorization/i.test(doc) &&
    /SUPABASE_ANON_KEY/i.test(doc),
);
assert(
  "doc is_admin()確認方針",
  /is_admin\(\)/i.test(doc) && /reject unless|true以外|unless `true`/i.test(doc),
);
assert(
  "doc approvalId/sliceId完全一致方針",
  doc.includes(APPROVAL_ID) &&
    doc.includes(SLICE_ID) &&
    /exact.*approvalId|完全一致|Require exact/i.test(doc),
);
assert(
  "doc controlled slice条件",
  doc.includes(TARGET_ID) &&
    doc.includes("discography-002") &&
    /On a Clear Day \[CMS Kit staging G-20u36e\]/i.test(doc),
);
assert(
  "doc single-row UPDATE方針",
  /single-row UPDATE/i.test(doc),
);
assert(
  "doc title only update方針",
  /title only|Update \*\*title only\*\*|title 1列/i.test(doc),
);
assert(
  "doc no updated_at client payload",
  /no client `updated_at`|do not send|Client `updated_at`/i.test(doc),
);
assert(
  "doc no insert/delete/rebuild",
  /insert \/ delete \/ rebuild|No track add|insert\/delete\/rebuild/i.test(doc),
);
assert(
  "doc pre-save verification方針",
  /Pre-save verification/i.test(doc),
);
assert(
  "doc post-save verification方針",
  /Post-save verification/i.test(doc),
);
assert("doc rollout sequence", /Rollout sequence/i.test(doc));
assert("doc STOP conditions", /STOP conditions/i.test(doc));
assert("doc next phase", doc.includes(NEXT_PHASE));
assert("doc observed policy name", doc.includes(OBSERVED_POLICY));
assert(
  "doc operation=save currently rejected",
  /Hard rejected|rejected by dry-run/i.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-handler-permission-aware-plan",
  ),
);
assert(
  "AI current-state handler plan",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwarePlanPrepared",
    ),
);
assert(
  "AI next-actions implementation-prep or plan",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff handler plan",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveHandlerPermissionAwarePlanPrepared",
    ),
);

function supabaseFunctionsOnlyAllowedLocalImplOrClean() {
  const status = spawnSync(
    "git",
    ["status", "--porcelain", "--", "supabase/functions/"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  const allowed = new Set([
    "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
    "supabase/functions/gosaki-discography-save-dry-run/index.ts",
  ]);
  const files = status.stdout
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.slice(3).trim());
  return files.every((file) => allowed.has(file));
}

assert(
  "supabase/functions not modified (or only controlled local-impl files)",
  supabaseFunctionsOnlyAllowedLocalImplOrClean(),
  "unexpected supabase/functions changes",
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
  "unexpected output/manual-upload changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-handler-permission-aware-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
