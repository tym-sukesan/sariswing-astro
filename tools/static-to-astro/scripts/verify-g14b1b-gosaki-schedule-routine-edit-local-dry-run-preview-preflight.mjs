/**
 * G-14b1b — Gosaki routine edit local dry-run Preview preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight.mjs
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
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-local-dry-run-preview-preflight.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-flow-next-poc-planning.md";
const G14B1A_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-practical-save-enablement-implementation.md";
const DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-dry-run.ts";
const OPERATOR_UI_REL =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const GOSAKI_PATHS_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/gosaki-staging-admin-paths.ts";
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
const PRACTICAL_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED";
const LEGACY_G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";

const FORBIDDEN_MARKERS = [
  "[CMS Kit staging]",
  "[G-14b1 routine PoC]",
  "PoC",
  "UI保存テスト",
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

const doc = read(DOC_REL);

assert("G-14b1b preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-14b1b",
  doc.includes("G-14b1b-gosaki-schedule-routine-edit-local-dry-run-preview-preflight"),
);
assert(
  "doc preflight complete gate",
  doc.includes("gosakiScheduleRoutineEditLocalDryRunPreviewPreflightComplete: true"),
);
assert("doc readyForG14b1bResult", doc.includes("readyForG14b1bResultOperatorDryRunPreview: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorPreview false", doc.includes("cursorPreviewExecuted: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY));
assert("doc target date", doc.includes(TARGET_DATE));
assert("doc updated_at baseline", doc.includes(TARGET_UPDATED_AT));
assert("doc price before", doc.includes(PRICE_BEFORE));
assert("doc price after proposal", doc.includes(PRICE_AFTER));
assert("doc show_on_home false", doc.includes("show_on_home") && doc.includes("false"));
assert("doc staging host", doc.includes(STAGING_PROJECT_REF));
assert("doc production stop", doc.includes(PRODUCTION_PROJECT_REF));
assert("doc Preview-only env", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc practical arm off", doc.includes(`${PRACTICAL_ARM}`) && doc.includes("unset or false"));
assert("doc legacy g9k arm off", doc.includes(`${LEGACY_G9K_ARM}`) && doc.includes("unset or false"));
assert("doc expected dryRun true", doc.includes("dryRun") && doc.includes("`true`"));
assert("doc expected actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert(
  "doc expected saveReadiness",
  doc.includes("ready_but_save_disabled"),
);
assert("doc changedFields price only", doc.includes('["price"]'));
assert("doc stop conditions", doc.includes("Stop conditions"));
assert("doc excludes Event A", doc.includes(EVENT_A_ID));
assert("doc excludes Event B", doc.includes(EVENT_B_ID));
assert("doc operator procedure", doc.includes("変更を確認"));
assert("doc no Save click", doc.includes("Do not") && doc.includes("更新する"));

for (const marker of FORBIDDEN_MARKERS) {
  assert(`doc price proposal avoids ${marker}`, !doc.includes(`Operator enters** | \`${marker}`));
  assert(`doc forbidden list includes ${marker}`, doc.includes(marker));
}

assert("G-14b1 planning doc exists", exists(PLAN_DOC_REL));
assert("G-14b1a impl doc exists", exists(G14B1A_DOC_REL));
assert("G-9k dry-run module exists", exists(DRY_RUN_REL));
assert("dry-run has ready_but_save_disabled", read(DRY_RUN_REL).includes("ready_but_save_disabled"));
assert("dry-run has actualWrite false", read(DRY_RUN_REL).includes("actualWrite: false"));
assert("operator UI has dry-run btn id", read(OPERATOR_UI_REL).includes("gosaki-schedule-edit-dry-run-btn"));
assert(
  "gosaki schedule admin route",
  read(GOSAKI_PATHS_REL).includes("/__admin-staging-shell/musician-basic/admin/schedule/"),
);

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
    url.searchParams.set("legacy_id", `eq.${TARGET_LEGACY}`);
    url.searchParams.set("site_slug", "eq.gosaki-piano");
    url.searchParams.set(
      "select",
      "id,legacy_id,site_slug,date,title,venue,price,show_on_home,updated_at",
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
      assert("live id matches doc", row.id === TARGET_ID);
      assert("live legacy_id", row.legacy_id === TARGET_LEGACY);
      assert("live date", row.date === TARGET_DATE);
      assert("live title", row.title === "<Trio>");
      assert("live venue", row.venue === "吉祥寺 Strings");
      assert("live price", row.price === PRICE_BEFORE);
      assert("live show_on_home false", row.show_on_home === false);
      assert("live updated_at matches doc", row.updated_at === TARGET_UPDATED_AT);
    }
  } catch (error) {
    assert("live SELECT fetch", false, error instanceof Error ? error.message : String(error));
  }
} else {
  console.log("SKIP live SELECT — env validation failed (doc-only mode)");
}

console.log(`\nG-14b1b preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
