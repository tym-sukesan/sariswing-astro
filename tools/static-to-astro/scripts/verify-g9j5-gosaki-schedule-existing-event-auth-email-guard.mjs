/**
 * G-9j5 — Gosaki schedule existing event auth email guard (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9j5-gosaki-schedule-existing-event-auth-email-guard.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const RUN_SCRIPT = "run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs";
const SAFETY_DOC = "gosaki-supabase-project-identity-safety-preflight.md";

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

const runScriptPath = path.join(TOOL_ROOT, "scripts", RUN_SCRIPT);
const runScriptSrc = fs.readFileSync(runScriptPath, "utf8");
const safetyDocSrc = fs.readFileSync(path.join(TOOL_ROOT, `docs/${SAFETY_DOC}`), "utf8");

assert("G-9j5 run script exists", fs.existsSync(runScriptPath));
assert("no git config user.email fallback", !runScriptSrc.includes("git config user.email"));
assert("no spawnSync git email lookup", !runScriptSrc.includes('spawnSync("git"'));
assert("G9J5_STAGING_ADMIN_EMAIL required path", runScriptSrc.includes("G9J5_STAGING_ADMIN_EMAIL"));
assert("SUPABASE_ADMIN_EMAIL fallback path", runScriptSrc.includes("SUPABASE_ADMIN_EMAIL"));
assert(
  "explicit email STOP message",
  runScriptSrc.includes(
    "explicit staging admin email is required. Set G9J5_STAGING_ADMIN_EMAIL or SUPABASE_ADMIN_EMAIL",
  ),
);
assert(
  "G9J5_STAGING_ADMIN_EMAIL priority before SUPABASE_ADMIN_EMAIL",
  runScriptSrc.indexOf("G9J5_STAGING_ADMIN_EMAIL") <
    runScriptSrc.indexOf("SUPABASE_ADMIN_EMAIL_ENV"),
);
assert("interactive read command documented", runScriptSrc.includes('read "G9J5_STAGING_ADMIN_EMAIL'));
assert(
  "password not printed to console",
  !/console\.log\([^)]*adminPassword/i.test(runScriptSrc) &&
    !/console\.log\([^)]*password/i.test(runScriptSrc),
);
assert("signIn uses adminPassword variable only", runScriptSrc.includes("password: adminPassword"));
assert(
  "safety doc explicit email policy",
  safetyDocSrc.includes("Do not fall back to git config user.email"),
);
assert(
  "safety doc developer identity rule",
  safetyDocSrc.includes("Git user.email is a developer identity"),
);
assert("safety doc interactive re-run command", safetyDocSrc.includes('read "G9J5_STAGING_ADMIN_EMAIL'));
assert("safety doc DB write not executed note", safetyDocSrc.includes("DB UPDATE not executed"));

const { resolveG9j5ExplicitAdminEmail } = await import(
  pathToFileURL(runScriptPath).href
);

const empty = resolveG9j5ExplicitAdminEmail({});
assert("empty env returns no email", empty.email === null);

const g9j5Only = resolveG9j5ExplicitAdminEmail({
  G9J5_STAGING_ADMIN_EMAIL: "operator@example.com",
});
assert("G9J5_STAGING_ADMIN_EMAIL wins", g9j5Only.email === "operator@example.com");
assert("G9J5_STAGING_ADMIN_EMAIL source", g9j5Only.source === "G9J5_STAGING_ADMIN_EMAIL");

const supabaseOnly = resolveG9j5ExplicitAdminEmail({
  SUPABASE_ADMIN_EMAIL: "staging-admin@example.com",
});
assert("SUPABASE_ADMIN_EMAIL used when G9J5 unset", supabaseOnly.email === "staging-admin@example.com");

const g9j5Wins = resolveG9j5ExplicitAdminEmail({
  G9J5_STAGING_ADMIN_EMAIL: "g9j5@example.com",
  SUPABASE_ADMIN_EMAIL: "other@example.com",
});
assert("G9J5_STAGING_ADMIN_EMAIL beats SUPABASE_ADMIN_EMAIL", g9j5Wins.email === "g9j5@example.com");

for (const script of [
  "verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs",
  "verify-g9j1-gosaki-schedule-existing-event-update-guards-and-dry-run.mjs",
  "verify-g9j2-gosaki-schedule-existing-event-update-dry-run-ui-wiring.mjs",
  "verify-g9j4-gosaki-schedule-existing-event-update-one-row-preflight.mjs",
  "verify-g9j45-gosaki-supabase-project-identity-safety-preflight.mjs",
]) {
  const result = spawnSync("node", [`tools/static-to-astro/scripts/${script}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
