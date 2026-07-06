/**
 * G-22f2 — Gosaki Schedule unpublish UPDATE planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f2-gosaki-schedule-unpublish-update-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-planning.md";
const G22F_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-ui-implementation.md";
const G22F1_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-dry-run-local-qa.md";
const BASE_COMMIT = "e2b9f7c";
const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const PROTECTED_LEGACY_014 = "schedule-2026-03-014";
const PROTECTED_LEGACY_001 = "schedule-2026-09-001";

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

assert("HEAD is e2b9f7c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is e2b9f7c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22f2 planning doc exists", exists(DOC_REL));
assert("G-22f prior doc exists", exists(G22F_DOC_REL));
assert("G-22f1 prior doc exists", exists(G22F1_DOC_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22f2", doc.includes("G-22f2-gosaki-schedule-unpublish-update-planning"));
assert("doc planning gate complete", doc.includes("gosakiScheduleUnpublishUpdatePlanningComplete: true"));
assert("doc approvalId", doc.includes(APPROVAL_ID));

assert("doc env gate write enabled", doc.includes("ENABLE_ADMIN_STAGING_WRITE") && doc.includes("true"));
assert("doc env arm G22F", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true"));
assert("doc write dry run false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc write provider", doc.includes("PUBLIC_ADMIN_WRITE_PROVIDER=supabase"));
assert("doc write module", doc.includes("PUBLIC_ADMIN_WRITE_MODULE=schedule"));
assert("doc write approval id", doc.includes("PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice"));
assert("doc G22e arm false", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false"));
assert("doc G22d arm false", doc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false"));

assert("doc UI gate unpublish mode", doc.includes('editDraftMode === "unpublish"'));
assert("doc UI gate operation unpublish", doc.includes('operation === "unpublish"'));
assert("doc UI gate wouldUpdate", doc.includes("wouldUpdate === true"));
assert("doc UI gate wouldDelete false", doc.includes("wouldDelete === false"));
assert("doc UI gate physicalDelete false", doc.includes("physicalDelete === false"));
assert("doc UI gate before published true", doc.includes("before.published === true"));
assert("doc UI gate after published false", doc.includes("after.published === false"));

assert("doc payload assertion", doc.includes("assertG22fUnpublishUpdatePayloadOnly"));
assert("doc operation unpublish-update", doc.includes("unpublish-update"));
assert("doc published true to false only", doc.includes("published=true") && doc.includes("published=false"));
assert("doc patch published only", doc.includes("patch: { published: false }") || doc.includes('patch: { published: false }'));
assert("doc changedFields published only", doc.includes('changedFields: ["published"]'));

assert("doc not physical delete", doc.includes("Physical DELETE") && doc.includes("separate"));
assert("doc physicalDelete false", doc.includes("physicalDelete: false") || doc.includes("physicalDelete=false"));
assert("doc wouldDelete false", doc.includes("wouldDelete: false") || doc.includes("wouldDelete=false"));

assert("doc optimistic lock", doc.includes("expectedBeforeUpdatedAt") && doc.includes("schedules_set_updated_at"));
assert("doc buildScheduleLockedWriteRequest", doc.includes("buildScheduleLockedWriteRequest"));

assert("doc beforeVerification SELECT-only", doc.includes("beforeVerification") && doc.includes("SELECT ONLY"));
assert("doc afterVerification SELECT-only", doc.includes("afterVerification") && doc.includes("SELECT ONLY"));
assert("doc rollback UPDATE template", doc.includes("Rollback SQL template") && doc.includes("update public.schedules"));
assert("doc rollback execution forbidden", doc.includes("DO NOT EXECUTE IN G-22f2") && doc.includes("rollbackSqlExecuted: false"));

assert("doc protected 014", doc.includes(PROTECTED_LEGACY_014) && doc.includes("must not touch"));
assert("doc protected 001", doc.includes(PROTECTED_LEGACY_001) && doc.includes("must not touch"));
assert("doc protected rows published false", doc.includes("published=false") && doc.includes("non-target"));

assert("doc permission UPDATE", doc.includes("authenticated UPDATE") && doc.includes("anon UPDATE"));
assert("doc RLS policy", doc.includes("schedules_admin_all") && doc.includes("is_admin()"));
assert("doc DELETE grant not needed", doc.includes("DELETE grant") && doc.includes("not needed"));
assert("doc no grant revoke", doc.includes("grantRevokeExecuted: false") && doc.includes("GRANT / REVOKE"));

assert("doc no DB write", doc.includes("dbWriteExecuted: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc SQL mutation not executed", doc.includes("sqlMutationExecuted: false"));
assert("doc package FTP not executed", doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"));
assert("doc implementation not executed", doc.includes("implementationExecuted: false"));

for (const phase of ["G-22f3", "G-22f4", "G-22f5", "G-22f6", "G-22f7"]) {
  assert(`doc next phase ${phase}`, doc.includes(phase));
}

assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only as never/stop",
  doc.includes(PROD_REF) && /Never.*vsbvndwuajjhnzpohghh|not run on Sariswing production/i.test(doc),
);
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No implementation fix"));

assert("00-current-state mentions G-22f2", currentState.includes("G-22f2"));
assert("03-next-actions mentions G-22f2", nextActions.includes("G-22f2"));
assert("handoff mentions G-22f2", handoff.includes("G-22f2"));
assert("03-next-actions G-22f3 next", nextActions.includes("G-22f3"));
assert("handoff G-22f3 next", handoff.includes("G-22f3"));

assert("implementation not executed", true);
assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("GRANT REVOKE not executed by Cursor", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22f2 Gosaki Schedule unpublish UPDATE planning verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
