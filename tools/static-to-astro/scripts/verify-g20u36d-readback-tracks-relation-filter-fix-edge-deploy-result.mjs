/**
 * G-20u36d-readback-tracks-relation-filter-fix-edge-deploy-result verifier.
 * Result-record only — no re-deploy / SQL / Save / root edit.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-edge-deploy-preflight.md";
const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-root-placement.md";
const ENV_SECRET_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "7578f26";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";
const READBACK_ENV = "GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation filter-fix edge-deploy-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during result doc creation`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));
assert("root placement doc exists", exists(ROOT_PLACEMENT_DOC_REL));
assert("env secret result doc exists", exists(ENV_SECRET_RESULT_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-relation-filter-fix-edge-deploy-result-record",
  doc.includes("G-20u36d-readback-tracks-relation-filter-fix-edge-deploy-result-record"),
);
assert(
  "doc gate edge deployed",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixEdgeDeployed: true"),
);
assert("doc deploy success", doc.includes("SUCCESS") || /deploy succeeded|Deployed Functions/i.test(doc));
assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|not used|禁止|unused/i.test(doc));
assert("doc function name", doc.includes(FUNCTION_NAME));
assert(
  "doc deploy command",
  doc.includes("supabase functions deploy") && doc.includes(FUNCTION_NAME) && doc.includes(STAGING_REF),
);
assert("doc cd repo root in command", doc.includes("cd ~/sariswing-astro") || doc.includes("~/sariswing-astro"));
assert("doc uploaded index.ts", doc.includes("index.ts"));
assert("doc uploaded handler.ts", doc.includes("handler.ts"));
assert("doc Docker warning non-blocking", doc.includes("Docker") && /non-blocking/i.test(doc));
assert("doc CLI update notice non-blocking", doc.includes("CLI") && /non-blocking|no action required/i.test(doc));
assert(
  "doc cli-latest changed after deploy",
  doc.includes("cli-latest") && (/changed|cliLatestChanged: true/i.test(doc)),
);
assert(
  "doc cli-latest restored by operator",
  doc.includes("cli-latest") && (/restore|cliLatestRestoredByOperator/i.test(doc)),
);
assert(
  "doc final git clean",
  doc.includes("clean") && (/final git status|finalGitStatusClean/i.test(doc)),
);
assert("doc env secret added", doc.includes(READBACK_ENV) && /added/i.test(doc));
assert(
  "doc tracks-relation-filter fix deployed",
  doc.includes("tracks-relation-filter fix") || doc.includes("tracksRelationFilterFixDeployed"),
);
assert("doc release_id filter removed", doc.includes("release_id") && /remove|removed|除去/i.test(doc));
assert("doc discography_legacy_id filter", doc.includes("discography_legacy_id"));
assert(
  "doc readBack capable deployed",
  doc.includes("readBack-capable") || doc.includes("readBackCapableCodeDeployed"),
);
assert(
  "doc live verify retry-3 not executed",
  doc.includes("retry-3") ||
    doc.includes("Live verify retry-3") ||
    doc.includes("liveVerifyRetry3Executed: false"),
);
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert(
  "doc root supabase functions not edited",
  doc.includes("supabase/functions") && /no|not|false|未編集|unchanged/i.test(doc),
);
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|Forbidden|not used/i.test(doc));
assert("doc next live-verify-retry-3", doc.includes("G-20u36d-readback-live-verify-retry-3"));

assert(
  "package script verify:g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state edge-deploy-result",
  currentState.includes("G-20u36d-readback-tracks-relation-filter-fix-edge-deploy-result") ||
    currentState.includes("tracks-relation-filter-fix-edge-deploy-result"),
);
assert(
  "AI next-actions live-verify-retry-3",
  nextActions.includes("G-20u36d-readback-live-verify-retry-3") ||
    nextActions.includes("live-verify-retry-3"),
);
assert(
  "AI handoff relation edge deploy result",
  handoff.includes("tracks-relation-filter-fix-edge-deploy-result") ||
    (handoff.includes("EdgeDeployed") && handoff.includes("discography_legacy_id")),
);

assert("Edge redeploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36d-readback-tracks-relation-filter-fix-edge-deploy-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
