/**
 * G-13d1g — G-13c1 project allowlist property name fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1g-gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const HOST_GATE_REL = "src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";

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

function extractSupabaseProjectRef(supabaseUrl) {
  const trimmed = String(supabaseUrl ?? "").trim();
  if (!trimmed) return "—";
  try {
    const host = new URL(trimmed).host;
    if (!host.endsWith(".supabase.co")) return "—";
    return host.replace(/\.supabase\.co$/i, "");
  } catch {
    const host = trimmed.replace(/^https?:\/\//i, "").split("/")[0] || "—";
    if (!host.endsWith(".supabase.co")) return "—";
    return host.replace(/\.supabase\.co$/i, "");
  }
}

const doc = read(DOC_REL);
const configSrc = read(CONFIG_REL);
const hostGateSrc = read(HOST_GATE_REL);
const g9kConfigSrc = read(G9K_CONFIG_REL);

assert("G-13d1g doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13d1g", doc.includes("G-13d1g-gosaki-schedule-event-a-poc-cleanup-project-allowlist-property-fix"));
assert("doc wrong props documented", doc.includes("projectAllowlist.passed") && doc.includes("allowlistPassed"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no Event B", !doc.includes(EVENT_B_ID));

assert("config uses allowlistPassed", configSrc.includes("projectAllowlist.allowlistPassed"));
assert("config uses errorMessage", configSrc.includes("projectAllowlist.errorMessage"));
assert(
  "config no wrong .passed on projectAllowlist",
  !configSrc.includes("projectAllowlist.passed"),
);
assert(
  "config no wrong failureReason on projectAllowlist",
  !configSrc.includes("projectAllowlist.failureReason"),
);
assert("config evaluateStagingProjectAllowlist import", configSrc.includes("evaluateStagingProjectAllowlist"));
assert("config Event A target", configSrc.includes(EVENT_A_ID));
assert("config no Event B target id", !configSrc.includes(`= "${EVENT_B_ID}"`));
assert("config approval constant", configSrc.includes("G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID"));

assert("host gate staging ref constant", hostGateSrc.includes(`STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF = "${STAGING_REF}"`));
assert("host gate allowlistPassed field", hostGateSrc.includes("allowlistPassed: boolean"));
assert("host gate errorMessage field", hostGateSrc.includes("errorMessage: string | null"));

assert("G-9k reference allowlistPassed", g9kConfigSrc.includes("projectAllowlist.allowlistPassed"));
assert("G-9k reference errorMessage", g9kConfigSrc.includes("projectAllowlist.errorMessage"));

const simulatedRef = extractSupabaseProjectRef(STAGING_URL);
assert("staging URL extracts ref", simulatedRef === STAGING_REF);
assert(
  "staging ref allowlist simulation",
  simulatedRef !== "—" && simulatedRef === STAGING_REF,
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13d1g project allowlist property fix verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
