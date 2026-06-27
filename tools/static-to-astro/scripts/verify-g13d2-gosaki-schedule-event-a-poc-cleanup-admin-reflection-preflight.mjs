/**
 * G-13d2 — Gosaki Event A PoC cleanup admin reflection preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.md";
const G13D1_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-local-implementation.md";
const OPERATOR_ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_ROUTE_REL =
  "src/pages/__admin-staging-shell/musician-basic/admin/schedule/index.astro";
const READ_ONLY_ADMIN_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const ASTRO_CONFIG_REL = "astro.config.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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

const doc = read(DOC_REL);
const g13d1Doc = read(G13D1_DOC_REL);
const operatorAstro = read(OPERATOR_ASTRO_REL);
const scheduleRoute = read(SCHEDULE_ROUTE_REL);
const readOnlyAdmin = read(READ_ONLY_ADMIN_REL);
const buildScript = read(BUILD_SCRIPT_REL);
const astroConfig = read(ASTRO_CONFIG_REL);

assert("G-13d2 doc exists", exists(DOC_REL));
assert("doc phase G-13d2", doc.includes("G-13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight"));
assert("doc references G-13d1", doc.includes("G-13d1") && exists(G13D1_DOC_REL));
assert("doc operator template path", doc.includes("AdminGosakiStagingScheduleOperatorPage.astro"));
assert("doc staging shell route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc local dev procedure", doc.includes("npm run dev"));
assert("doc package not required for G-13c1", doc.includes("不要") || doc.includes("not required"));
assert("doc read-only admin separate", doc.includes("read-only") && doc.includes("G-13c1"));
assert("doc save gate off safe", doc.includes("saveEnabled") || doc.includes("Save gate"));
assert("doc no package regen this phase", doc.includes("packageRegenExecuted") && doc.includes("**false**"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc why not DB write yet", doc.includes("G-13d1-final-preflight") || doc.includes("Save / DB write"));
assert("doc upload paths section", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc next local dev verify", doc.includes("G-13d2-admin-reflection-local-dev-verify") || doc.includes("local-dev-verify"));

assert("G-13d1 doc has G-13c1 section", g13d1Doc.includes("G-13c1"));
assert("operator astro G-13c1 panel", operatorAstro.includes("gosaki-schedule-g13c1-event-a-poc-cleanup"));
assert("operator astro imports cleanup ui", operatorAstro.includes("gosaki-schedule-event-a-poc-cleanup-ui.ts"));
assert(
  "schedule route imports GosakiStagingAdminSchedulePage",
  scheduleRoute.includes("GosakiStagingAdminSchedulePage.astro"),
);
assert(
  "schedule route DEV + ENABLE_ADMIN_STAGING_SHELL gate",
  scheduleRoute.includes("ENABLE_ADMIN_STAGING_SHELL") && scheduleRoute.includes("isDev"),
);
assert(
  "astro injectRoute schedule admin",
  astroConfig.includes("/__admin-staging-shell/musician-basic/admin/schedule"),
);
assert(
  "read-only admin hook separate",
  readOnlyAdmin.includes("GOSAKI_READ_ONLY_ADMIN_PAGE_REL") &&
    readOnlyAdmin.includes("src/pages/admin/index.astro"),
);
assert(
  "read-only admin no G-13c1",
  !readOnlyAdmin.includes("g13c1") && !readOnlyAdmin.includes("G-13c1"),
);
assert("build script runs manual-upload", buildScript.includes("manual-upload:package"));
assert(
  "cleanup config save gate off default",
  read("src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts").includes(
    "G13C1_EVENT_A_POC_CLEANUP_SAVE_DISABLED_DEFAULT_REASON",
  ),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-13d2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
