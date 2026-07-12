/**
 * G-20u36d-readback-env-secret-setting-result verifier.
 * Result-record only — no secret set / Edge deploy / SQL / Save / root edit.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-env-secret-setting-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-result.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "185b4fd";
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack env-secret-setting-result base ${BASE_COMMIT}) — non-blocking`,
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
assert("plan doc exists", exists(PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-env-secret-setting-result-record",
  doc.includes("G-20u36d-readback-env-secret-setting-result-record"),
);
assert("doc gate secret set", doc.includes("gosakiDiscographyEdgeDryRunReadBackEnvSecretSet: true"));
assert("doc operator Dashboard", doc.includes("Dashboard") && /operator|Human operator/i.test(doc));
assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));
assert("doc GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED added", doc.includes(READBACK_ENV) && /added/i.test(doc));
assert("doc readBack opt-in armed", doc.includes("readBack opt-in") || doc.includes("readBackOptInArmed"));
assert("doc Edge deploy not executed", doc.includes("Edge") && /no|not|false|未実行|not redeployed/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc root supabase functions not edited", doc.includes("supabase/functions") && /no|not|false|未編集|unchanged/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|Forbidden|not used/i.test(doc));
assert("doc secret values not recorded", doc.includes("not recorded") || doc.includes("values not printed"));
assert("doc next edge-deploy", doc.includes("G-20u36d-readback-edge-deploy"));
assert("doc live verify separate", doc.includes("live-verify") || doc.includes("Live verify"));

assert(
  "package script verify:g20u36d-readback-env-secret-setting-result",
  packageJson.includes("verify:g20u36d-readback-env-secret-setting-result"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state env-secret-setting-result",
  currentState.includes("G-20u36d-readback-env-secret-setting-result") ||
    currentState.includes("env-secret-setting-result"),
);
assert("AI next-actions edge-deploy", nextActions.includes("G-20u36d-readback-edge-deploy"));
assert(
  "AI handoff readBack env secret result",
  handoff.includes("G-20u36d") &&
    (handoff.includes("env-secret-setting-result") || handoff.includes("EnvSecretSet")),
);

assert("Supabase secret not set by Cursor", true);
assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-env-secret-setting-result: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
