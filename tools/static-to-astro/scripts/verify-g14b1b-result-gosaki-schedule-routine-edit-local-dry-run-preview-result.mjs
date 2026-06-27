/**
 * G-14b1b-result — Gosaki routine edit local dry-run Preview result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1b-result-gosaki-schedule-routine-edit-local-dry-run-preview-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  loadGosakiStagingAdminPublicEnv,
  validateGosakiStagingAdminPublicEnv,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "./lib/gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-local-dry-run-preview-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md";
const G14B1A_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-practical-save-enablement-implementation.md";
const FLOW_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-cms-practical-editing-flow-definition.md";
const G9K_DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-dry-run.ts";
const G9G1_DRY_RUN_REL = "src/lib/admin/staging-data/staging-schedule-site-slug-edit-dry-run.ts";
const G9G3G_CONFIG_REL =
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const OPERATOR_PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const EDIT_SECTION_REL =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro";
const SCHEDULE_PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/schedule-write-types.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const TARGET_LEGACY = "schedule-2026-04-005";
const TARGET_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";
const PRICE_BEFORE = "3,300円(tax in)";
const PRICE_AFTER = "3,300円（税込）";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9G3G_APPROVAL = "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const PRACTICAL_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED";
const G9G3G_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";

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
const preflightDoc = read(PREFLIGHT_DOC_REL);
const writeTypes = read(WRITE_TYPES_REL);
const g9kConfig = read(G9K_CONFIG_REL);

assert("G-14b1b-result doc exists", exists(DOC_REL));
assert(
  "doc phase G-14b1b-result",
  doc.includes("G-14b1b-result-gosaki-schedule-routine-edit-local-dry-run-preview-result"),
);
assert("doc result complete gate", doc.includes("gosakiScheduleRoutineEditLocalDryRunPreviewResultComplete: true"));
assert("doc readyForG14b1c", doc.includes("readyForG14b1cFinalPreflight: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorPreview false", doc.includes("cursorPreviewExecuted: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY));
assert("doc updated_at baseline", doc.includes(TARGET_UPDATED_AT));
assert("doc price before", doc.includes(PRICE_BEFORE));
assert("doc price after", doc.includes(PRICE_AFTER));
assert("doc actualWrite false", doc.includes("actualWrite") && doc.includes("**false**"));
assert("doc dryRun true", doc.includes("dryRun") && doc.includes("**true**"));
assert("doc changedFields price only", doc.includes("price") && doc.includes("only"));
assert("doc optimisticLock stale false", doc.includes("optimisticLock.stale") && doc.includes("**false**"));
assert("doc staging host", doc.includes(STAGING_PROJECT_REF));
assert("doc production stop", doc.includes(PRODUCTION_PROJECT_REF));
assert("doc Preview button used", doc.includes("Preview G-9 site_slug general edit dry-run"));
assert("doc no Save click", doc.includes("Save operational general edit"));
assert("doc DB unchanged price", doc.includes(PRICE_BEFORE) && doc.includes("unchanged"));
assert("doc path consistency section", doc.includes("Save path consistency check"));
assert("doc G-9k approval for Save", doc.includes(G9K_APPROVAL));
assert("doc G-9g3g not routine Save", doc.includes(G9G3G_APPROVAL) && doc.includes("do not use"));
assert("doc g14b1a no code change", doc.includes("no code change required") || doc.includes("no implementation fix"));
assert("doc optional G-9k Preview", doc.includes("変更を確認"));
assert("doc excludes Event A", doc.includes(EVENT_A_ID));
assert("doc excludes Event B", doc.includes(EVENT_B_ID));
assert("doc practical arm", doc.includes(PRACTICAL_ARM));
assert("doc G9G3G arm off for Save", doc.includes(G9G3G_ARM));

assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));
assert("preflight target matches", preflightDoc.includes(TARGET_ID));
assert("G-14b1a doc exists", exists(G14B1A_DOC_REL));
assert("flow doc exists", exists(FLOW_DOC_REL));
assert("flow doc G-9k product approval", read(FLOW_DOC_REL).includes(G9K_APPROVAL));

assert("G9K approval in write types", writeTypes.includes(G9K_APPROVAL));
assert("G9G3G approval in write types", writeTypes.includes(G9G3G_APPROVAL));
assert("G9k dry-run module exists", exists(G9K_DRY_RUN_REL));
assert("G9g1 dry-run module exists", exists(G9G1_DRY_RUN_REL));
assert("G9g3g config exists", exists(G9G3G_CONFIG_REL));
assert("G9k config mutual exclusion g9g3g", g9kConfig.includes("SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV"));
assert("operator page 変更を確認", read(OPERATOR_PAGE_REL).includes("変更を確認"));
assert("edit section G-9 preview label", read(EDIT_SECTION_REL).includes("Preview G-9 site_slug general edit dry-run"));
assert("schedule page dev-tools details", read(SCHEDULE_PAGE_REL).includes("開発者向け詳細"));
assert("schedule page operator first", read(SCHEDULE_PAGE_REL).indexOf("AdminGosakiStagingScheduleOperatorPage") < read(SCHEDULE_PAGE_REL).indexOf("AdminStagingScheduleSiteSlugEditSection"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const env = loadGosakiStagingAdminPublicEnv();
const validation = validateGosakiStagingAdminPublicEnv(env);
if (validation.ok) {
  const host = new URL(env.PUBLIC_SUPABASE_URL).hostname;
  assert("live env staging host", host === `${STAGING_PROJECT_REF}.supabase.co`);
  assert("live env not production", !host.includes(PRODUCTION_PROJECT_REF));

  try {
    const url = new URL(`${env.PUBLIC_SUPABASE_URL}/rest/v1/schedules`);
    url.searchParams.set("id", `eq.${TARGET_ID}`);
    url.searchParams.set("select", "id,legacy_id,price,updated_at");
    const res = await fetch(url, {
      headers: {
        apikey: env.PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    assert("live SELECT HTTP ok", res.ok, String(res.status));
    const rows = await res.json();
    assert("live SELECT row count 1", Array.isArray(rows) && rows.length === 1);
    if (rows?.[0]) {
      const row = rows[0];
      assert("live price unchanged", row.price === PRICE_BEFORE);
      assert("live updated_at unchanged", row.updated_at === TARGET_UPDATED_AT);
    }
  } catch (error) {
    assert("live SELECT fetch", false, error instanceof Error ? error.message : String(error));
  }
} else {
  console.log("SKIP live SELECT — env validation failed");
}

console.log(`\nG-14b1b-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
