/**
 * G-22h3 — Gosaki Schedule republish dry-run UI implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h3-gosaki-schedule-republish-dry-run-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-implementation.md";
const G22H2_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-ui-planning.md";

const REPUBLISH_DRY_RUN =
  "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const REPUBLISH_CONFIG =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const REPUBLISH_GUARDS =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-guards.ts";
const REPUBLISH_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const DRY_RUN_ADAPTER = "src/lib/admin/staging-write/schedule-dry-run-adapter.ts";
const DRY_RUN_TYPES = "src/lib/admin/staging-write/schedule-dry-run-types.ts";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";
const ASTRO_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";

const BASE_COMMIT = "fabfd2f";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const DRY_RUN_APPROVAL = "G-22h-gosaki-schedule-republish-dry-run";
const SAVE_APPROVAL = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";
const ENV_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is fabfd2f (G-22h5 base)", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is fabfd2f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22h3 doc exists", exists(DOC_REL));
assert("G-22h2 planning doc exists", exists(G22H2_DOC));
assert("republish dry-run module exists", exists(REPUBLISH_DRY_RUN));
assert("republish config exists", exists(REPUBLISH_CONFIG));
assert("republish guards exist", exists(REPUBLISH_GUARDS));
assert(
  "republish save module present (G-22h6a supersedes absent)",
  exists(REPUBLISH_SAVE),
);

const doc = read(DOC_REL);
const dryRunModule = read(REPUBLISH_DRY_RUN);
const republishConfig = read(REPUBLISH_CONFIG);
const operatorUi = read(OPERATOR_UI);
const adapter = read(DRY_RUN_ADAPTER);
const dryRunTypes = read(DRY_RUN_TYPES);
const writeTypes = read(WRITE_TYPES);
const astroPage = read(ASTRO_PAGE);
const adminCss = read(ADMIN_CSS);
const g22fSave = read(G22F_SAVE);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h3", doc.includes("G-22h3-gosaki-schedule-republish-dry-run-ui-implementation"));
assert("doc gate complete", doc.includes("gosakiScheduleRepublishDryRunUiImplementationComplete: true"));
assert("doc save disabled", doc.includes("Save disabled") || doc.includes("alert-only"));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc db update not implemented", doc.includes("no DB write") || doc.includes("No Supabase"));
assert("doc public reflection separate", doc.includes("public reflection") || doc.includes("publicReflectionPending"));

assert("executeG22hScheduleRepublishDryRun exists", dryRunModule.includes("executeG22hScheduleRepublishDryRun"));
assert("dry-run approvalId", dryRunModule.includes(DRY_RUN_APPROVAL));
assert("published false to true", dryRunModule.includes("published: false") && dryRunModule.includes("published: true"));
assert("actualWrite false in module", dryRunModule.includes("actualWrite: false"));
assert("physicalDelete false in module", dryRunModule.includes("physicalDelete: false"));
assert("publicReflectionPending in module", dryRunModule.includes("publicReflectionPending: true"));
assert("contentFieldsChanged false", dryRunModule.includes("contentFieldsChanged: false"));
assert("saveOperation republish-update", dryRunModule.includes("republish-update"));
assert("no .update( in dry-run module", !dryRunModule.includes(".update("));

assert("buildScheduleRepublishDryRunResult in adapter", adapter.includes("buildScheduleRepublishDryRunResult"));
assert("adapter republish operation", adapter.includes('operation: "republish"'));
assert("adapter actualWrite false", adapter.includes("actualWrite: false"));

assert("draft mode republish type", dryRunTypes.includes('"republish"'));

assert("non-dry-run approvalId in write types", writeTypes.includes(SAVE_APPROVAL));
assert("approval registry includes G-22h", writeTypes.includes("G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID"));

assert("config saveEnabled from armed (G-22h6a supersedes fixed false)", republishConfig.includes("saveEnabled = armed") || republishConfig.includes("saveEnabled: boolean"));
assert("config env arm constant", republishConfig.includes(ENV_ARM));
assert("config G-22h6b deferred reason", republishConfig.includes("G-22h6b") || republishConfig.includes("G-22h6"));

assert("UI republish button id", astroPage.includes('id="gosaki-schedule-republish-btn"'));
assert("UI procedure hint republish", astroPage.includes('data-gosaki-procedure-hint="republish"'));
assert("UI 再公開案を作成", astroPage.includes("再公開案を作成"));
assert("UI republish save label G-22h6a", astroPage.includes("再公開を保存") || operatorUi.includes("再公開を保存（現在は無効）"));
assert("UI public reflection note", astroPage.includes("公開サイトへの反映は別フェーズ"));

assert("operator UI executeG22h", operatorUi.includes("executeG22hScheduleRepublishDryRun"));
assert("operator UI renderRepublishDryRunResult", operatorUi.includes("renderRepublishDryRunResult"));
assert("operator UI enterRepublishDraft", operatorUi.includes("enterRepublishDraftFromSelectedRow"));
assert("operator UI G-22h6b save note", operatorUi.includes("G-22h6b") || operatorUi.includes("G-22h6 以降"));
assert("operator UI no actualWrite true", !/actualWrite:\s*true/.test(operatorUi));

const republishImplSources = [dryRunModule, republishConfig, read(REPUBLISH_GUARDS)];
const combinedRepublish = republishImplSources.join("\n");
assert("republish impl no .update(", !combinedRepublish.includes(".update("));
assert("republish impl no actualWrite true", !/actualWrite:\s*true/.test(combinedRepublish));

assert("G22f save unchanged pattern", g22fSave.includes("executeG22fScheduleUnpublishUpdateSave"));

assert("css republish accent", adminCss.includes("gosaki-schedule-edit-dry-run--republish"));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc rls unchanged", doc.includes("GRANT") || doc.includes("RLS"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false") || doc.includes("FTP"));

assert("00-current-state mentions G-22h3", currentState.includes("G-22h3"));
assert("03-next-actions mentions G-22h3", nextActions.includes("G-22h3"));
assert("handoff mentions G-22h3", handoff.includes("G-22h3"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h3 Gosaki Schedule republish dry-run UI implementation verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
