#!/usr/bin/env node
/**
 * Offline verifier — CMS Core v2 Schedule TBD CREATE oneshot final-preflight.
 * npm: verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md",
);
const IMPL = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md",
);
const SAVE = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-save.ts",
);
const CONFIG = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-config.ts",
);
const GUARDS = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-guards.ts",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

let passed = 0;
let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

const doc = fs.readFileSync(DOC, "utf8");
const impl = fs.readFileSync(IMPL, "utf8");
const save = fs.readFileSync(SAVE, "utf8");
const config = fs.readFileSync(CONFIG, "utf8");
const guards = fs.readFileSync(GUARDS, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight/.test(doc),
);
assert("HEAD recorded", /dcc8de812b6b683e7417b5094be29cc8958c6aac|35d8d431ebb60b8c4012c8e06ab2f59963554b94/.test(doc));
assert("staging ref", /kmjqppxjdnwwrtaeqjta/.test(doc));
assert("production STOP", /vsbvndwuajjhnzpohghh/.test(doc));
assert("IMPLEMENTATION_READY true", /IMPLEMENTATION_READY:\s*true/.test(doc));
assert("PREFLIGHT_PASS true", /PREFLIGHT_PASS:\s*true/.test(doc));
assert(
  "PREFLIGHT_ANON_SUBSET_PASS true",
  /PREFLIGHT_ANON_SUBSET_PASS:\s*true/.test(doc),
);
assert("SQL Editor PASS recorded", /PREFLIGHT_SQL_EDITOR_FULL_TABLE:\s*pass/.test(doc));
assert(
  "observed_at recorded",
  /2026-08-03 15:51:19\.118619\+00/.test(doc),
);
assert("EXECUTION_PACKET_READY true", /EXECUTION_PACKET_READY:\s*true/.test(doc));
assert("ACTUAL_WRITE_READY false", /ACTUAL_WRITE_READY:\s*false/.test(doc));
assert("ACTUAL_WRITE_EXECUTED false", /ACTUAL_WRITE_EXECUTED:\s*false/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("CLEANUP_EXECUTED false", /CLEANUP_EXECUTED:\s*false/.test(doc));
assert(
  "execution-preparation phase",
  /cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-preparation/.test(doc),
);
assert(
  "process-scoped packet phase",
  /cms-core-v2-schedule-tbd-create-oneshot-process-scoped-env-packet-correction/.test(doc),
);
assert(
  "write-stack correction phase",
  /cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction/.test(doc),
);
assert("human steps 1-13", /### Step 1/.test(doc) && /### Step 13/.test(doc));
assert(
  "process-scoped env command",
  /env \\\s*\n\s*ENABLE_ADMIN_STAGING_WRITE=true/.test(doc) &&
    /npm run dev/.test(doc),
);
assert(
  "process-scoped exact 7 keys in command",
  /ENABLE_ADMIN_STAGING_WRITE=true/.test(doc) &&
    /PUBLIC_ADMIN_WRITE_PROVIDER=supabase/.test(doc) &&
    /PUBLIC_ADMIN_WRITE_MODULE=schedule/.test(doc) &&
    /PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot/.test(doc) &&
    /PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true/.test(doc) &&
    /ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true/.test(doc) &&
    /PUBLIC_ADMIN_WRITE_DRY_RUN=false/.test(doc),
);
assert(
  "forbid .env.local write for 7 keys",
  /forbidden.*\.env\.local|never.*write the oneshot 7 keys|\.env\.local.*FORBIDDEN/i.test(doc),
);
assert(
  "no .env.local restore instruction",
  !/Restore root `\.env\.local`/.test(doc) && !/Restore root \.env\.local/.test(doc),
);
assert("Ctrl+C armed process stop", /Ctrl\+C/.test(doc));
assert("process env overrides files", /process env overrides/.test(doc));
assert("armed build/package forbidden", /Armed `build`|armed `build`|FORBIDDEN/.test(doc));
assert("no arm ON this phase", /no\*\* arm ON|no arm ON|arm ON ·|\*\*no\*\* arm ON/.test(doc));
assert("legacy_id fixed", /schedule-2026-11-001/.test(doc));
assert("approval id", /cms-core-v2-schedule-tbd-create-non-dry-run-oneshot/.test(doc));
assert("executeTbdCreateOneshotSave named", /executeTbdCreateOneshotSave/.test(doc));
assert(
  "internal INSERT named",
  /insertTbdCreateOneshotScheduleWriteInternal/.test(doc),
);
assert("probeDateStatusColumn named", /probeDateStatusColumn/.test(doc));
assert("runbook Step 1", /### Step 1/.test(doc));
assert("runbook Step 2", /### Step 2/.test(doc));
assert("runbook Step 3", /### Step 3/.test(doc));
assert("runbook Step 4", /### Step 4/.test(doc));
assert("runbook Step 5", /### Step 5/.test(doc));
assert("runbook Step 6", /### Step 6/.test(doc));
assert("runbook Step 7", /### Step 7/.test(doc));
assert("runbook Step 8", /### Step 8/.test(doc));
assert("runbook Step 9", /### Step 9/.test(doc));
assert("runbook Step 10", /### Step 10/.test(doc));
assert("runbook Step 11", /### Step 11/.test(doc));
assert("runbook Step 12", /### Step 12/.test(doc));
assert("runbook Step 13", /### Step 13/.test(doc));
assert("post-check total 80", /c\.total = 80|total = 80/.test(doc));
assert("post-check published 74", /published = 74/.test(doc));
assert("cleanup transaction", /\bbegin;/.test(doc) && /\bcommit;/.test(doc));
assert("cleanup lock_timeout", /lock_timeout/.test(doc));
assert("cleanup statement_timeout", /statement_timeout/.test(doc));
assert("cleanup count=1 assert", /exact cleanup target count/.test(doc));
assert("cleanup RETURNING", /returning id/i.test(doc));
assert(
  "cleanup armed process ended precondition",
  /Armed process \*\*ended\*\*|armed process ended|Ctrl\+C/.test(doc),
);
assert("no broad DELETE", !/delete from public\.schedules;/i.test(doc));
assert("fingerprint section", /Fingerprint/.test(doc));
assert("venue marker", /TBD create PoC venue/.test(doc));
assert("sort_order 0", /"sort_order": 0/.test(doc));
assert("anon 74 documented", /total \(anon RLS\)[\s\S]*\*\*74\*\*/.test(doc));
assert("SQL Editor 79 expected", /total\s*\|\s*\*\*79\*\*/.test(doc) || /\|\s*\*\*79\*\*\s*\|\s*\*\*74\*\*/.test(doc));
assert("peer G22E listed", /G22E_NEW_EVENT_INSERT/.test(doc));
assert("peer Edge GOSAKI_SCHEDULE_SAVE_ARMED", /GOSAKI_SCHEDULE_SAVE_ARMED/.test(doc));
assert("client arm env", /PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED/.test(doc));
assert("server arm env", /ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED/.test(doc));
assert("dry-run env", /PUBLIC_ADMIN_WRITE_DRY_RUN/.test(doc));
assert(
  "plain baseline restart documented",
  /plain `npm run dev`|File baseline|optional plain baseline/.test(doc),
);
assert("server arm not baked raw", /Not\*\* exposed: raw|raw server arm string/.test(doc));
assert("ambiguous no retry", /ambiguous[\s\S]*never|no re-click/i.test(doc));
assert("UUID not fixed in docs", !/aa440e29-5be8-402e-9190-0d81c48434c0/.test(doc));
assert("next execution phase", /staging-execution/.test(doc));
assert("impl mentions final-preflight", /final-preflight/.test(impl));
assert("save still public execute only", /Public write API: executeTbdCreateOneshotSave only/.test(save));
assert("INSERT not exported", !/export async function insertTbdCreate/.test(save));
assert("internal INSERT present", /async function insertTbdCreateOneshotScheduleWriteInternal/.test(save));
assert("config dual arm", /PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV/.test(config));
assert("guards baseline 79", /totalSchedules: 79/.test(guards));
assert("npm script registered", /verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight/.test(pkg));
assert(
  "Safety Suite registers final-preflight",
  /schedule-tbd-date-save-non-dry-run-staging-final-preflight/.test(suite),
);

const baseline = spawnSync(
  process.execPath,
  [path.join(TOOL_ROOT, "scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs")],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baseline.status === 0, baseline.stderr || baseline.stdout);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
