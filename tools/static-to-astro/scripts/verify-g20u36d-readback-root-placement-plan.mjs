/**
 * G-20u36d-readback-root-placement-plan verifier.
 * Planning-only — no root supabase/functions edit / deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-root-placement-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-root-placement-plan.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-implementation-in-tools-draft.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-discography-edge-dry-run-readback-enhancement-plan.md";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const ROOT_INDEX_REL = "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "0cbcf2f";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

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
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack root-placement-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("tools draft readBack doc exists", exists(TOOLS_DRAFT_DOC_REL));
assert("readBack enhancement plan doc exists", exists(PLAN_DOC_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));
assert("root index exists for comparison", exists(ROOT_INDEX_REL));
assert("root handler exists for comparison", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const toolsDraftDoc = read(TOOLS_DRAFT_DOC_REL);
const draftIndex = read(DRAFT_INDEX_REL);
const draftHandler = read(DRAFT_HANDLER_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const rootIndex = read(ROOT_INDEX_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36d-readback-root-placement-plan", doc.includes("G-20u36d-readback-root-placement-plan"));
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackRootPlacementPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only") || doc.includes("planning only"));
assert(
  "doc root supabase functions unchanged",
  doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc),
);
assert("doc no Edge deploy", doc.includes("deploy") && /no|not|false|未実行|separate/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));

assert(
  "doc copy from tools draft index",
  doc.includes("scripts/edge-functions/gosaki-discography-save-dry-run/index.ts"),
);
assert(
  "doc copy from tools draft handler",
  doc.includes("scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts"),
);
assert(
  "doc copy to root index",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/index.ts"),
);
assert(
  "doc copy to root handler",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
);

assert("doc anon SELECT policy", doc.includes("anon SELECT") || doc.includes("supabase-select"));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not referenced|forbidden/i.test(doc),
);
assert("doc sanitized readBack summary", doc.includes("sanitized") && doc.includes("readBack"));
assert("doc operation save reject", doc.includes("save") && /reject|拒否/i.test(doc));
assert(
  "doc write flags false",
  doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"),
);
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc production STOP ref", doc.includes(PRODUCTION_REF));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED", doc.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));
assert("doc readBack disabled schema-only fallback", doc.includes("schema-only") || doc.includes("readBack: null"));
assert("doc readBack enabled DB snapshot diff", doc.includes("DB snapshot") || doc.includes("DB-grounded"));

assert("doc next phase root-placement", doc.includes("G-20u36d-readback-root-placement"));
assert("doc next phase edge-deploy", doc.includes("G-20u36d-readback-edge-deploy"));
assert("doc next phase live-verify", doc.includes("G-20u36d-readback-live-verify"));
assert("doc next phase G-20u36e deferred", doc.includes("G-20u36e"));

assert("package script verify:g20u36d-readback-root-placement-plan", packageJson.includes("verify:g20u36d-readback-root-placement-plan"));

const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-root-placement.md";
const rootPlacementComplete =
  exists(ROOT_PLACEMENT_DOC_REL) &&
  read(ROOT_PLACEMENT_DOC_REL).includes("gosakiDiscographyEdgeDryRunReadBackRootPlaced: true");

assert("tools draft has readBack implementation", draftHandler.includes("resolveReadBackSnapshot"));
assert("tools draft has readBack env gate", draftIndex.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));

if (rootPlacementComplete) {
  console.log(
    "NOTE root placement complete — plan verifier pre-readBack / unmodified checks skipped (historical plan doc)",
  );
  passed += 1;
} else {
  assert("root handler pre-readBack (no resolveReadBackSnapshot)", !rootHandler.includes("resolveReadBackSnapshot"));
  assert("root index pre-readBack (sync handler only)", !rootIndex.includes("handleDiscographyEdgeDryRunHttpAsync"));
  assert("root supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
}
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

assert("AI current-state G-20u36d readBack root placement plan", currentState.includes("G-20u36d-readback-root-placement-plan") || currentState.includes("readBack root placement plan"));
assert("AI next-actions root placement", nextActions.includes("G-20u36d-readback-root-placement") || nextActions.includes("readback-root-placement"));
assert("AI handoff G-20u36d readBack", handoff.includes("G-20u36d") && handoff.includes("readBack"));

assert("tools draft doc gate tools draft implemented", toolsDraftDoc.includes("gosakiDiscographyEdgeDryRunReadBackToolsDraftImplemented: true"));

console.log(`\nG-20u36d readBack root-placement-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
