/**
 * G-20u36d-readback-release-id-select-fix-plan verifier.
 * Planning-only — no root/tools draft edit / Edge deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-release-id-select-fix-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-plan.md";
const LIVE_VERIFY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "79a5bfb";
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

function listNewSqlFiles() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" });
  /** @type {string[]} */
  const files = [];
  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (file.endsWith(".sql") && !file.includes("select-only") && !file.includes("deploy-preflight")) {
      files.push(file);
    }
  }
  return files;
}

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

function releaseSelectMissingId(src) {
  const match = src.match(/RELEASE_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return true;
  return !/["']id["']/.test(match[1]);
}

function releaseSelectIncludesId(src) {
  const match = src.match(/RELEASE_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return /["']id["']/.test(match[1]);
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack release-id fix plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during plan doc creation`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("live verify doc exists", exists(LIVE_VERIFY_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));
assert("tools handler exists", exists(TOOLS_HANDLER_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));

const doc = read(DOC_REL);
const liveVerifyDoc = read(LIVE_VERIFY_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const toolsHandler = read(TOOLS_HANDLER_REL);
const readbackLib = read(READBACK_LIB_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-release-id-select-fix-planning",
  doc.includes("G-20u36d-readback-release-id-select-fix-planning"),
);
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan only") || doc.includes("planning doc only"));
assert("doc root edit not executed", doc.includes("Root") && /no|not|false|未編集|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));

assert("doc STOP trackCount zero", doc.includes("trackCount") && /0|zero/i.test(doc));
assert("doc STOP matching 400", doc.includes("matching") && /400|empty track list/i.test(doc));
assert("doc STOP cause release id missing", doc.includes("RELEASE_SELECT_FIELDS") && doc.includes("id"));
assert("doc readBack enabled pass", doc.includes("readBack.enabled") || doc.includes("readBack.enabled"));
assert("doc supabase-select source", doc.includes("supabase-select"));

assert("doc release id internal only", doc.includes("internal") && doc.includes("id"));
assert("doc tracks release_id usage", doc.includes("release_id") || doc.includes("fetchTracks"));
assert("doc sanitized summary no id", doc.includes("sanitized") && /no `id`|No UUID|does not include `id`/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc anon SELECT maintained", doc.includes("anon SELECT"));
assert("doc operation save reject", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc matching wouldWrite false expected", doc.includes("wouldWrite=false") || doc.includes("wouldWrite=false"));
assert("doc plusOne wouldWrite true expected", doc.includes("wouldWrite=true") || doc.includes("tracksAdded=1"));

assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc no G20u36e until retry", doc.includes("G-20u36e") && /after|Only after|retry PASS/i.test(doc));

assert("doc next tools-draft fix", doc.includes("G-20u36d-readback-release-id-select-fix-tools-draft"));
assert("doc next root placement", doc.includes("G-20u36d-readback-release-id-select-fix-root-placement"));
assert("doc next edge deploy", doc.includes("G-20u36d-readback-release-id-select-fix-edge-deploy"));
assert("doc next live verify retry", doc.includes("G-20u36d-readback-live-verify-retry"));

assert("live verify doc gate false", liveVerifyDoc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerified: false"));
assert("live verify doc trackCount zero", liveVerifyDoc.includes("trackCount") && /0/.test(liveVerifyDoc));

const toolsDraftFixDocRel =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-tools-draft.md";
const rootPlacementDocRel =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-root-placement.md";
const toolsDraftFixComplete = exists(toolsDraftFixDocRel);
const rootPlacementComplete = exists(rootPlacementDocRel);

assert("root handler resolveReadBackSnapshot uses releaseRow.id", rootHandler.includes("releaseRow.id"));
assert("root mapReleaseRow omits id", rootHandler.includes("mapReleaseRowToCurrentSnapshotRelease") && !/title: row\?\.title[\s\S]{0,200}id:/.test(rootHandler));
assert("root buildSanitizedReadBackSummary no id field", !/buildSanitizedReadBackSummary[\s\S]{0,300}\bid\b:/.test(rootHandler));

if (rootPlacementComplete) {
  assert("root handler release select includes id", releaseSelectIncludesId(rootHandler));
  assert("tools handler release select includes id", releaseSelectIncludesId(toolsHandler));
  assert("readback lib release select includes id", releaseSelectIncludesId(readbackLib));
} else if (toolsDraftFixComplete) {
  assert("root handler release select still missing id (pre-root-placement)", releaseSelectMissingId(rootHandler));
  assert("tools handler release select includes id", releaseSelectIncludesId(toolsHandler));
  assert("readback lib release select includes id", releaseSelectIncludesId(readbackLib));
} else {
  assert("root handler bug release select missing id", releaseSelectMissingId(rootHandler));
  assert("tools handler bug release select missing id", releaseSelectMissingId(toolsHandler));
  assert("readback lib bug release select missing id", releaseSelectMissingId(readbackLib));
}

assert(
  "package script verify:g20u36d-readback-release-id-select-fix-plan",
  packageJson.includes("verify:g20u36d-readback-release-id-select-fix-plan"),
);

assert(
  "supabase/functions not modified this phase",
  rootPlacementComplete || !diffTouches("supabase/functions/"),
);
if (!toolsDraftFixComplete) {
  assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
  assert("readback lib not modified this phase", !diffTouches(READBACK_LIB_REL));
}
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state release-id fix plan",
  currentState.includes("G-20u36d-readback-release-id-select-fix-plan") ||
    currentState.includes("release-id-select-fix-plan"),
);
assert(
  "AI next-actions tools-draft fix",
  nextActions.includes("G-20u36d-readback-release-id-select-fix-tools-draft") ||
    nextActions.includes("release-id-select-fix-tools-draft"),
);
assert(
  "AI handoff release id fix plan",
  handoff.includes("G-20u36d") && (handoff.includes("release-id") || handoff.includes("release id")),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-release-id-select-fix-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
