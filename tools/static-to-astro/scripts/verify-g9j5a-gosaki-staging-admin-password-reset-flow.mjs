/**
 * G-9j5a — Gosaki staging admin password reset flow verifier.
 * Run: node tools/static-to-astro/scripts/verify-g9j5a-gosaki-staging-admin-password-reset-flow.mjs
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

const FORGOT_ROUTE =
  "src/pages/__admin-staging-shell/musician-basic/auth/forgot-password/index.astro";
const RESET_ROUTE =
  "src/pages/__admin-staging-shell/musician-basic/auth/reset-password/index.astro";
const FORGOT_TS = "src/lib/admin/staging-auth/staging-forgot-password.ts";
const RESET_TS = "src/lib/admin/staging-auth/staging-reset-password-page.ts";
const PATHS_TS = "src/lib/admin/staging-auth/staging-auth-paths.ts";
const G9J5_RUN = "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs";

const forgotRouteSrc = read(FORGOT_ROUTE);
const resetRouteSrc = read(RESET_ROUTE);
const forgotTsSrc = read(FORGOT_TS);
const resetTsSrc = read(RESET_TS);
const pathsTsSrc = read(PATHS_TS);

assert("forgot-password route exists", fs.existsSync(path.join(REPO_ROOT, FORGOT_ROUTE)));
assert("reset-password route exists", fs.existsSync(path.join(REPO_ROOT, RESET_ROUTE)));
assert(
  "forgot route imports Gosaki forgot page",
  forgotRouteSrc.includes("GosakiStagingAdminForgotPasswordPage"),
);
assert(
  "reset route imports Gosaki reset page",
  resetRouteSrc.includes("GosakiStagingAdminResetPasswordPage"),
);

assert("resetPasswordForEmail used", forgotTsSrc.includes("resetPasswordForEmail"));
assert(
  "redirectTo uses staging reset-password path",
  forgotTsSrc.includes("getStagingResetPasswordRedirectUrl") &&
    pathsTsSrc.includes("/auth/reset-password/"),
);
assert(
  "redirectTo built from window.location.origin",
  pathsTsSrc.includes("window.location.origin"),
);

assert(
  "updateUser password used",
  resetTsSrc.includes("updateStagingAuthPassword") &&
    read("src/lib/admin/staging-auth/staging-password-reset-callback.ts").includes(
      "updateUser({ password",
    ),
);
assert(
  "recovery session via ensureStagingRecoverySession",
  resetTsSrc.includes("ensureStagingRecoverySession"),
);

const stagingAuthFiles = [
  FORGOT_TS,
  RESET_TS,
  PATHS_TS,
  "src/lib/admin/staging-auth/staging-password-reset-callback.ts",
  "src/lib/admin/staging-auth/supabase-staging-auth-client.ts",
];

for (const rel of stagingAuthFiles) {
  const src = read(rel);
  assert(`${rel} no service_role`, !/service_role|SERVICE_ROLE/.test(src));
}

const sensitiveLogPatterns = [
  /console\.log\([^)]*access_token/i,
  /console\.log\([^)]*refresh_token/i,
  /console\.log\([^)]*password/i,
  /console\.log\([^)]*location\.href/i,
  /console\.log\([^)]*location\.hash/i,
];

for (const rel of [FORGOT_TS, RESET_TS]) {
  const src = read(rel);
  const leaks = sensitiveLogPatterns.some((re) => re.test(src));
  assert(`${rel} no token/password/hash logging`, !leaks);
}

const adminPagesDir = path.join(REPO_ROOT, "src/pages/admin");
const adminBefore = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged in working tree", adminBefore.stdout.trim() === "");

assert(
  "G-9j5 run script not modified in this phase",
  !spawnSync("git", ["diff", "--name-only", "HEAD", "--", G9J5_RUN], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).stdout.trim(),
);

assert(
  "login shell links to forgot-password route",
  read(
    "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAuthGate.astro",
  ).includes("GOSAKI_STAGING_AUTH_FORGOT_PASSWORD_PATH"),
);

const astroConfig = read("astro.config.mjs");
assert(
  "astro.config injects forgot-password route",
  astroConfig.includes("/auth/forgot-password"),
);
assert(
  "astro.config injects reset-password route",
  astroConfig.includes("/auth/reset-password"),
);

const priorVerifiers = [
  "verify-g9j5-gosaki-schedule-existing-event-auth-email-guard.mjs",
  "verify-g9j2-gosaki-schedule-existing-event-update-dry-run-ui-wiring.mjs",
];

for (const script of priorVerifiers) {
  const result = spawnSync("node", [path.join(TOOL_ROOT, "scripts", script)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
