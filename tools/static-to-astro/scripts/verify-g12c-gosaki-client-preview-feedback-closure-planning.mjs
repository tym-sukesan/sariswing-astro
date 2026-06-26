/**
 * G-12c — Gosaki client preview feedback closure planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g12c-gosaki-client-preview-feedback-closure-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const PLANNING_DOC =
  "tools/static-to-astro/docs/gosaki-client-preview-feedback-closure-planning.md";
const CHECKLIST_DOC = "tools/static-to-astro/docs/gosaki-client-preview-feedback-closure.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

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

const planning = read(PLANNING_DOC);
const checklist = read(CHECKLIST_DOC);

assert("G-12c planning doc exists", fs.existsSync(path.join(REPO_ROOT, PLANNING_DOC)));
assert("checklist doc exists", fs.existsSync(path.join(REPO_ROOT, CHECKLIST_DOC)));
assert("planning phase G-12c", planning.includes("G-12c-gosaki-client-preview-feedback-closure-planning"));
assert("planning complete", planning.includes("planning complete"));
assert("planning staging URL", planning.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));
assert("planning references checklist", planning.includes("gosaki-client-preview-feedback-closure.md"));
assert("planning YouTube section", planning.includes("YouTube") && planning.includes("G-11c15"));
assert("planning Schedule section", planning.includes("Schedule") && planning.includes("G-12b"));
assert("planning client questions", planning.includes("Questions to ask the client") || planning.includes("フィードバック"));
assert("planning internal only", planning.includes("Internal only") || planning.includes("do not share"));
assert("planning Phase 2 conditions", planning.includes("Phase 2") && planning.includes("entry conditions"));
assert("planning feedback not collected", planning.includes("feedback not yet collected") || planning.includes("false"));
assert("planning no DB write", planning.includes("cursorDbWriteExecuted") && planning.includes("**false**"));
assert("planning no FTP", planning.includes("ftpUploadExecuted") && planning.includes("**false**"));
assert("planning no deploy", planning.includes("deployExecuted") && planning.includes("**false**"));
assert("planning no Save", planning.includes("cursorSaveExecuted") && planning.includes("**false**"));
assert("planning next phase", planning.includes("G-12c-result") || planning.includes("G-12d"));
assert("planning gate true", planning.includes("gosakiClientPreviewFeedbackClosurePlanningComplete") && planning.includes("**true**"));
assert("planning G-12b complete ref", planning.includes("gosakiPublicScheduleReadVerificationComplete"));

assert("checklist G-12c refresh", checklist.includes("G-12c"));
assert("checklist YouTube G-11c15", checklist.includes("G-11c15"));
assert("checklist schedule G-12b", checklist.includes("G-12b") || checklist.includes("scheduleDataSource=supabase"));
assert("checklist staging URL", checklist.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));

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

assert(
  "no real email in planning doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(planning),
);

console.log(`\nG-12c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
