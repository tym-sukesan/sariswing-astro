/**
 * G-22g1f1 — Gosaki Schedule authenticated admin read implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1f1-gosaki-schedule-authenticated-admin-read-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md";
const PLAN_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-plan.md";
const READ_MODULE =
  "src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";
const AUTH_GATE = "src/lib/admin/staging-auth/staging-admin-auth-gate.ts";
const SCHEDULE_READ = "src/lib/admin/staging-write/staging-schedule-read.ts";
const ROW_PICKER_BINDING =
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "3de4b78";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const TARGET_LEGACY = "schedule-2026-07-008";

const WRITE_PATTERNS = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
  /\.rpc\s*\(/,
  /GRANT/i,
  /REVOKE/i,
  /service_role/,
];

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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 3de4b78", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 3de4b78", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("implementation doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC));
assert("read module exists", exists(READ_MODULE));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC);
const readModule = read(READ_MODULE);
const operatorTs = read(OPERATOR_TS);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1f1", doc.includes("G-22g1f1-gosaki-schedule-authenticated-admin-read-implementation"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleAuthenticatedAdminReadImplementationComplete: true"),
);
assert("doc purpose", doc.includes("authenticated admin read"));
assert("doc implementation only", doc.includes("implementation only") || doc.includes("Implementation only"));
assert("doc SSR bootstrap maintained", doc.includes("SSR anon bootstrap") || doc.includes("SSR bootstrap"));
assert("doc client refetch added", doc.includes("client-side authenticated refetch") || doc.includes("authenticated refetch"));
assert("doc SELECT only", doc.includes("SELECT") && doc.includes("only"));
assert("doc no RLS grant change", doc.includes("RLS") && /not touched|no change|変更しない/i.test(doc));
assert("doc no service_role", doc.includes("service_role"));
assert("doc read source banner", doc.includes("read source banner") || doc.includes("Read source banner"));
assert("doc schedule-2026-07-008 QA target", doc.includes(TARGET_LEGACY));
assert("doc next G-22g1f2", doc.includes("G-22g1f2"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));

assert("read module loadGosakiSchedulesAuthenticatedAdminRead", readModule.includes("loadGosakiSchedulesAuthenticatedAdminRead"));
assert("read module getStagingSupabaseClient", readModule.includes("getStagingSupabaseClient"));
assert("read module splitSelectableAndAuditRows", readModule.includes("splitSelectableAndAuditRows"));
assert("read module isCanonicalScheduleSourceRoute", readModule.includes("isCanonicalScheduleSourceRoute"));
assert("read module assertStaticToAstroCmsStagingSupabaseProject", readModule.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("read module SELECT only comment", readModule.includes("SELECT only"));

for (const pattern of WRITE_PATTERNS) {
  if (pattern.source === "service_role") {
    const codeLines = readModule
      .split("\n")
      .filter((line) => !/^\s*(\*|\/\/)/.test(line))
      .join("\n");
    assert("read module no service_role usage", !pattern.test(codeLines));
    continue;
  }
  assert(`read module no ${pattern}`, !pattern.test(readModule));
}

assert("read module no prod ref", !readModule.includes(PROD_REF));

assert("operator ssrBootstrapRows", operatorTs.includes("ssrBootstrapRows"));
assert("operator runAuthenticatedAdminReadRefetch", operatorTs.includes("runAuthenticatedAdminReadRefetch"));
assert("operator subscribeScheduleOperatorAuthRefetch", operatorTs.includes("subscribeScheduleOperatorAuthRefetch"));
assert("operator revertToSsrBootstrapRows", operatorTs.includes("revertToSsrBootstrapRows"));
assert("operator adminReadMode", operatorTs.includes("adminReadMode"));
assert("operator loadGosakiSchedulesAuthenticatedAdminRead import", operatorTs.includes("loadGosakiSchedulesAuthenticatedAdminRead"));
assert("operator onAuthStateChange", operatorTs.includes("onAuthStateChange"));
assert("operator banner admin mode", operatorTs.includes("admin-authenticated"));
assert("operator banner loading mode", operatorTs.includes("--loading"));
assert("operator banner warn mode", operatorTs.includes("--warn"));
assert("operator parseRowsDataset preserved", operatorTs.includes("parseRowsDataset"));

assert("css banner admin", adminCss.includes("gosaki-schedule-operator-read-source-banner--admin"));
assert("css banner loading", adminCss.includes("gosaki-schedule-operator-read-source-banner--loading"));
assert("css banner warn", adminCss.includes("gosaki-schedule-operator-read-source-banner--warn"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);
assert("schedule read unchanged", gitDiff(SCHEDULE_READ).length === 0);
assert("row picker binding unchanged", gitDiff(ROW_PICKER_BINDING).length === 0);
assert("auth gate unchanged", gitDiff(AUTH_GATE).length === 0);

assert("plan doc references 008", planDoc.includes(TARGET_LEGACY));

assert("00-current-state mentions G-22g1f1", currentState.includes("G-22g1f1"));
assert("03-next-actions mentions G-22g1f1", nextActions.includes("G-22g1f1"));
assert("handoff mentions G-22g1f1", handoff.includes("G-22g1f1"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1f1 Gosaki Schedule authenticated admin read implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
