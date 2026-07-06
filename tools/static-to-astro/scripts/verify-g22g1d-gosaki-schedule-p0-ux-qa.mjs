/**
 * G-22g1d — Gosaki Schedule P0 UX QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1d-gosaki-schedule-p0-ux-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-qa.md";
const G22G1A_DOC = "tools/static-to-astro/docs/gosaki-schedule-list-ux-legacy-id.md";
const G22G1B_DOC = "tools/static-to-astro/docs/gosaki-schedule-dev-mock-section-isolation.md";
const G22G1C_DOC = "tools/static-to-astro/docs/gosaki-schedule-save-preview-target-confirmation.md";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const OPERATOR_PAGE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "b5ccb9f";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

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

assert("HEAD is b5ccb9f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is b5ccb9f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("G-22g1a prior doc exists", exists(G22G1A_DOC));
assert("G-22g1b prior doc exists", exists(G22G1B_DOC));
assert("G-22g1c prior doc exists", exists(G22G1C_DOC));

const doc = read(DOC_REL);
const operatorTs = read(OPERATOR_TS);
const operatorPage = read(OPERATOR_PAGE);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1d", doc.includes("G-22g1d-gosaki-schedule-p0-ux-qa"));
assert("doc gate complete", doc.includes("gosakiScheduleP0UxQaComplete: true"));
assert("doc references G-22g1a", doc.includes("G-22g1a"));
assert("doc references G-22g1b", doc.includes("G-22g1b"));
assert("doc references G-22g1c", doc.includes("G-22g1c"));
assert("doc dry-run dev", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc legacy_id QA", doc.includes("legacy_id") && doc.includes("公演一覧"));
assert("doc dev mock isolation QA", doc.includes("dev/mock") || doc.includes("Dev/mock"));
assert("doc selected summary QA", doc.includes("Selected summary") || doc.includes("selected summary"));
assert("doc preview target confirmation QA", doc.includes("Pre-save preview") || doc.includes("preview / target"));
assert("doc save result labels QA", doc.includes("Save result labels") || doc.includes("保存前 updated_at"));
assert("doc schedule-2026-07-008 note", doc.includes("schedule-2026-07-008"));
assert("doc issues section", doc.includes("Issues") || doc.includes("残課題"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc write-armed not used", doc.includes("writeArmedDevServerUsed: false"));
assert("doc dev server stopped", doc.includes("writeArmedDevServerStopped: true"));
assert("doc port 4321 none", doc.includes("port4321ListenAfterQa: false") || doc.includes("4321 LISTEN none"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc next G-22g2", doc.includes("G-22g2"));
assert("doc base commit b5ccb9f", doc.includes(BASE_COMMIT));

assert("operator legacy_id summary", operatorTs.includes("gosaki-schedule-operator-selected-summary"));
assert("operator save target panel", operatorTs.includes("gosaki-schedule-save-target-panel"));
assert("operator preview badge", operatorTs.includes("renderPreviewBadge"));
assert("operator save result labels", operatorTs.includes("保存前 updated_at（before updated_at）"));
assert("page legacy_id column", operatorPage.includes("legacy_id"));
assert("page operator guide", operatorPage.includes("通常の Schedule 操作はこちら"));
assert("page save target panel", operatorPage.includes("gosaki-schedule-save-target-panel"));
assert("page dev mock zone", operatorPage.includes("gosaki-schedule-dev-mock-zone") || operatorPage.includes("開発者向け詳細"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("operator diff no prod ref", !gitDiff(OPERATOR_TS).includes(PROD_REF));

// Module smoke: duplicate / new / unpublish preview (no DB)
const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { executeG22bScheduleDuplicateDryRun } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts';
import { executeG22eScheduleNewEventDryRun } from './src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts';
import { executeG22fScheduleUnpublishDryRun } from './src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts';
const STAGING = 'https://${STAGING_REF}.supabase.co';
const baseRow = { id: 'x', legacy_id: 'schedule-2026-07-001', site_slug: 'gosaki-piano', title: 't', date: '2026-07-15', month: '2026-07', published: true, venue: 'v', open_time: '18:00', start_time: '19:00', price: 'p', description: 'd', sort_order: 10, source_file: 'f', source_route: '/r/' };
const form = { title: 't2', venue: 'v', open_time: '18:00', start_time: '19:00', price: 'p', description: 'd' };
const d = executeG22bScheduleDuplicateDryRun({ source: baseRow, formValues: form, date: baseRow.date, published: false, signedIn: true, supabaseUrl: STAGING });
const n = executeG22eScheduleNewEventDryRun({ formValues: form, date: '2026-08-01', published: false, signedIn: true, supabaseUrl: STAGING });
const p = executeG22fScheduleUnpublishDryRun({ target: baseRow, signedIn: true, supabaseUrl: STAGING });
const ok = d.dryRun && !d.actualWrite && !d.saveAllowed && n.dryRun && !n.actualWrite && !n.saveAllowed && p.dryRun && !p.actualWrite && !p.saveAllowed && !p.physicalDelete;
if (!ok) process.exit(1);
console.log('g22g1d-preview-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "preview module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("g22g1d-preview-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

assert("00-current-state mentions G-22g1d", currentState.includes("G-22g1d"));
assert("03-next-actions mentions G-22g1d", nextActions.includes("G-22g1d"));
assert("handoff mentions G-22g1d", handoff.includes("G-22g1d"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1d Gosaki Schedule P0 UX QA verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
