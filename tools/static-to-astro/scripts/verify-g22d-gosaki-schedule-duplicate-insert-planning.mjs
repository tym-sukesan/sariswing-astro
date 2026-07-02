/**
 * G-22d — Gosaki Schedule duplicate INSERT planning / final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d-gosaki-schedule-duplicate-insert-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-planning.md";
const G22C_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-dry-run-local-qa.md";
const SCHEMA_AUDIT_REL = "tools/static-to-astro/docs/schedule-schema-read-audit-result.md";
const BASE_COMMIT = "428ed61";

const G22B_MODULE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const SCHEDULE_OPERATOR_TS =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const SOURCE_LEGACY = "schedule-2026-03-003";
const EXPECTED_INSERT_LEGACY = "schedule-2026-03-014";
const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";

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

assert("HEAD is 428ed61", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 428ed61", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22d planning doc exists", exists(DOC_REL));
assert("G-22c prior doc exists", exists(G22C_DOC_REL));
assert("schema audit doc exists", exists(SCHEMA_AUDIT_REL));

const doc = read(DOC_REL);
const g22cDoc = read(G22C_DOC_REL);
const g22bModule = read(G22B_MODULE);
const writeAdapter = read(WRITE_ADAPTER);
const g9kSave = read(G9K_SAVE);
const scheduleTs = read(SCHEDULE_OPERATOR_TS);

assert("doc phase G-22d", doc.includes("G-22d-gosaki-schedule-duplicate-insert-planning"));
assert("doc planning gate complete", doc.includes("gosakiScheduleDuplicateInsertPlanningComplete: true"));
assert("doc ready for G-22d1", doc.includes("readyForG22d1DuplicateInsertImplementation: true"));
assert("doc ready for G-22d2 preflight", doc.includes("readyForG22d2DuplicateInsertFinalPreflight: true"));
assert("doc G-22d3 not ready until execution", doc.includes("readyForG22d3DuplicateInsertOperatorExecution: false"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc no cursor db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod ref", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit or G-22d2b drift note", doc.includes("d1fa0a8") || doc.includes("G-22d2b"));

assert("doc source row id", doc.includes(SOURCE_ID));
assert("doc source legacy_id", doc.includes(SOURCE_LEGACY));
assert("doc spot-check title", doc.includes("<Live & Session>"));
assert("doc copy title suffix", doc.includes("<Live & Session>（コピー）"));

assert("doc legacy_id Option B recommended", doc.includes("Option B"));
assert("doc expected insert legacy_id", doc.includes(EXPECTED_INSERT_LEGACY));
assert("doc published false on insert", doc.includes("published") && doc.includes("false"));
assert("doc show_on_home false", doc.includes("show_on_home"));
assert("doc sort_order 70", doc.includes("70") && doc.includes("G-22d2b"));
assert("doc source_file schedule-2026-03", doc.includes("schedule-2026-03.html"));
assert("doc no stale slice sort_order 140", !doc.match(/\| `sort_order` \| `140`/));

assert("doc ENABLE_ADMIN_STAGING_WRITE true", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc env arm DUPLICATE_INSERT", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_ARMED"));

assert("doc insert adapter separate", doc.includes("schedule-insert-write-adapter"));
assert("doc g22b separation", doc.includes("G-22b") && doc.includes("G-22d"));
assert("doc sourceId fixed guard", doc.includes(SOURCE_ID));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano"));

assert("doc rollback DELETE template", doc.includes("delete from public.schedules"));
assert("doc beforeSnapshot SELECT", doc.includes("beforeSnapshot"));
assert("doc afterVerification SELECT", doc.includes("afterVerification"));
assert("doc public reflection deferred", doc.includes("G-22h") || doc.includes("public reflection"));

assert("doc G-22d1 phase", doc.includes("G-22d1"));
assert("doc G-22d2 phase", doc.includes("G-22d2"));
assert("doc G-22d3 phase", doc.includes("G-22d3"));
assert("doc schedule_months read-only", doc.includes("schedule_months"));

assert("G-22c was complete", g22cDoc.includes("gosakiScheduleDuplicateDryRunLocalQaComplete: true"));

assert("g22b module still dry-run only", g22bModule.includes("executeG22bScheduleDuplicateDryRun"));
assert("g22b saveAllowed false", g22bModule.includes("saveAllowed: false"));
assert("g22b no insert call", !g22bModule.includes(".insert("));

assert("write adapter still update-only", writeAdapter.includes("updateScheduleWrite"));
assert("write adapter no insertScheduleWrite", !writeAdapter.includes("insertScheduleWrite"));

assert("g9k save no insert", !g9kSave.includes(".insert("));
assert(
  "operator duplicate save default disabled label",
  scheduleTs.includes("複製案を保存（現在は無効）"),
);

for (const rel of [G22B_MODULE]) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("doc gen_random_uuid id policy", doc.includes("gen_random_uuid"));
assert("doc date NOT NULL awareness", doc.includes("date") && doc.includes("NOT NULL"));

console.log(`\nG-22d Gosaki Schedule duplicate INSERT planning verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
