/**
 * G-14b1d — Gosaki routine edit Save execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1d-gosaki-schedule-routine-edit-save-execution-result.mjs
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

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-routine-edit-save-execution-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-final-preflight.md";
const G14C_DOC_REL = "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const TARGET_ID = "14230329-dde5-40d6-b9b3-75aefe140daf";
const TARGET_LEGACY = "schedule-2026-04-005";
const TARGET_DATE = "2026-04-12";
const BEFORE_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";
const AFTER_UPDATED_AT = "2026-06-27T17:18:54.986868+00:00";
const PRICE_BEFORE = "3,300円(tax in)";
const PRICE_AFTER = "3,300円（税込）";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9G3G_APPROVAL = "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";

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

assert("G-14b1d execution result doc exists", exists(DOC_REL));
assert("doc phase G-14b1d", doc.includes("G-14b1d-gosaki-schedule-routine-edit-save-execution-result"));
assert("doc save success gate", doc.includes("gosakiScheduleRoutineEditSaveSuccess: true"));
assert("doc execution complete gate", doc.includes("gosakiScheduleRoutineEditExecutionComplete: true"));
assert("doc readyForG14b1e", doc.includes("readyForG14b1ePublicReflection: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorSave false", doc.includes("cursorClickedSave: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY));
assert("doc target date", doc.includes(TARGET_DATE));
assert("doc before updated_at", doc.includes(BEFORE_UPDATED_AT));
assert("doc after updated_at", doc.includes(AFTER_UPDATED_AT));
assert("doc price before", doc.includes(PRICE_BEFORE));
assert("doc price after", doc.includes(PRICE_AFTER));
assert("doc rowsAffected 1", doc.includes("rowsAffected") && doc.includes("**1**"));
assert("doc G9k approval", doc.includes(G9K_APPROVAL));
assert("doc G9k UI path", doc.includes("変更を確認") && doc.includes("更新する"));
assert("doc G9g3g not used", doc.includes(G9G3G_APPROVAL) && doc.includes("Not used"));
assert("doc save success message", doc.includes("保存成功"));
assert("doc changedFields price", doc.includes("price"));
assert("doc show_on_home false", doc.includes("show_on_home") && doc.includes("false"));
assert("doc published true", doc.includes("published") && doc.includes("true"));
assert("doc staging host", doc.includes(STAGING_PROJECT_REF));
assert("doc production stop", doc.includes(PRODUCTION_PROJECT_REF));
assert("doc event A not touched", doc.includes("eventATouched: false"));
assert("doc event B not touched", doc.includes("eventBTouched: false"));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc july not reuploaded", doc.includes("julyReuploadTriggered: false"));
assert("doc excludes Event A id", doc.includes(EVENT_A_ID));
assert("doc excludes Event B id", doc.includes(EVENT_B_ID));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc G-14b1e next", doc.includes("G-14b1e"));
assert("doc 2026-04 reflection route", doc.includes("2026-04"));
assert("doc do not re-click Save", doc.includes("Do not re-click"));

assert("G-14b1c preflight doc exists", exists(PREFLIGHT_DOC_REL));
assert("preflight target matches", preflightDoc.includes(TARGET_ID));
assert("G-14c playbook doc exists", exists(G14C_DOC_REL));

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
      assert("live title unchanged", row.title === "<Trio>");
      assert("live venue unchanged", row.venue === "吉祥寺 Strings");
      assert("live price after Save", row.price === PRICE_AFTER);
      assert("live show_on_home false", row.show_on_home === false);
      assert("live published true", row.published === true);
      assert("live updated_at after Save", row.updated_at === AFTER_UPDATED_AT);
      assert("live updated_at newer than before", row.updated_at !== BEFORE_UPDATED_AT);
    }

    const eventAUrl = new URL(`${env.PUBLIC_SUPABASE_URL}/rest/v1/schedules`);
    eventAUrl.searchParams.set("id", `eq.${EVENT_A_ID}`);
    eventAUrl.searchParams.set("select", "id,updated_at");
    const eventARes = await fetch(eventAUrl, {
      headers: {
        apikey: env.PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    const eventARows = await eventARes.json();
    if (eventARows?.[0]) {
      assert("Event A row still readable", eventARows[0].id === EVENT_A_ID);
    }

    const eventBUrl = new URL(`${env.PUBLIC_SUPABASE_URL}/rest/v1/schedules`);
    eventBUrl.searchParams.set("id", `eq.${EVENT_B_ID}`);
    eventBUrl.searchParams.set("select", "id,updated_at");
    const eventBRes = await fetch(eventBUrl, {
      headers: {
        apikey: env.PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    const eventBRows = await eventBRes.json();
    if (eventBRows?.[0]) {
      assert("Event B row still readable", eventBRows[0].id === EVENT_B_ID);
    }
  } catch (error) {
    assert("live SELECT fetch", false, error instanceof Error ? error.message : String(error));
  }
} else {
  console.log("SKIP live SELECT — env validation failed");
}

console.log(`\nG-14b1d execution result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
