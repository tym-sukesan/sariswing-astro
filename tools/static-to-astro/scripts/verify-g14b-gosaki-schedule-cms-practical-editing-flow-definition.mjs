/**
 * G-14b — Gosaki Schedule CMS practical editing flow definition verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b-gosaki-schedule-cms-practical-editing-flow-definition.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-cms-practical-editing-flow-definition.md";
const G14A_REL =
  "tools/static-to-astro/docs/gosaki-cms-completion-roadmap-gap-inventory.md";
const G13E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md";
const OPERATOR_UI_REL =
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const GUARDS_REL = "src/lib/admin/staging-write/schedule-write-guards.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
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
const guards = read(GUARDS_REL);

assert("G-14b doc exists", exists(DOC_REL));
assert(
  "doc phase G-14b",
  doc.includes("G-14b-gosaki-schedule-cms-practical-editing-flow-definition"),
);
assert(
  "doc flow definition complete gate",
  doc.includes("gosakiScheduleCmsPracticalEditingFlowDefinitionComplete: true"),
);
assert("doc operator journey", doc.includes("Operator journey"));
assert("doc routine edit flow", doc.includes("Routine edit flow"));
assert("doc dry-run Preview", doc.includes("dry-run Preview"));
assert("doc changedFields", doc.includes("changedFields"));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc public reflection G-14c", doc.includes("G-14c"));
assert("doc failure flow", doc.includes("Emergency stop") || doc.includes("failure flow"));
assert("doc optimistic lock stale", doc.includes("stale") || doc.includes("optimistic lock"));
assert("doc shell vs online admin", doc.includes("staging shell") && doc.includes("online admin"));
assert("doc G-13c1 generalization", doc.includes("G-13c1"));
assert("doc G-13c2 Event B", doc.includes("G-13c2"));
assert("doc MVP scope", doc.includes("MVP"));
assert("doc deferred scope", doc.includes("後回し") || doc.includes("Defer"));
assert("doc date month defer", doc.includes("date") && doc.includes("month"));
assert("doc rollback policy", doc.includes("rollback"));
assert("doc readyForG14c true", doc.includes("readyForG14cPublicReflectionOperationStandardization: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc G-9k approval path", doc.includes("G-9k-gosaki-schedule-existing-event-save-button-non-dry-run"));
assert("doc multi-field Save", doc.includes("multi-field"));

for (const field of SAFE_FIELDS) {
  assert(`doc field ${field}`, doc.includes(field));
  assert(`guards safe field ${field}`, guards.includes(`"${field}"`));
}

assert("doc forbids date in MVP", doc.includes("date") && (doc.includes("Defer") || doc.includes("❌")));
assert("doc INSERT deferred", doc.includes("INSERT") || doc.includes("新規"));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));

assert("G-14a doc exists", exists(G14A_REL));
assert("G-13e closure doc exists", exists(G13E_CLOSURE_REL));
assert("operator UI exists", exists(OPERATOR_UI_REL));
assert("G-9k save exists", exists(SAVE_REL));
assert("operator UI uses G9K safe fields", read(OPERATOR_UI_REL).includes("G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS"));
assert(
  "save uses afterSnapshot",
  read(SAVE_REL).includes("afterSnapshot"),
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

console.log(
  `\nG-14b practical editing flow verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
