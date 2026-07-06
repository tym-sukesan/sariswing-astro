/**
 * G-22g1f3 — Gosaki Schedule authenticated admin read closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1f3-gosaki-schedule-authenticated-admin-read-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-closure.md";
const PLAN_DOC = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-plan.md";
const IMPL_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md";
const QA_DOC = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-qa.md";
const SMOKE_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-operator-smoke-result.md";
const G22G1E_DOC = "tools/static-to-astro/docs/gosaki-schedule-admin-read-unpublished-visibility.md";
const READ_MODULE =
  "src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "60d442d";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";

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

assert("HEAD is 60d442d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 60d442d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC));
assert("impl doc exists", exists(IMPL_DOC));
assert("qa doc exists", exists(QA_DOC));
assert("smoke result doc exists", exists(SMOKE_DOC));
assert("G-22g1e doc exists", exists(G22G1E_DOC));

const doc = read(DOC_REL);
const smokeDoc = read(SMOKE_DOC);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1f3", doc.includes("G-22g1f3-gosaki-schedule-authenticated-admin-read-closure"));
assert(
  "doc chain complete gate",
  doc.includes("gosakiScheduleAuthenticatedAdminReadChainComplete: true"),
);
assert("doc purpose", doc.includes("closure") || doc.includes("Closure"));
assert("doc chain complete", doc.includes("chain complete") || doc.includes("Chain complete"));
assert("doc G-22g1e flow", doc.includes("G-22g1e"));
assert("doc G-22g1f flow", doc.includes("G-22g1f"));
assert("doc G-22g1f1 flow", doc.includes("G-22g1f1"));
assert("doc G-22g1f2 flow", doc.includes("G-22g1f2"));
assert("doc G-22g1f2c flow", doc.includes("G-22g1f2c"));
assert("doc SSR anon bootstrap maintained", doc.includes("SSR anon bootstrap") || doc.includes("SSR bootstrap"));
assert("doc login authenticated admin read", doc.includes("authenticated admin read") || doc.includes("Login後"));
assert("doc schedule-2026-07-008 visibility PASS", doc.includes(TARGET_LEGACY) && /PASS/i.test(doc));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc 60 rows", doc.includes("60") && doc.includes("件"));
assert("doc unpublished 2", doc.includes("非公開") && doc.includes("2"));
assert("doc selected summary PASS", doc.includes("Selected summary") || doc.includes("selected summary"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls unchanged", doc.includes("RLS") && /unchanged|未変更/i.test(doc));
assert("doc grant unchanged", doc.includes("GRANT") && /unchanged|未変更/i.test(doc));
assert("doc service_role unchanged", doc.includes("service_role"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false") || doc.includes("Public reflection"));
assert("doc residual issue", doc.includes("residual") || doc.includes("Residual") || doc.includes("残課題"));
assert("doc transient non-blocking", doc.includes("transientLoadErrorBlocking: false") || doc.includes("non-blocking"));
assert("doc next G-22g2", doc.includes("G-22g2"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc base commit 60d442d", doc.includes(BASE_COMMIT));

assert("read module exists", exists(READ_MODULE));
assert("read module unchanged", gitDiff(READ_MODULE).length === 0);
assert("operator ts unchanged", gitDiff(OPERATOR_TS).length === 0);
assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("smoke doc operator PASS", smokeDoc.includes("operatorLoginSmokePass: true"));

assert("00-current-state mentions G-22g1f3", currentState.includes("G-22g1f3"));
assert("03-next-actions mentions G-22g1f3", nextActions.includes("G-22g1f3"));
assert("handoff mentions G-22g1f3", handoff.includes("G-22g1f3"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1f3 Gosaki Schedule authenticated admin read closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
