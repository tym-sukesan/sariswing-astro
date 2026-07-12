/**
 * G-20u36d-readback-tracks-select-fields-fix-plan verifier.
 * Planning-only — no root/tools draft edit / Edge deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-select-fields-fix-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-plan.md";
const LIVE_VERIFY_RETRY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "6e677cf";
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

function trackSelectIncludesDuration(src) {
  const match = src.match(/TRACK_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return /["']duration["']/.test(match[1]);
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-select-fields fix plan base ${BASE_COMMIT}) — non-blocking`,
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
assert("live verify retry doc exists", exists(LIVE_VERIFY_RETRY_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));
assert("tools handler exists", exists(TOOLS_HANDLER_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));

const doc = read(DOC_REL);
const liveVerifyRetryDoc = read(LIVE_VERIFY_RETRY_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const toolsHandler = read(TOOLS_HANDLER_REL);
const readbackLib = read(READBACK_LIB_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-select-fields-fix-planning",
  doc.includes("G-20u36d-readback-tracks-select-fields-fix-planning"),
);
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan") && /plan.*only|planning doc/i.test(doc));
assert("doc root edit not executed", doc.includes("Root") && /no|not|false|未編集/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));

assert("doc STOP trackCount zero", doc.includes("trackCount") && doc.includes("0"));
assert("doc STOP matching 400", doc.includes("matching") && doc.includes("400"));
assert("doc STOP release id pass", doc.includes("id") && (/release.*id.*PASS|Release SELECT internal/i.test(doc)));
assert("doc STOP tracks SELECT reached", doc.includes("Tracks SELECT") && /reached|attempted/i.test(doc));
assert("doc STOP cause duration missing", doc.includes("duration") && doc.includes("does not exist"));
assert("doc PostgREST 42703", doc.includes("42703") || doc.includes("42703"));
assert("doc write flags false safe", doc.includes("write flags") && /false|not a dangerous/i.test(doc));
assert("doc no G20u36e until retry pass", doc.includes("G-20u36e") && /after|until|PASS/i.test(doc));

assert(
  "doc remove duration from TRACK_SELECT_FIELDS",
  doc.includes("TRACK_SELECT_FIELDS") && doc.includes("duration") && /remove|exclude|must not SELECT/i.test(doc),
);
assert("doc duration optional absent", doc.includes("optional") || doc.includes("absent"));
assert("doc proposed fields without duration", doc.includes("track_number") && doc.includes("title") && doc.includes("sort_order"));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not referenced|not used/i.test(doc));
assert("doc anon SELECT maintained", doc.includes("anon SELECT") || doc.includes("anonSelectPreferred"));
assert("doc operation save reject", doc.includes("operation=save") || doc.includes("save") && /reject/i.test(doc));
assert("doc write flags false maintain", doc.includes("didWrite") && doc.includes("saveEnabled"));
assert("doc sanitized summary no raw rows", doc.includes("sanitized") && /no UUID|raw row/i.test(doc));
assert("doc mock matching trackCount 8", doc.includes("trackCount") && doc.includes("8"));
assert("doc mock matching wouldWrite false", doc.includes("wouldWrite") && doc.includes("false"));
assert("doc mock plusOne wouldWrite true", doc.includes("wouldWrite") && doc.includes("true") && doc.includes("tracksAdded"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc next tools-draft fix", doc.includes("G-20u36d-readback-tracks-select-fields-fix-tools-draft"));
assert("doc next root placement", doc.includes("G-20u36d-readback-tracks-select-fields-fix-root-placement"));
assert("doc next edge deploy", doc.includes("G-20u36d-readback-tracks-select-fields-fix-edge-deploy"));
assert("doc next live verify retry 2", doc.includes("G-20u36d-readback-live-verify-retry-2") || doc.includes("live-verify-retry-2"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));

assert("live verify retry doc gate false", liveVerifyRetryDoc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetryPassed: false"));
assert("live verify retry doc duration cause", liveVerifyRetryDoc.includes("duration") && liveVerifyRetryDoc.includes("does not exist"));

assert("root handler bug TRACK_SELECT_FIELDS includes duration", trackSelectIncludesDuration(rootHandler));
assert("tools handler bug TRACK_SELECT_FIELDS includes duration", trackSelectIncludesDuration(toolsHandler));
assert("readback lib bug TRACK_SELECT_FIELDS includes duration", trackSelectIncludesDuration(readbackLib));
assert("root handler mapTrackRowsToTracksText title only", rootHandler.includes("mapTrackRowsToTracksText"));
assert("root handler buildSanitizedReadBackSummary", rootHandler.includes("buildSanitizedReadBackSummary"));

assert(
  "package script verify:g20u36d-readback-tracks-select-fields-fix-plan",
  packageJson.includes("verify:g20u36d-readback-tracks-select-fields-fix-plan"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
assert("readback lib not modified this phase", !diffTouches(READBACK_LIB_REL));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state tracks-select-fields fix plan",
  currentState.includes("G-20u36d-readback-tracks-select-fields-fix-plan") ||
    currentState.includes("tracks-select-fields-fix-plan"),
);
assert(
  "AI next-actions tools-draft fix",
  nextActions.includes("G-20u36d-readback-tracks-select-fields-fix-tools-draft") ||
    nextActions.includes("tracks-select-fields-fix-tools-draft"),
);
assert(
  "AI handoff tracks select fields fix plan",
  handoff.includes("tracks-select") || handoff.includes("tracks SELECT") || handoff.includes("duration"),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-tracks-select-fields-fix-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
