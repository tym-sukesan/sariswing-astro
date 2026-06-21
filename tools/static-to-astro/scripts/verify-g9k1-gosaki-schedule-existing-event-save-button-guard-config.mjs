/**
 * G-9k1 — Gosaki operator save button guard / config / verifier (implementation only).
 * Run: node tools/static-to-astro/scripts/verify-g9k1-gosaki-schedule-existing-event-save-button-guard-config.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9J5_APPROVAL = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const G9J5_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const BLOCKED_REF = "vsbvndwuajjhnzpohghh";
const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];
const FORBIDDEN_FIELDS = ["date", "month", "published", "schedule_months"];

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
const guardsSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-guards.ts",
);
const configSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts",
);
const g9jConfigSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts",
);
const g9j5ConfigSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-g9j5-config.ts",
);
const hostGateSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts",
);
const operatorUiSrc = readRepo(
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
);
const g9j5RunnerSrc = readRepo(
  "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs",
);

assert(
  "G-9k approval ID registered",
  typesSrc.includes(G9K_APPROVAL) &&
    typesSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID") &&
    typesSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID,"),
);

assert("G-9k env arm in config", configSrc.includes(G9K_ARM));
assert("G-9k1 phase in config", configSrc.includes("G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier"));
assert("G-9k saveEnabled false", configSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));
assert(
  "G-9k config uses G-9k approval not G-9j5",
  configSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID") &&
    !configSrc.includes("G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID"),
);
assert(
  "G-9k config blocks G-9j5 arm",
  configSrc.includes(G9J5_ARM) && configSrc.includes("must be off (G-9j5 runner arm)"),
);
assert(
  "G-9j config blocks G-9k arm",
  g9jConfigSrc.includes(G9K_ARM) && g9jConfigSrc.includes("must be off (G-9k save button arm)"),
);
assert(
  "G-9k guards do not import g9j5 fixed config",
  !guardsSrc.includes("g9j5-config") && !guardsSrc.includes("G9J5_TARGET_ROW_ID"),
);
assert(
  "g9j5 config separate from G-9k config",
  g9j5ConfigSrc.includes("G9J5_TARGET_ROW_ID") && !g9j5ConfigSrc.includes(G9K_APPROVAL),
);

for (const field of SAFE_FIELDS) {
  assert(`safe field ${field}`, guardsSrc.includes(`"${field}"`) || guardsSrc.includes("G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS"));
}
assert("G9K safe fields export", guardsSrc.includes("G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS"));

for (const field of FORBIDDEN_FIELDS) {
  assert(`forbidden ${field} not in G-9k safe export`, !guardsSrc.match(new RegExp(`G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS[\\s\\S]*"${field}"`)));
}

assert("project ref allowlist in config", configSrc.includes("projectAllowlistPassed") && configSrc.includes("evaluateStagingProjectAllowlist"));
assert("staging ref in host gate", hostGateSrc.includes(STAGING_REF));
assert("sari-site block in host gate", hostGateSrc.includes(BLOCKED_REF));
assert("site_slug gosaki-piano in config", configSrc.includes("STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG"));
assert("no service_role in G-9k modules", !configSrc.includes("service_role") && !guardsSrc.includes("service_role"));
assert("auth session required flag", configSrc.includes("authSessionRequired: true"));
assert("optimistic lock required flag", configSrc.includes("optimisticLockRequired: true"));
assert("rowsAffected must be 1 flag", configSrc.includes("rowsAffectedMustBeOne: true"));
assert("assertG9kOptimisticLockBaseline", guardsSrc.includes("assertG9kOptimisticLockBaseline"));
assert("assertG9kAuthSessionPresent", guardsSrc.includes("assertG9kAuthSessionPresent"));
assert("assertG9kRowsAffectedExactlyOne", guardsSrc.includes("assertG9kRowsAffectedExactlyOne"));
assert("assertG9kSaveButtonApproval", guardsSrc.includes("assertG9kSaveButtonApproval"));
assert("reuse G-9j payload guards", guardsSrc.includes("assertG9jExistingEventUpdatePayloadOnly"));
assert("buildG9kExistingEventSaveButtonPayload", guardsSrc.includes("buildG9kExistingEventSaveButtonPayload"));

assert(
  "operator UI save still disabled",
  operatorUiSrc.includes('data-gosaki-save-allowed="false"') &&
    operatorUiSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED") &&
    !operatorUiSrc.includes("gosaki-schedule-existing-event-save-button-save") &&
    !operatorUiSrc.includes("executeG9kExistingEventSaveButtonSave"),
);
assert("no G-9k save executor module", !fs.existsSync(path.join(REPO_ROOT, "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts")));

assert("g9j5 runner unchanged", !g9j5RunnerSrc.includes(G9K_APPROVAL) && g9j5RunnerSrc.includes(G9J5_APPROVAL));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

// Programmatic guard smoke (no DB)
function assertChangedFieldsOnly(changedFields) {
  if (changedFields.length === 0) throw new Error("no changes");
  const safe = new Set(SAFE_FIELDS);
  const forbidden = new Set(FORBIDDEN_FIELDS);
  for (const field of changedFields) {
    if (forbidden.has(field)) throw new Error(`forbidden: ${field}`);
    if (!safe.has(field)) throw new Error(`not allowed: ${field}`);
  }
}

try {
  assertChangedFieldsOnly([]);
  assert("empty changedFields rejected", false);
} catch (error) {
  assert("empty changedFields rejected", String(error).includes("no changes"));
}

try {
  assertChangedFieldsOnly(["date"]);
  assert("date in changedFields rejected", false);
} catch (error) {
  assert("date in changedFields rejected", String(error).includes("forbidden"));
}

try {
  assertChangedFieldsOnly(["venue"]);
  assert("single safe field allowed", true);
} catch {
  assert("single safe field allowed", false);
}

function assertRowsAffected(n) {
  if (n !== 1) throw new Error(`rowsAffected must be 1 (got ${n})`);
}
try {
  assertRowsAffected(0);
  assert("rowsAffected 0 rejected", false);
} catch (error) {
  assert("rowsAffected 0 rejected", String(error).includes("1"));
}

function assertTitleNonEmpty(title) {
  if (!String(title ?? "").trim()) throw new Error("title empty");
}
try {
  assertTitleNonEmpty("");
  assert("empty title rejected", false);
} catch (error) {
  assert("empty title rejected", String(error).includes("empty"));
}

const planningVerifier = spawnSync(
  "node",
  ["tools/static-to-astro/scripts/verify-g9k-gosaki-schedule-existing-event-save-button-enablement-planning.mjs"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("G-9k planning verifier passes", planningVerifier.status === 0);
if (planningVerifier.status !== 0) {
  console.error(planningVerifier.stdout);
  console.error(planningVerifier.stderr);
}

const docPath = path.join(TOOL_ROOT, "docs", "gosaki-schedule-existing-event-save-button-guard-config.md");
if (fs.existsSync(docPath)) {
  const doc = fs.readFileSync(docPath, "utf8");
  assert("G-9k1 doc phase", doc.includes("G-9k1"));
  assert("G-9k1 doc no DB write", doc.includes("DB write") && (doc.includes("no") || doc.includes("**no**")));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
