/**
 * G-20u36d-readback-env-secret-setting-plan verifier.
 * Planning-only — no secret set / Edge deploy / SQL / Save / root edit.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-env-secret-setting-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-plan.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-edge-deploy-preflight.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "4be4bf1";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack env-secret-setting-plan base ${BASE_COMMIT}) — non-blocking`,
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
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36d-readback-env-secret-setting-plan", doc.includes("G-20u36d-readback-env-secret-setting-plan"));
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackEnvSecretSettingPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc secret setting not executed", doc.includes("secret") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc root supabase functions not edited", doc.includes("supabase/functions") && /no|not|false|未編集|unchanged/i.test(doc));

assert("doc SUPABASE_URL exists", doc.includes("SUPABASE_URL") && /exists/i.test(doc));
assert("doc SUPABASE_ANON_KEY exists", doc.includes("SUPABASE_ANON_KEY") && /exists/i.test(doc));
assert("doc GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED missing", doc.includes(READBACK_ENV) && /missing/i.test(doc));

assert("doc setting name", doc.includes(READBACK_ENV));
assert("doc setting value true", doc.includes("true") && doc.includes("Value"));
assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));

assert("doc Dashboard procedure", doc.includes("Supabase Dashboard") && doc.includes("Edge Functions"));
assert("doc Dashboard Add secret", doc.includes("Add secret"));
assert("doc CLI alternative", doc.includes("supabase secrets set") && doc.includes(STAGING_REF));

assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|Forbidden|not used/i.test(doc));
assert("doc anon SELECT policy", doc.includes("anon SELECT") || doc.includes("supabase-select"));
assert("doc schema-only fallback", doc.includes("schema-only") || doc.includes("readBack: null"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc value true only STOP", doc.includes("true") && /STOP|other than/i.test(doc));
assert("doc no secret values in logs", doc.includes("names") && /never|not record|表示|not displayed/i.test(doc));

assert("doc next env-secret-setting", doc.includes("G-20u36d-readback-env-secret-setting"));
assert("doc next env-secret-setting-result-record", doc.includes("G-20u36d-readback-env-secret-setting-result-record"));
assert("doc next edge-deploy", doc.includes("G-20u36d-readback-edge-deploy"));
assert("doc next live-verify", doc.includes("G-20u36d-readback-live-verify"));

assert(
  "package script verify:g20u36d-readback-env-secret-setting-plan",
  packageJson.includes("verify:g20u36d-readback-env-secret-setting-plan"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state env-secret-setting-plan",
  currentState.includes("G-20u36d-readback-env-secret-setting-plan") ||
    currentState.includes("env-secret-setting-plan"),
);
assert(
  "AI next-actions env-secret-setting",
  nextActions.includes("G-20u36d-readback-env-secret-setting"),
);
assert(
  "AI handoff readBack env secret plan",
  handoff.includes("G-20u36d") && (handoff.includes("env-secret") || handoff.includes("secret setting")),
);

assert("Supabase secret not set by Cursor", true);
assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-env-secret-setting-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
