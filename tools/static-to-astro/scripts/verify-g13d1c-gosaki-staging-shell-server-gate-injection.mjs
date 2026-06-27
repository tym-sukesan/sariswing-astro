/**
 * G-13d1c — Gosaki staging shell server gate injection verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1c-gosaki-staging-shell-server-gate-injection.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-shell-server-gate-injection.md";
const LAYOUT_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro";
const PROTOTYPE_REL =
  "tools/static-to-astro/templates/admin-cms/prototypes/musician-basic-admin-prototype.astro";
const CLIENT_GATES_REL = "src/lib/admin/staging-shell/staging-shell-client-gates.ts";
const SERVER_GATES_REL = "src/lib/admin/staging-shell/staging-shell-server-gates.ts";
const READ_CONFIG_REL = "src/lib/admin/staging-data/read-only-data-config.ts";
const RESOLVE_REL =
  "src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-target-row-resolve.ts";
const G13_CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const GATE_ELEMENT_ID = "staging-shell-server-gates";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";

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

const doc = read(DOC_REL);
const layoutSrc = read(LAYOUT_REL);
const prototypeSrc = read(PROTOTYPE_REL);
const clientGatesSrc = read(CLIENT_GATES_REL);
const serverGatesSrc = read(SERVER_GATES_REL);

assert("G-13d1c doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13d1c", doc.includes("G-13d1c-gosaki-staging-shell-server-gate-injection"));
assert("doc injection complete", doc.includes("local implementation complete"));
assert("doc references G-6-d", doc.includes("G-6-d") || doc.includes("staging-env-gate-client-fix"));
assert("doc G-13c1 Preview effect", doc.includes("G-13c1"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no Event B", !doc.includes(EVENT_B_ID));

assert("layout imports getStagingShellServerGateSnapshot", layoutSrc.includes("getStagingShellServerGateSnapshot"));
assert("layout imports STAGING_SHELL_SERVER_GATES_ELEMENT_ID", layoutSrc.includes("STAGING_SHELL_SERVER_GATES_ELEMENT_ID"));
assert("layout gate element id", layoutSrc.includes(GATE_ELEMENT_ID));
assert("layout application/json script", layoutSrc.includes('type="application/json"'));
assert("layout set:html injection", layoutSrc.includes("set:html={stagingServerGatesJson}"));
assert("layout server snapshot call", layoutSrc.includes("getStagingShellServerGateSnapshot(import.meta.env)"));

assert("prototype also has gate injection", prototypeSrc.includes("getStagingShellServerGateSnapshot"));
assert("client gates read element id", clientGatesSrc.includes(GATE_ELEMENT_ID));
assert("client gates merge data read", clientGatesSrc.includes("ENABLE_ADMIN_STAGING_DATA_READ"));
assert("server gates stagingDataReadFlag", serverGatesSrc.includes("stagingDataReadFlag"));

assert("read config uses mergeStagingShellEnv", read(READ_CONFIG_REL).includes("mergeStagingShellEnv"));
assert("G-13 resolve uses getReadOnlyDataConfig", read(RESOLVE_REL).includes("getReadOnlyDataConfig"));
assert("G-13 config uses mergeStagingShellEnv", read(G13_CONFIG_REL).includes("mergeStagingShellEnv"));
assert("layout no Event B", !layoutSrc.includes(EVENT_B_ID));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13d1c server gate injection verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
