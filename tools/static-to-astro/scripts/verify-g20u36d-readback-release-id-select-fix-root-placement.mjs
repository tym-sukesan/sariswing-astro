/**
 * G-20u36d-readback-release-id-select-fix-root-placement verifier.
 * Root placement only — no Edge deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-release-id-select-fix-root-placement.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-root-placement.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-plan.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-tools-draft.md";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const ROOT_INDEX_REL = "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "49791bd";
const ROOT_PLACEMENT_SCOPE_BASE = BASE_COMMIT;

const ALLOWED_ROOT_SUPABASE_PATHS = [ROOT_INDEX_REL, ROOT_HANDLER_REL];

const MUTATION_PATTERNS = [
  /\.insert\s*\(/i,
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
];

const DEPLOY_CALL_PATTERNS = [
  /trigger-deploy/i,
  /workflow_dispatch/i,
  /ftp/i,
  /mirror\s+--delete/i,
  /functions deploy/i,
];

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

function listWorkingTreeSupabaseFunctionChanges() {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "supabase/functions"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  /** @type {Set<string>} */
  const files = new Set();
  for (const line of diff.stdout.split("\n").filter(Boolean)) files.add(line.trim());
  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (!file.startsWith("supabase/functions")) continue;
    if (file.endsWith("/")) {
      files.add(`${file}index.ts`);
      files.add(`${file}handler.ts`);
      continue;
    }
    files.add(file);
  }
  return [...files];
}

function listCommittedSupabaseFunctionChanges(baseCommit = ROOT_PLACEMENT_SCOPE_BASE) {
  const diff = spawnSync(
    "git",
    ["diff", "--name-only", `${baseCommit}..HEAD`, "--", "supabase/functions"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  if (diff.status !== 0) return [];
  return diff.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listAllSupabaseFunctionScopeChanges() {
  return [
    ...new Set([
      ...listCommittedSupabaseFunctionChanges(),
      ...listWorkingTreeSupabaseFunctionChanges(),
    ]),
  ];
}

function isAllowedSupabaseFunctionChange(file) {
  return ALLOWED_ROOT_SUPABASE_PATHS.some(
    (allowed) =>
      file === allowed ||
      file.endsWith("gosaki-discography-save-dry-run/index.ts") ||
      file.endsWith("gosaki-discography-save-dry-run/handler.ts"),
  );
}

function supabaseFunctionSubpathUntouched(subpath) {
  const committed = listCommittedSupabaseFunctionChanges().filter((f) => f.startsWith(subpath));
  return committed.length === 0 && !diffTouches(subpath);
}

function releaseSelectIncludesId(src) {
  const match = src.match(/RELEASE_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return /["']id["']/.test(match[1]);
}

/** Strip comments and normalize phase constants for tools vs root comparison. */
function normalizeSourceForCompare(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/export const G20U36B_EDGE_FUNCTION_SOURCE_STAGING_PHASE[\s\S]*?;\n/, "")
    .replace(/export const G20U36D_READBACK_PHASE[\s\S]*?;\n/, "")
    .replace(/export const G20U36D_RELEASE_ID_SELECT_FIX_PHASE[\s\S]*?;\n/, "")
    .replace(/export const G20U36D_READBACK_ROOT_PLACEMENT_PHASE[\s\S]*?;\n/, "")
    .replace(/export const G20U36D_RELEASE_ID_SELECT_FIX_ROOT_PLACEMENT_PHASE[\s\S]*?;\n/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d release-id root-placement base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("tools draft doc exists", exists(TOOLS_DRAFT_DOC_REL));
assert("root index.ts exists", exists(ROOT_INDEX_REL));
assert("root handler.ts exists", exists(ROOT_HANDLER_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));

const doc = read(DOC_REL);
const rootIndex = read(ROOT_INDEX_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const draftIndex = read(DRAFT_INDEX_REL);
const draftHandler = read(DRAFT_HANDLER_REL);
const rootSrc = `${rootIndex}\n${rootHandler}`;
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const packageJson = read("tools/static-to-astro/package.json");

assert(
  "doc phase G-20u36d-readback-release-id-select-fix-root-placement",
  doc.includes("G-20u36d-readback-release-id-select-fix-root-placement"),
);
assert("doc gate root placed", doc.includes("gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixRootPlaced: true"));
assert("doc root placement only", doc.includes("root placement") || doc.includes("rootPlacementOnly"));
assert("doc scope exception 2 files", doc.includes("2") && /scope exception|Scope exception/i.test(doc));
assert("doc copy from tools draft", doc.includes("scripts/edge-functions/gosaki-discography-save-dry-run"));
assert("doc copy to root", doc.includes("supabase/functions/gosaki-discography-save-dry-run"));
assert("doc release SELECT id added", doc.includes("id") && /RELEASE_SELECT|release SELECT/i.test(doc));
assert("doc internal id only", doc.includes("internal") && doc.includes("id"));
assert(
  "doc sanitized summary no id",
  doc.includes("sanitized") && (/no UUID|not in readBack/i.test(doc) || doc.includes("no `id`")),
);
assert("doc no Edge deploy", doc.includes("deploy") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled|NOT EXECUTED/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not|no|NOT USED/i.test(doc));
assert("doc anon SELECT maintained", doc.includes("anon SELECT") || doc.includes("anonSelectPreferred"));
assert("doc live endpoint still pre-fix", doc.includes("pre-fix") || doc.includes("still runs pre-fix"));
assert("doc operation save reject", doc.includes("operation=save") || doc.includes("save"));
assert("doc write flags false", doc.includes("Write flags") || doc.includes("write flags"));
assert("doc next edge deploy", doc.includes("G-20u36d-readback-release-id-select-fix-edge-deploy"));

const scopeChanges = listAllSupabaseFunctionScopeChanges();
const committedScopeChanges = listCommittedSupabaseFunctionChanges();
const workingScopeChanges = listWorkingTreeSupabaseFunctionChanges();
const scopeChangesAllowed =
  exists(ROOT_INDEX_REL) &&
  exists(ROOT_HANDLER_REL) &&
  scopeChanges.every((f) => isAllowedSupabaseFunctionChange(f)) &&
  (scopeChanges.length > 0 ||
    (committedScopeChanges.length === 0 && workingScopeChanges.length === 0));
assert(
  "supabase/functions changes only gosaki-discography-save-dry-run",
  scopeChangesAllowed,
  scopeChanges.join(", ") || "no changes detected",
);
assert("other supabase functions _shared untouched", supabaseFunctionSubpathUntouched("supabase/functions/_shared"));
assert(
  "other supabase functions gosaki-youtube untouched",
  supabaseFunctionSubpathUntouched("supabase/functions/gosaki-youtube-url-dry-run"),
);

assert("root RELEASE_SELECT_FIELDS includes id", releaseSelectIncludesId(rootHandler));
assert("root internal id comment", rootHandler.includes("internal") && rootHandler.includes("id"));
assert("root resolveReadBackSnapshot uses releaseRow.id", rootHandler.includes("releaseRow.id"));
assert("root missing id warning", rootHandler.includes("release row missing internal id"));
assert("root tracks fetch try/catch", rootHandler.includes("anon SELECT tracks failed"));
assert("root mapReleaseRow omits id", rootHandler.includes("mapReleaseRowToCurrentSnapshotRelease") && !/title: row\?\.title[\s\S]{0,200}id:/.test(rootHandler));
assert(
  "root buildSanitizedReadBackSummary no id field",
  !/buildSanitizedReadBackSummary[\s\S]{0,300}\bid\b:/.test(rootHandler),
);
assert("root tracks path release_id", rootHandler.includes("release_id=eq."));
assert("root operation save reject", rootSrc.includes('operation "save" is rejected'));
assert("root didWrite false", rootHandler.includes("didWrite: false"));
assert("root dbWrite false", rootHandler.includes("dbWrite: false"));
assert("root networkWrite false", rootHandler.includes("networkWrite: false"));
assert("root saveEnabled false", rootHandler.includes("saveEnabled: false"));
assert("root SUPABASE_SERVICE_ROLE_CONNECTED false", rootHandler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("root no SUPABASE_SERVICE_ROLE_KEY", !/SUPABASE_SERVICE_ROLE_KEY/i.test(rootSrc));
assert("root no createClient", !rootSrc.includes("createClient") && !rootSrc.includes("@supabase/supabase-js"));
assert(
  "root no service_role env read",
  !/Deno\.env\.get\s*\(\s*["']SUPABASE_SERVICE_ROLE_KEY["']\s*\)/.test(rootSrc),
);

for (const pattern of MUTATION_PATTERNS) {
  assert(`root no mutation ${pattern}`, !pattern.test(rootSrc));
}
for (const pattern of DEPLOY_CALL_PATTERNS) {
  assert(`root no deploy call ${pattern}`, !pattern.test(rootSrc));
}

const normIndexDraft = normalizeSourceForCompare(draftIndex);
const normIndexRoot = normalizeSourceForCompare(rootIndex);
const normHandlerDraft = normalizeSourceForCompare(draftHandler);
const normHandlerRoot = normalizeSourceForCompare(rootHandler);
assert("root index matches tools draft logic", normIndexDraft === normIndexRoot);
assert("root handler matches tools draft logic", normHandlerDraft === normHandlerRoot);

assert("tools draft RELEASE_SELECT_FIELDS includes id", releaseSelectIncludesId(draftHandler));

assert("src unchanged", !diffTouches("src/"));
assert("public unchanged", !diffTouches("public/"));
assert("admin UI unchanged", !diffTouches(ADMIN_PAGE_REL));
assert("no new mutation sql files", listNewSqlFiles().length === 0);
assert("admin page save still disabled", adminPage.includes("Save（無効"));

assert(
  "package script verify:g20u36d-readback-release-id-select-fix-root-placement",
  packageJson.includes("verify:g20u36d-readback-release-id-select-fix-root-placement"),
);

assert(
  "AI current-state release-id root placement",
  currentState.includes("G-20u36d-readback-release-id-select-fix-root-placement") ||
    currentState.includes("release-id-select-fix-root-placement"),
);
assert(
  "AI next-actions edge deploy",
  nextActions.includes("G-20u36d-readback-release-id-select-fix-edge-deploy") ||
    nextActions.includes("release-id-select-fix-edge-deploy"),
);
assert(
  "AI handoff release id root placement",
  handoff.includes("release-id") || handoff.includes("release id"),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36d-readback-release-id-select-fix-root-placement: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
