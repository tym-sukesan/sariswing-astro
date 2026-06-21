/**
 * G-9j5b — Gosaki staging admin auth gate verifier.
 * Run: node tools/static-to-astro/scripts/verify-g9j5b-gosaki-staging-admin-auth-gate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

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

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const GATE_TS = "src/lib/admin/staging-auth/staging-admin-auth-gate.ts";
const GATE_COMPONENT =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAuthGate.astro";

const adminPages = [
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminHomePage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminYoutubePage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro",
];

const gateTs = read(GATE_TS);
const gateComponent = read(GATE_COMPONENT);

assert("staging-admin-auth-gate.ts exists", fs.existsSync(path.join(REPO_ROOT, GATE_TS)));
assert("AdminGosakiStagingAuthGate.astro exists", fs.existsSync(path.join(REPO_ROOT, GATE_COMPONENT)));

for (const page of adminPages) {
  const src = read(page);
  assert(`${path.basename(page)} uses AdminGosakiStagingAuthGate`, src.includes("AdminGosakiStagingAuthGate"));
}

assert(
  "protected region hidden by default",
  gateComponent.includes('id="staging-admin-auth-gate-protected"') &&
    gateComponent.includes("hidden"),
);
assert(
  "login region hidden by default",
  gateComponent.includes('id="staging-admin-auth-gate-login"') &&
    gateComponent.includes("hidden"),
);

assert("getSession via getStagingAuthSessionDetails", gateTs.includes("getStagingAuthSessionDetails"));
assert("onAuthStateChange subscription", gateTs.includes("onAuthStateChange"));
assert("signOutStagingAuth on logout", gateTs.includes("signOutStagingAuth"));
assert("protected hidden when unauthenticated", gateTs.includes('setHidden(PROTECTED_ID, true)'));
assert("login shown when unauthenticated", gateTs.includes('setHidden(LOGIN_ID, false)'));

assert(`${GATE_TS} no service_role`, !/service_role|SERVICE_ROLE/.test(gateTs));

const leakPatterns = [
  /console\.log\([^)]*access_token/i,
  /console\.log\([^)]*refresh_token/i,
  /console\.log\([^)]*password/i,
];
assert(`${GATE_TS} no token/password logging`, !leakPatterns.some((re) => re.test(gateTs)));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

const g9j5Diff = spawnSync(
  "git",
  ["diff", "--name-only", "HEAD", "--", "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("G-9j5 runner not modified", g9j5Diff.stdout.trim() === "");

assert(
  "staging-auth-ui refreshes gate after login",
  read("src/lib/admin/staging-auth/staging-auth-ui.ts").includes("refreshStagingAdminAuthGate"),
);

assert(
  "auth gate has staging-auth-page-config bridge",
  gateComponent.includes('id="staging-auth-page-config"') &&
    gateComponent.includes("data-staging-auth-enabled") &&
    gateComponent.includes("data-admin-auth-provider") &&
    gateComponent.includes("data-supabase-configured"),
);

assert(
  "getStagingAuthConfig reads page config bridge",
  read("src/lib/admin/staging-auth/staging-auth-config.ts").includes(
    "readStagingAuthPageConfigFromDom",
  ),
);

assert(
  "staging-auth-ui does not read ENABLE_ADMIN_STAGING_AUTH directly",
  !read("src/lib/admin/staging-auth/staging-auth-ui.ts").includes(
    "ENABLE_ADMIN_STAGING_AUTH",
  ),
);

assert(
  "PUBLIC_ADMIN_AUTH_PROVIDER used in page config bridge",
  read("src/lib/admin/staging-auth/staging-auth-page-config.ts").includes(
    "PUBLIC_ADMIN_AUTH_PROVIDER",
  ),
);

const prior = spawnSync(
  "node",
  [path.join(TOOL_ROOT, "scripts", "verify-g9j5a-gosaki-staging-admin-password-reset-flow.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("verify-g9j5a passes", prior.status === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
