/**
 * G-14b1c — Gosaki routine edit final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1c-gosaki-schedule-routine-edit-final-preflight.mjs
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

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-routine-edit-final-preflight.md";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-local-dry-run-preview-result.md";
const G14B1A_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-practical-save-enablement-implementation.md";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const OPERATOR_PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const EDIT_SECTION_REL =
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const TARGET_LEGACY = "schedule-2026-04-005";
const TARGET_DATE = "2026-04-12";
const TARGET_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";
const PRICE_BEFORE = "3,300円(tax in)";
const PRICE_AFTER = "3,300円（税込）";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9G3G_APPROVAL = "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const PRACTICAL_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED";
const LEGACY_G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
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

assert("G-14b1c final preflight doc exists", exists(DOC_REL));
assert("doc phase G-14b1c", doc.includes("G-14b1c-gosaki-schedule-routine-edit-final-preflight"));
assert("doc preflight complete gate", doc.includes("gosakiScheduleRoutineEditFinalPreflightComplete: true"));
assert("doc readyForG14b1d", doc.includes("readyForG14b1dRoutineEditPocExecution: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorSave false", doc.includes("cursorSaveExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY));
assert("doc target date", doc.includes(TARGET_DATE));
assert("doc updated_at baseline", doc.includes(TARGET_UPDATED_AT));
assert("doc price before", doc.includes(PRICE_BEFORE));
assert("doc price after", doc.includes(PRICE_AFTER));
assert("doc show_on_home false", doc.includes("show_on_home") && doc.includes("false"));
assert("doc published true", doc.includes("published") && doc.includes("true"));
assert("doc staging host", doc.includes(STAGING_PROJECT_REF));
assert("doc production stop", doc.includes(PRODUCTION_PROJECT_REF));
assert("doc G9k approval", doc.includes(G9K_APPROVAL));
assert("doc practical arm on", doc.includes(`${PRACTICAL_ARM}=true`));
assert("doc G9G3G arm off", doc.includes(G9G3G_ARM) && doc.includes("unset"));
assert("doc legacy g9k arm off", doc.includes(LEGACY_G9K_ARM) && doc.includes("unset"));
assert("doc G9g3g excluded", doc.includes(G9G3G_APPROVAL) && doc.includes("Not"));
assert("doc operator 変更を確認", doc.includes("変更を確認"));
assert("doc operator 更新する", doc.includes("更新する"));
assert("doc dev-tools excluded", doc.includes("Save operational general edit"));
assert("doc saveReadiness ready_to_save", doc.includes("ready_to_save"));
assert("doc afterVerification SELECT", doc.includes("afterVerification SELECT"));
assert("doc rollback template", doc.includes("DO NOT EXECUTE"));
assert("doc rollback price revert", doc.includes(PRICE_BEFORE) && doc.includes("rollback"));
assert("doc stop conditions", doc.includes("Stop conditions"));
assert("doc G9g3g surface stop", doc.includes("G-9g3g Save surface"));
assert("doc excludes Event A", doc.includes(EVENT_A_ID));
assert("doc excludes Event B", doc.includes(EVENT_B_ID));
assert("doc G9K_SAVE_BUTTON_SAVE_ENABLED", doc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED=true"));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));

assert("G-14b1b-result doc exists", exists(RESULT_DOC_REL));
assert("G-14b1a doc exists", exists(G14B1A_DOC_REL));
assert("G9k config exists", exists(G9K_CONFIG_REL));
assert("operator page 変更を確認", read(OPERATOR_PAGE_REL).includes("変更を確認"));
assert("edit section G9g3g save label", read(EDIT_SECTION_REL).includes("Save operational general edit"));

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
    url.searchParams.set("site_slug", "eq.gosaki-piano");
    url.searchParams.set("legacy_id", `eq.${TARGET_LEGACY}`);
    url.searchParams.set(
      "select",
      "id,site_slug,legacy_id,date,title,venue,open_time,start_time,price,description,show_on_home,published,updated_at",
    );
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
      assert("live id", row.id === TARGET_ID);
      assert("live legacy_id", row.legacy_id === TARGET_LEGACY);
      assert("live date", row.date === TARGET_DATE);
      assert("live title", row.title === "<Trio>");
      assert("live venue", row.venue === "吉祥寺 Strings");
      assert("live price", row.price === PRICE_BEFORE);
      assert("live show_on_home false", row.show_on_home === false);
      assert("live published true", row.published === true);
      assert("live updated_at", row.updated_at === TARGET_UPDATED_AT);
    }
  } catch (error) {
    assert("live SELECT fetch", false, error instanceof Error ? error.message : String(error));
  }
} else {
  console.log("SKIP live SELECT — env validation failed");
}

console.log(`\nG-14b1c final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
